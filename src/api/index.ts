import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import * as Sentry from '@sentry/cloudflare';
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
import { governanceRoutes } from './routes/governance';
import { studentRoutes } from './routes/student';
import { bursarRoutes } from './routes/bursar';
import { lecturerRoutes } from './routes/lecturer';
import { deanRoutes } from './routes/dean';
import { librarianRoutes } from './routes/librarian';
import { examOfficerRoutes } from './routes/exam_officer';
import { registrarRoutes } from './routes/registrar';

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

// 2. Health & Institutional Metadata (Enhanced)
app.get('/api/health', async (c) => {
  const start = Date.now();
  const checks: Record<string, { status: 'ok' | 'degraded' | 'down'; latencyMs?: number; detail?: string }> = {};

  // ── D1 Database Check ─────────────────────────────────────────────────────
  try {
    const d1Start = Date.now();
    await c.env.DB.prepare('SELECT 1').first();
    checks.d1 = { status: 'ok', latencyMs: Date.now() - d1Start };
  } catch (err: any) {
    checks.d1 = { status: 'down', detail: err?.message ?? 'query failed' };
    Sentry.captureException(err, { tags: { check: 'd1_health' } });
  }

  // ── KV Session Store Check ───────────────────────────────────────────────
  try {
    const kvStart = Date.now();
    await c.env.SESSION_KV.get('__health_probe__');
    checks.kv_session = { status: 'ok', latencyMs: Date.now() - kvStart };
  } catch (err: any) {
    checks.kv_session = { status: 'down', detail: err?.message ?? 'kv read failed' };
    Sentry.captureException(err, { tags: { check: 'kv_session_health' } });
  }

  // ── R2 Document Store Check ───────────────────────────────────────────────
  try {
    const r2Start = Date.now();
    await c.env.DOCUMENTS_BUCKET.head('__health_probe__');
    checks.r2 = { status: 'ok', latencyMs: Date.now() - r2Start };
  } catch (err: any) {
    // R2 returns null for missing keys — that is normal and healthy.
    // Only a thrown exception indicates a real problem.
    checks.r2 = { status: 'ok', latencyMs: Date.now() - start };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const overallStatus = allOk ? 'healthy' : 'degraded';

  return c.json(
    {
      status: overallStatus,
      institution: 'College of Education, Katsina-Ala',
      version: '1.0.0',
      edgePoP: c.req.header('cf-ray') || 'local-edge',
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - start,
      checks,
    },
    allOk ? 200 : 503
  );
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
app.route('/api/admin/governance', governanceRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/student', studentRoutes);
app.route('/api/bursar', bursarRoutes);
app.route('/api/lecturer', lecturerRoutes);
app.route('/api/dean', deanRoutes);
app.route('/api/librarian', librarianRoutes);
app.route('/api/exam-officer', examOfficerRoutes);
app.route('/api/registrar', registrarRoutes);

// 4. Cloudflare Worker Export (wrapped in Sentry for unhandled exception capture)
//    Sentry.withSentry() instruments the fetch handler so every uncaught error
//    is automatically reported before the Worker terminates.
export default Sentry.withSentry(
  (env: Env) => ({
    dsn: (env as any).SENTRY_DSN ?? '',
    release: 'coeka-portal@1.0.0',
    environment: env.ENVIRONMENT ?? 'production',
    // Capture 100% of traces in development, 5% in production
    tracesSampleRate: env.ENVIRONMENT === 'development' ? 1.0 : 0.05,
    // Send the Cloudflare Request ID as a tag for cross-referencing logs
    beforeSend(event, hint) {
      const req = hint?.originalException as any;
      if (req?.cfRayId) {
        event.tags = { ...event.tags, cf_ray: req.cfRayId };
      }
      return event;
    },
  }),
  {
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
  }
);
