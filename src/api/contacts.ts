import type { Contact } from "../types/Contact";

const GHL_WEBHOOK_URL = "/api/ghl-contacts";

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
    const res = await fetch(GHL_WEBHOOK_URL);
    
    if (!res.ok) {
      console.error('GHL API returned error:', res.status, res.statusText);
      // Fall back to extracting from messages
      return fetchContactsFromMessages();
    }
    
    const data = await res.json();
    
    // Check if we got valid data
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No contacts from GHL API, trying messages API');
      return fetchContactsFromMessages();
    }
    
    console.log('GHL Contacts fetched:', data.length);
    return data;
  } catch (error) {
    console.error('Failed to fetch GHL contacts:', error);
    return fetchContactsFromMessages();
  }
};

// Fallback: Extract contacts from messages API
const fetchContactsFromMessages = async (): Promise<Contact[]> => {
  try {
    const res = await fetch('/api/messages?direction=outbound&limit=1000');
    if (!res.ok) return mockContacts;
    
    const data = await res.json();
    const messages: any[] = data.data || [];
    
    const contactsMap: Record<string, Contact> = {};
    
    for (const msg of messages) {
      for (const number of msg.numbers || []) {
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
    return contacts.length > 0 ? contacts : mockContacts;
  } catch {
    return mockContacts;
  }
};
