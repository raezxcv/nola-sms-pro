<?php

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Webhook-Secret, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
$config = require __DIR__ . '/config.php';
require __DIR__ . '/firestore_client.php';
require __DIR__ . '/../auth_helpers.php';

$SEMAPHORE_API_KEY = $config['SEMAPHORE_API_KEY'];
$SEMAPHORE_URL = $config['SEMAPHORE_URL'];
$SENDER_IDS = $config['SENDER_IDS'];

validate_api_request();

function log_sms($label, $data)
{
    $log_line = "[" . date('Y-m-d H:i:s') . "] $label: " .
        json_encode($data, JSON_PRETTY_PRINT);

    // Send to Cloud Run logs (Cloud Logging)
    error_log($log_line);
}

function clean_numbers($numberString)
{
    if ($numberString === null || $numberString === '') {
        return [];
    }
    $numbers = is_array($numberString) ? $numberString : explode(',', (string)$numberString);
    $cleanNumbers = [];

    foreach ($numbers as $num) {
        $num = trim((string)$num);
        $num = preg_replace('/[\s\-\.\(\)]/', '', $num);
        if ($num === '')
            continue;

        if (substr($num, 0, 3) === '+63') {
            $num = '0' . substr($num, 3);
        }
        if (preg_match('/^63\d{9}$/', $num)) {
            $num = '0' . substr($num, 2);
        }
        if (preg_match('/^09\d{9}$/', $num)) {
            $cleanNumbers[] = $num;
        }
    }

    return $cleanNumbers;
}

// Handle GET for debugging payload
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $payloadFile = sys_get_temp_dir() . '/last_payload.json';
    if (file_exists($payloadFile)) {
        echo file_get_contents($payloadFile);
    }
    else {
        echo json_encode(["status" => "empty", "message" => "No payload yet"]);
    }
    exit;
}

// Handle POST
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    $payload = $_POST;
}
log_sms("INCOMING", $payload);

$customData = $payload['customData'] ?? [];
// Get number from many possible GHL payload locations (Default vs Custom)
$number_input = $customData['number'] ?? $customData['phone'] ?? $payload['number'] ?? $payload['phone'] ?? '';
if ($number_input === '' && !empty($payload['contact'])) {
    $contact = is_array($payload['contact']) ? $payload['contact'] : [];
    $number_input = $contact['phone'] ?? $contact['phoneNumber'] ?? $contact['number']
        ?? $contact['workPhone'] ?? $contact['cellPhone'] ?? $contact['smartPhone'] ?? $contact['primaryPhone'] ?? '';
}
// GHL sometimes puts phone in customField array
if ($number_input === '' && !empty($payload['contact']['customField'])) {
    $fields = $payload['contact']['customField'];
    if (is_array($fields)) {
        foreach ($fields as $f) {
            if (!empty($f['value']) && preg_match('/^(\+?63|0)\d{9,10}$/', preg_replace('/\s+/', '', (string)$f['value']))) {
                $number_input = trim((string)$f['value']);
                break;
            }
        }
    }
}

$message = trim($customData['message'] ?? $payload['message'] ?? '');
$sender = $customData['sendername'] ?? $payload['sendername'] ?? ($SENDER_IDS[0] ?? "");
$batch_id = $customData['batch_id'] ?? null;
$contact_name = $customData['name'] ?? ($payload['contact']['name'] ?? null);
$recipient_key = $customData['recipient_key'] ?? null; // [NEW] For grouping bulk messages

if (!in_array($sender, $SENDER_IDS)) {
    $sender = $SENDER_IDS[0];
}

$validNumbers = clean_numbers($number_input);
if (empty($validNumbers)) {
    error_log('[send_sms] No valid PH numbers. Received number value: ' . json_encode($number_input) . ' | Payload keys: ' . implode(',', array_keys($payload ?? [])));
    die(json_encode([
        "status" => "error",
        "message" => "No valid Philippine numbers found. In GHL workflow, map Contact Phone to customData.number, or use Default payload so contact.phone is sent. Number must be 09XXXXXXXXX or +639XXXXXXXXX."
    ]));
}

if (empty($message)) {
    die(json_encode(["status" => "error", "message" => "Message cannot be empty"]));
}

// Log payload to temp file
$payloadFile = sys_get_temp_dir() . '/last_payload.json';
file_put_contents($payloadFile, json_encode($payload, JSON_PRETTY_PRINT));

$sms_data = [
    "apikey" => $SEMAPHORE_API_KEY,
    "number" => implode(',', $validNumbers),
    "message" => $message,
    "sendername" => $sender
];

$ch = curl_init($SEMAPHORE_URL);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json", "Accept: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sms_data));

$sms_response = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($sms_response === false) {
    die(json_encode(["status" => "error", "message" => curl_error($ch)]));
}

$result = json_decode($sms_response, true);

if ($http_status == 200 && is_array($result)) {
    $messages = isset($result[0]) ? $result : [$result];
    $db = get_firestore();

    foreach ($messages as $msg) {
        if (isset($msg['message_id'])) {
            $message_id = (string)$msg['message_id'];
            $status = $msg['status'] ?? 'sent';

            // [FIX] Map individual message to its specific recipient number from Semaphore response
            $recipient = $msg['number'] ?? $validNumbers[0];

            $db->collection('sms_logs')
                ->document($message_id)
                ->set([
                'message_id' => $message_id,
                'number' => $recipient,
                'numbers' => [$recipient],
                'message' => $message,
                'sender_id' => $sender,
                'status' => $status,
                'direction' => 'outbound',
                'date_created' => new \Google\Cloud\Core\Timestamp(new \DateTime()),
                'source' => 'api',
                'batch_id' => $batch_id,
                'name' => $contact_name,
                'recipient_key' => $recipient_key, // [NEW] Store recipient key for bulk message grouping
            ], ['merge' => true]);
        }
    }
}

echo json_encode([
    "status" => $http_status == 200 ? "success" : "failed",
    "numbers" => $validNumbers,
    "message" => $message,
    "sender" => $sender,
    "batch_id" => $batch_id,
    "semaphore_status" => $http_status,
    "response" => $result
]);
