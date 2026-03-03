import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ViteDevServer } from 'vite'

// Custom Vite plugin to handle SMS proxy
const smsProxyPlugin = () => ({
  name: 'sms-proxy',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/api/sms', async (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { number, message, sendername } = JSON.parse(body);

            // Rebuild the body with the customData wrapper as JSON
            const payload = {
              customData: {
                number: number || '',
                message: message || '',
                sendername: sendername || 'NOLACRM',
              }
            };

            const response = await fetch('https://smspro-api.nolacrm.io/webhook/send_sms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': 'f7RkQ2pL9zV3tX8cB1nS4yW6',
              },
              body: JSON.stringify(payload),
            });

            const data = await response.json();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (error) {
            console.error('Vite Proxy Error:', error);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: 'Failed to send SMS via proxy' }));
          }
        });
      }
    });

    server.middlewares.use('/api/messages', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify([]));
    });

    server.middlewares.use('/api/contacts', (_req, res) => {
      const mockContacts = [
        { id: '1', name: 'Raely Ivan Reyes', phone: '0976 173 1036' },
        { id: '2', name: 'David Monzon', phone: '0970 812 9927' },
        { id: '3', name: 'Nola Support', phone: '09987654321' },
        { id: '4', name: 'John Doe', phone: '09223334445' },
        { id: '5', name: 'Jane Smith', phone: '09556667778' },
      ];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(mockContacts));
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), smsProxyPlugin()],
})
