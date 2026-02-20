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
          // Parse the form data
          const params = new URLSearchParams(body);
          let number = params.get('number') || '';
          
          // Format Philippine phone numbers - the webhook expects 09xxxxxxxxx format
          // It will convert +63 to 0 internally
          if (number.startsWith('+63')) {
            number = '0' + number.substring(3);
          } else if (number.startsWith('639')) {
            number = '0' + number.substring(2);
          } else if (number.startsWith('09') && number.length === 11) {
            // Already in correct format
          } else if (number.startsWith('9') && number.length === 10) {
            number = '0' + number;
          }
          
          // Rebuild the body with the customData wrapper
          const newBody = new URLSearchParams();
          newBody.append('customData[number]', number);
          newBody.append('customData[message]', params.get('message') || '');
          newBody.append('customData[sendername]', params.get('sendername') || 'NOLACRM');
          
          try {
            const response = await fetch('https://webhooks.nolacrm.io/webhook/send_sms.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: newBody.toString(),
            });
            
            const data = await response.json();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: 'Failed to send SMS' }));
          }
        });
      } else {
        res.statusCode = 405;
        res.end('Method not allowed');
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), smsProxyPlugin()],
})
