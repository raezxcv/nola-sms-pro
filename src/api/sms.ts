const WEBHOOK_URL = "/api/sms";
const SENDER_NAME = "NOLACRM";

interface SendSmsResponse {
  success?: boolean;
  message?: string;
  error?: string;
  status?: string;
  number?: string;
}

/**
 * Normalize Philippine phone numbers to 09XXXXXXXXX
 * This matches most PHP + Semaphore wrappers
 */
const normalizePHNumber = (input: string): string | null => {
  if (!input) return null;

  const digits = input.replace(/\D/g, "");

  // 09XXXXXXXXX → +639XXXXXXXXX
  if (digits.startsWith("09") && digits.length === 11) {
    return "+63" + digits.substring(1);
  }

  // 9XXXXXXXXX → +639XXXXXXXXX
  if (digits.startsWith("9") && digits.length === 10) {
    return "+63" + digits;
  }

  // 63XXXXXXXXXX → +63XXXXXXXXXX
  if (digits.startsWith("63") && digits.length === 12) {
    return "+" + digits;
  }

  // +639XXXXXXXXX → valid
  if (digits.startsWith("639") && digits.length === 12) {
    return "+" + digits;
  }

  return null;
};

const isValidPHNumber = (number: string): boolean => {
  return /^\+639\d{9}$/.test(number);
};

export const sendSms = async (
  phoneNumber: string,
  message: string
): Promise<SendSmsResponse> => {
  if (!phoneNumber || !message) {
    return {
      success: false,
      message: "Phone number and message are required",
    };
  }

  const formattedNumber = normalizePHNumber(phoneNumber);

  if (!formattedNumber || !isValidPHNumber(formattedNumber)) {
    return {
      success: false,
      message: "Invalid Philippine mobile number",
    };
  }

  const params = new URLSearchParams();
  params.append("number", formattedNumber);
  params.append("message", message);
  params.append("sendername", SENDER_NAME);

  console.log("Sending SMS:", {
    number: formattedNumber,
    message,
  });

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("SMS API Response:", data);

    if (data?.status === "error") {
      return {
        success: false,
        message: data.message || "SMS sending failed",
      };
    }

    return {
      success: true,
      message: data.message || "Message sent successfully",
    };
  } catch (error) {
    console.error("SMS Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "SMS failed",
    };
  }
};

export const sendBulkSms = async (
  phoneNumbers: string[],
  message: string
): Promise<SendSmsResponse[]> => {
  const results: SendSmsResponse[] = [];

  for (const phone of phoneNumbers) {
    const result = await sendSms(phone, message);
    results.push(result);
  }

  return results;
};