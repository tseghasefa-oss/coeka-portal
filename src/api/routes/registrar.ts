import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole, authenticateSession } from '../middleware/rbac';
import { RegistrarService } from '../../services/registrar/registrarService';
import * as Sentry from '@sentry/cloudflare';
import { registrarBreadcrumb } from '../../lib/sentryBreadcrumbs';

export const registrarRoutes = new Hono<{ Bindings: Env }>();

/**
 * 1. Public-Facing Student Credential & Certificate Verification
 * Unauthenticated endpoint for employers, NYSC, and verification bodies.
 * GET /api/registrar/verify/:identifier
 */
registrarRoutes.get('/verify/:identifier{.*}', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);
  const rawIdentifier = c.req.param('identifier');
  const identifier = decodeURIComponent(rawIdentifier);

  try {
    const result = await service.verifyStudentIdentity(identifier);
    const status = result.status === 'VALID' ? 200 : result.status === 'REVOKED' ? 200 : 404;
    return c.json(result, status);
  } catch (error: any) {
    return c.json(
      {
        isValid: false,
        status: 'ERROR',
        institution: 'Colleges of Education Katsina-Ala (COEKA)',
        message: error.message || 'Credential verification service error',
      },
      500
    );
  }
});

// Guard administrative registrar endpoints with authentication and RBAC, while allowing public verification
registrarRoutes.use('*', async (c, next) => {
  if (c.req.path.includes('/verify/')) {
    return next();
  }
  const user = await authenticateSession(c);
  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }
  const allowed = ['REGISTRAR', 'SUPER_ADMIN', 'ADMIN'];
  if (!allowed.includes(user.role)) {
    return c.json(
      {
        error: 'Forbidden: You do not possess the required role for this operational resource',
        requiredRoles: allowed,
        currentRole: user.role,
      },
      403
    );
  }
  await next();
});

/**
 * GET /api/registrar/stats
 * Overview metrics for Registrar Dashboard
 */
registrarRoutes.get('/stats', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);

  try {
    const stats = await service.getRegistrarStats();
    return c.json({
      success: true,
      stats,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch registrar statistics' }, 500);
  }
});

/**
 * GET /api/registrar/candidates
 * Lists graduating candidates with Bursary, Library, and Academic clearance statuses
 */
registrarRoutes.get('/candidates', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);
  const division = c.req.query('division');

  try {
    const candidates = await service.getGraduationCandidates(division);
    return c.json({
      success: true,
      candidates,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch graduation candidates' }, 500);
  }
});

import { validateBody, IssueCertificateSchema } from '../middleware/validate';

/**
 * POST /api/registrar/certificates/issue
 * Issue tamper-proof digital certificate with cryptographic QR hash
 * Strictly blocked if financial or library clearance is missing
 */
registrarRoutes.post('/certificates/issue', validateBody(IssueCertificateSchema), async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);
  const user = c.get('user');

  try {
    const body: any = c.get('validBody' as any) || await c.req.json();
    const { studentId, confermentDate, qualification } = body;

    Sentry.addBreadcrumb(registrarBreadcrumb('certificate_issue_start', { studentId, qualification }));

    if (!studentId) {
      return c.json({ error: 'studentId is required' }, 400);
    }

    const certificate = await service.issueCertificate(studentId, user?.userId, {
      confermentDate,
      qualification,
    });

    Sentry.addBreadcrumb(registrarBreadcrumb('certificate_issue_success', { studentId, certId: certificate?.id }));

    return c.json({
      success: true,
      certificate,
    }, 201);
  } catch (error: any) {
    Sentry.captureException(error, { tags: { route: 'registrar/certificates/issue' } });
    return c.json({ error: error.message || 'Certificate issuance rejected' }, 400);
  }
});

/**
 * GET /api/registrar/certificates
 * List all issued certificates with optional filters
 */
registrarRoutes.get('/certificates', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);

  const division = c.req.query('division');
  const status = c.req.query('status');
  const search = c.req.query('search');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 50;

  try {
    const certificates = await service.listCertificates({
      division,
      status,
      search,
      limit,
    });
    return c.json({
      success: true,
      certificates,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to list certificates' }, 500);
  }
});

/**
 * GET /api/registrar/transcripts
 * List all transcript requests by status
 */
registrarRoutes.get('/transcripts', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);
  const status = c.req.query('status');

  try {
    const requests = await service.listTranscriptRequests(status);
    return c.json({
      success: true,
      requests,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to list transcript requests' }, 500);
  }
});

/**
 * POST /api/registrar/transcripts
 * Create a new transcript request
 */
registrarRoutes.post('/transcripts', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);

  try {
    const body = await c.req.json();
    const { studentId, recipientName, recipientAddress, recipientEmail, deliveryMethod, feeAmountKobo, status } = body;

    if (!studentId || !recipientName || !recipientAddress) {
      return c.json({ error: 'studentId, recipientName, and recipientAddress are required' }, 400);
    }

    const request = await service.createTranscriptRequest({
      studentId,
      recipientName,
      recipientAddress,
      recipientEmail,
      deliveryMethod,
      feeAmountKobo,
      status,
    });

    return c.json({
      success: true,
      request,
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create transcript request' }, 400);
  }
});

/**
 * PATCH /api/registrar/transcripts/:id/status
 * Transition transcript request lifecycle: PAID -> PROCESSING -> SENT
 */
registrarRoutes.patch('/transcripts/:id/status', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);
  const user = c.get('user');
  const requestId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { status, trackingNumber, dispatchNotes } = body;

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const updated = await service.processTranscriptRequest(
      requestId,
      status,
      { trackingNumber, dispatchNotes },
      user?.userId
    );

    return c.json({
      success: true,
      request: updated,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update transcript status' }, 400);
  }
});

/**
 * POST /api/registrar/students/:id/archive
 * Finalize student dossier and archive as Alumni
 */
registrarRoutes.post('/students/:id/archive', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);
  const user = c.get('user');
  const studentId = c.req.param('id');

  try {
    const archive = await service.finalizeStudentFile(studentId, user?.userId);
    return c.json({
      success: true,
      archive,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to archive student file' }, 400);
  }
});

/**
 * GET /api/registrar/archive
 * Search alumni archive database
 */
registrarRoutes.get('/archive', async (c) => {
  const container = getContainer(c.env);
  const service = new RegistrarService(container.db);

  const query = c.req.query('query');
  const yearStr = c.req.query('year');
  const year = yearStr ? parseInt(yearStr, 10) : undefined;
  const division = c.req.query('division');

  try {
    const records = await service.searchStudentArchive(query, year, division);
    return c.json({
      success: true,
      records,
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to query student archives' }, 500);
  }
});
