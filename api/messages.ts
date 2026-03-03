import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Return empty array for now until database access is sorted
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json([]);
}


