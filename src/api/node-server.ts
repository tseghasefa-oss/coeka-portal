import { serve } from '@hono/node-server';
import { app } from './index';

const port = 8787;

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║   🏛️  COEKA ENTERPRISE DIGITAL CAMPUS PORTAL - BACKEND API         ║
║   College of Education, Katsina-Ala, Benue State, Nigeria          ║
║   Powered by Fruitfulujah Project                                  ║
║                                                                    ║
║   Local Edge API running at: http://localhost:${port}               ║
║   Health Check:             http://localhost:${port}/api/health    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port,
});
