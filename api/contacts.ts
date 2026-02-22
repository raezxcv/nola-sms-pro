import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const mockContacts = [
        { id: '1', name: 'Raely Ivan Reyes', phone: '0976 176 1036' },
        { id: '2', name: 'David Monzon', phone: '0970 812 9927' },
        { id: '3', name: 'Nola Support', phone: '09987654321' },
        { id: '4', name: 'John Doe', phone: '09223334445' },
        { id: '5', name: 'Jane Smith', phone: '09556667778' },
    ];

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(mockContacts);
}
