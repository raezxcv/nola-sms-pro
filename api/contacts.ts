import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_API_URL = "https://services.leadconnectorhq.com";
const GHL_LOCATION_ID = "ugBqfQsPtGijLjrmLdmA";
const GHL_API_TOKEN = "pit-9c4000ad-590a-47b6-8572-e919dc20d39c";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Fetch contacts from GHL API
      const url = `${GHL_API_URL}/contacts?locationId=${GHL_LOCATION_ID}&limit=100`;
      console.log('Fetching from GHL API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GHL API error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: 'Failed to fetch contacts from GHL',
          details: errorText 
        });
      }

      const data = await response.json();
      console.log('GHL API response:', data);
      
      // Handle GHL response format - contacts might be in data.contacts or data
      let contacts: any[] = [];
      if (Array.isArray(data)) {
        contacts = data;
      } else if (data.contacts) {
        contacts = data.contacts;
      } else if (data.data) {
        contacts = data.data;
      }
      
      // Transform to our format
      const transformedContacts = contacts.map((contact: any) => ({
        id: contact.id,
        name: contact.name || contact.firstName + ' ' + (contact.lastName || ''),
        phone: contact.phone || contact.mobileNumber || '',
        email: contact.email || '',
      })).filter((c: any) => c.phone);
      
      console.log('Transformed contacts:', transformedContacts.length);
      return res.status(200).json(transformedContacts);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('GHL API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch contacts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
