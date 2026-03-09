import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLOUD_RUN_URL = "https://smspro-api.nolacrm.io";
const WEBHOOK_SECRET = "f7RkQ2pL9zV3tX8cB1nS4yW6";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Webhook-Secret, Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const accountId = (req.query.account_id as string) || 'default';
    const limit = (req.query.limit as string) || '50';

    try {
        const cloudRunUrl = `${CLOUD_RUN_URL}/api/v1/accounts/${accountId}/credit_transactions?limit=${limit}`;
        console.log('Proxying credit_transactions GET to:', cloudRunUrl);

        const response = await fetch(cloudRunUrl, {
            method: 'GET',
            headers: {
                'X-Webhook-Secret': WEBHOOK_SECRET,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Cloud Run returned non-OK:', response.status);
            return res.status(response.status).json({ error: 'Upstream error', transactions: [] });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Credit Transactions Proxy Error:', error);
        return res.status(500).json({ error: 'Internal proxy error', transactions: [] });
    }
}
