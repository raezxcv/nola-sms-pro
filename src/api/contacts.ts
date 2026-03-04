import type { Contact } from "../types/Contact";

const CONTACTS_API_URL = "/api/contacts";
const WEBHOOK_SECRET = "f7RkQ2pL9zV3tX8cB1nS4yW6";

// Fallback mock contacts if API fails
const mockContacts: Contact[] = [
  { id: '1', name: 'Raely Ivan Reyes', phone: '0976 173 1036' },
  { id: '2', name: 'David Monzon', phone: '0970 812 9927' },
  { id: '3', name: 'Nola Support', phone: '09987654321' },
  { id: '4', name: 'John Doe', phone: '09223334445' },
  { id: '5', name: 'Jane Smith', phone: '09556667778' },
];

export const fetchContacts = async (): Promise<Contact[]> => {
  try {
    const res = await fetch(CONTACTS_API_URL, {
      headers: {
        'X-Webhook-Secret': WEBHOOK_SECRET,
      },
    });
    
    if (!res.ok) {
      console.error('Contacts API returned error:', res.status, res.statusText);
      return mockContacts;
    }
    
    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No contacts from API, using mock data');
      return mockContacts;
    }
    
    console.log('Contacts fetched:', data.length);
    return data;
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return mockContacts;
  }
};
