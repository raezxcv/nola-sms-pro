import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLOUD_RUN_URL = "https://smspro-api.nolacrm.io";
const WEBHOOK_SECRET = "f7RkQ2pL9zV3tX8cB1nS4yW6";
const NOLA_LOCATION_ID = "ugBqfQsPtGijLjrmLdmA";
const NOLA_API_TOKEN = "pit-2c6e3df4-9472-4bed-bd7c-fbea8acb2abd";

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
      // Try to fetch contacts from NolaCRM API with the private integration token
      const endpoints = [
        `${CLOUD_RUN_URL}/contacts?locationId=${NOLA_LOCATION_ID}`,
        `${CLOUD_RUN_URL}/webhook/fetch_contacts`,
      ];
      
      let lastError: { status?: number; text?: string; message?: string } | null = null;
      let data = null;
      
      for (const url of endpoints) {
        try {
          console.log('Trying NolaCRM endpoint:', url);
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${NOLA_API_TOKEN}`,
              'X-Webhook-Secret': WEBHOOK_SECRET,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            data = await response.json();
            console.log('NolaCRM API Success:', url);
            break;
          } else {
            const errorText = await response.text();
            console.log('NolaCRM endpoint failed:', response.status, errorText);
            lastError = { status: response.status, text: errorText };
          }
        } catch (e: unknown) {
          lastError = e instanceof Error ? { message: e.message } : { message: 'Unknown error' };
        }
      }
      
      if (!data) {
        console.error('All NolaCRM endpoints failed:', lastError);
        return res.status(lastError?.status || 500).json({ 
          error: 'Failed to fetch contacts',
          details: lastError?.text || lastError?.message 
        });
      }
      
      // Handle different response formats
      let contacts = [];
      if (Array.isArray(data)) {
        contacts = data;
      } else if (data.contacts) {
        contacts = data.contacts;
      } else if (data.data) {
        contacts = data.data;
      }
      
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
