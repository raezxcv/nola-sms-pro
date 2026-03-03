<?php
header('Content-Type: application/json');

// Enable error reporting for debugging (disable in production)
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

require __DIR__ . '/firestore_client.php';

// 1. Authenticate with standardized header
$headers = getallheaders();
$receivedSecret = $headers['X-Webhook-Secret'] ?? $headers['x-webhook-secret'] ?? '';

// Using the same secret as send_sms.php for consistency
if ($receivedSecret !== 'f7RkQ2pL9zV3tX8cB1nS4yW6') {
    http_response_code(401);
    die(json_encode(["status" => "error", "message" => "Unauthorized"]));
}

// 2. Get Parameters
$number = $_GET['number'] ?? '';
if (!$number) {
    http_response_code(400);
    die(json_encode(["status" => "error", "message" => "Phone number required"]));
}

try {
    // 3. Query Firestore
    $db = get_firestore();

    // Query logs where this number is the recipient
    // We order by date_created descending to show newest messages first
    $logs = $db->collection('sms_logs')
        ->where('number', '=', $number)
        ->orderBy('date_created', 'DESC')
        ->limit(100)
        ->documents();

    $results = [];
    foreach ($logs as $doc) {
        if ($doc->exists()) {
            $data = $doc->data();

            // Format timestamps for JSON
            if (isset($data['date_created']) && $data['date_created'] instanceof \Google\Cloud\Core\Timestamp) {
                $data['date_created'] = $data['date_created']->get()->format('c');
            }

            $results[] = array_merge(['id' => $doc->id()], $data);
        }
    }

    echo json_encode($results);
}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Firestore error: " . $e->getMessage()
    ]);
}
