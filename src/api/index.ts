import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from '../types/env';
import { rateLimiter } from './middleware/rateLimit';
import { authRoutes } from './routes/auth';
import { admissionsRoutes } from './routes/admissions';
import { financeRoutes } from './routes/finance';
import { webhookRoutes } from './routes/webhooks';
import { resultRoutes } from './routes/results';
import { hostelRoutes } from './routes/hostels';
import { simsRoutes } from './routes/sims';
import { staffRoutes } from './routes/staff';
import { parentRoutes } from './routes/parent';
import { adminRoutes } from './routes/admin';
import { studentRoutes } from './routes/student';
import { bursarRoutes } from './routes/bursar';

import { getContainer, ServiceContainer } from '../infrastructure/container';

export type AppVariables = {
  container: ServiceContainer;
  user?: any;
};

export const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// 1. Global Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Demo-Role', 'Cookie'],
  credentials: true,
}));
app.use('*', async (c, next) => {
  const container = getContainer(c.env);
  c.set('container', container);
  await next();
});
app.use('/api/*', rateLimiter(300, 60, 'global')); // 300 requests per minute

// 2. Health & Institutional Metadata
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    institution: 'College of Education, Katsina-Ala',
    version: '1.0.0',
    edgePoP: c.req.header('cf-ray') || 'local-edge',
    timestamp: new Date().toISOString(),
  });
});

// 3. Mount Modular Subsystems
app.route('/api/auth', authRoutes);
app.route('/api/admissions', admissionsRoutes);
app.route('/api/finance', financeRoutes);
app.route('/api/webhooks', webhookRoutes);
app.route('/api/results', resultRoutes);
app.route('/api/hostels', hostelRoutes);
app.route('/api/sims', simsRoutes);
app.route('/api/staff', staffRoutes);
app.route('/api/parent', parentRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/student', studentRoutes);
app.route('/api/bursar', bursarRoutes);

// 4. Cloudflare Worker Export (Fetch, Queue, Scheduled)
export default {
  fetch: app.fetch,

  // Cloudflare Queue Consumer for Asynchronous SMS/Email/Ledger Jobs
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      console.log(`[COEKA Queue] Consuming message ID: ${msg.id}, Type: ${msg.body?.type}`);
      msg.ack();
    }
  },

  // Scheduled Cron Trigger (runs every 15 minutes / nightly sweeps)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[COEKA Cron] Running automated scheduled maintenance at: ${event.scheduledTime}`);
  },
};
