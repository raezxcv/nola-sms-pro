import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLOUD_RUN_URL = "https://smspro-api.nolacrm.io";
const WEBHOOK_SECRET = "f7RkQ2pL9zV3tX8cB1nS4yW6";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for the response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Webhook-Secret, Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Fetch messages to extract unique phone numbers as contacts
      const messagesUrl = `${CLOUD_RUN_URL}/api/messages?direction=outbound&limit=500`;
      console.log('Fetching messages from:', messagesUrl);
      
      const response = await fetch(messagesUrl, {
        method: 'GET',
        headers: {
          'X-Webhook-Secret': WEBHOOK_SECRET,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Messages API error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: 'Failed to fetch messages',
          details: errorText 
        });
      }

      const data = await response.json();
      console.log('Messages response:', data);
      
      // Extract unique contacts from messages
      const messages = data.data || [];
      const contactsMap: Record<string, { id: string; name: string; phone: string }> = {};
      
      for (const msg of messages) {
        for (const number of msg.numbers || []) {
          // Normalize phone number
          const digits = number.replace(/\D/g, "");
          let normalizedNumber = digits;
          
          if (digits.startsWith("639") && digits.length === 12) {
            normalizedNumber = "0" + digits.substring(2);
          } else if (digits.startsWith("9") && digits.length === 10) {
            normalizedNumber = "0" + digits;
          }
          
          if (normalizedNumber && !contactsMap[normalizedNumber]) {
            contactsMap[normalizedNumber] = {
              id: normalizedNumber,
              name: normalizedNumber,
              phone: normalizedNumber,
            };
          }
        }
      }
      
      const contacts = Object.values(contactsMap);
      console.log('Extracted contacts from messages:', contacts.length);
      return res.status(200).json(contacts);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Proxy failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
