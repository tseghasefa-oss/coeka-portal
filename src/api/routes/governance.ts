import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole, authenticateSession } from '../middleware/rbac';
import { GovernanceService } from '../../services/admin/governanceService';
import { AuditService } from '../../services/admin/auditService';
import { SystemAdminService } from '../../services/admin/systemAdminService';

export const governanceRoutes = new Hono<{ Bindings: Env }>();

/**
 * STRICTEST SECURITY LAYER:
 * All endpoints under /api/admin/governance/* are EXCLUSIVELY accessible
 * by authenticated users possessing the 'SUPER_ADMIN' role.
 * Any other role receives HTTP 403 Forbidden.
 */
governanceRoutes.use('*', requireAuth, requireRole(['SUPER_ADMIN']));

/**
 * 1. System Pipeline Overview (KV Cached Aggregates)
 * GET /api/admin/governance/pipeline?refresh=true
 */
governanceRoutes.get('/pipeline', async (c) => {
  const container = getContainer(c.env);
  const service = new GovernanceService(container.db, container.cache);
  const forceRefresh = c.req.query('refresh') === 'true';

  try {
    const pipeline = await service.getSystemPipelineOverview(forceRefresh);
    return c.json({ success: true, pipeline });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to retrieve pipeline telemetry' }, 500);
  }
});

/**
 * 2. Executive Emergency Overrides
 * POST /api/admin/governance/override
 * { overrideType: 'FORCE_CLEAR_LIBRARY' | 'FORCE_CLEAR_BURSARY' | 'FORCE_RELEASE_HOSTEL_LOCK', targetId, reason }
 */
governanceRoutes.post('/override', async (c) => {
  const container = getContainer(c.env);
  const service = new GovernanceService(container.db, container.cache);
  const user = await authenticateSession(c);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const { overrideType, targetId, reason } = body;
  if (!overrideType || !targetId || !reason) {
    return c.json({ error: 'overrideType, targetId, and reason are required' }, 400);
  }

  const authorizedBy = user?.userId || 'usr-superadmin-001';

  try {
    const result = await service.executeEmergencyOverride({
      overrideType,
      targetId,
      authorizedBy,
      reason,
    });
    return c.json(result);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/**
 * 3. Bulk Role & Level Promotions
 * POST /api/admin/governance/bulk-promote
 * { fromLevel: 200, toLevel: 300 }
 */
governanceRoutes.post('/bulk-promote', async (c) => {
  const container = getContainer(c.env);
  const service = new GovernanceService(container.db, container.cache);
  const user = await authenticateSession(c);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const fromLevel = Number(body.fromLevel);
  const toLevel = Number(body.toLevel);

  if (!fromLevel || !toLevel) {
    return c.json({ error: 'fromLevel and toLevel (numbers) are required' }, 400);
  }

  try {
    const result = await service.bulkPromoteStudents(fromLevel, toLevel, user?.userId || 'usr-superadmin-001');
    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * 4. Forensic Audit Vault with Cryptographic Tamper Detection
 * GET /api/admin/governance/audit-vault?actor=&limit=100
 */
governanceRoutes.get('/audit-vault', async (c) => {
  const container = getContainer(c.env);
  const auditService = new AuditService(container.db);

  const actorFilter = c.req.query('actor');
  const actionFilter = c.req.query('action');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 100;

  try {
    let logs = await auditService.getAuditLogsWithVerification(limit);

    if (actorFilter) {
      logs = logs.filter(
        (l) =>
          l.actorUserId?.toLowerCase().includes(actorFilter.toLowerCase()) ||
          l.action?.toLowerCase().includes(actorFilter.toLowerCase())
      );
    }

    if (actionFilter) {
      logs = logs.filter((l) => l.action?.toLowerCase().includes(actionFilter.toLowerCase()));
    }

    const tamperedCount = logs.filter((l) => l.isTampered).length;

    return c.json({
      success: true,
      logs,
      totalCount: logs.length,
      tamperedCount,
      isCompromised: tamperedCount > 0,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * 5. Security & Threat Compliance Summary
 * GET /api/admin/governance/security
 */
governanceRoutes.get('/security', async (c) => {
  const container = getContainer(c.env);
  const service = new GovernanceService(container.db, container.cache);

  try {
    const summary = await service.getSecurityComplianceSummary();
    return c.json({ success: true, summary });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * 6. Fee Matrix Policy Auditor (Read-Only)
 * GET /api/admin/governance/fee-matrix
 */
governanceRoutes.get('/fee-matrix', async (c) => {
  const container = getContainer(c.env);
  const service = new GovernanceService(container.db, container.cache);

  try {
    const feeMatrix = await service.getFeeMatrixAuditor();
    return c.json({ success: true, feeMatrix });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * 7. Master Asset & Inventory Oversight
 * GET /api/admin/governance/assets
 */
governanceRoutes.get('/assets', async (c) => {
  const container = getContainer(c.env);
  const service = new GovernanceService(container.db, container.cache);

  try {
    const assets = await service.getAssetOversightSummary();
    return c.json({ success: true, assets });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * 8. Global Emergency Kill Switch (Maintenance Mode)
 * POST /api/admin/governance/maintenance
 * { enabled: boolean }
 */
governanceRoutes.post('/maintenance', async (c) => {
  const container = getContainer(c.env);
  const systemAdmin = new SystemAdminService(container.db);
  const user = await authenticateSession(c);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400);
  }

  const enabled = Boolean(body.enabled ?? body.maintenanceMode);

  try {
    const result = await systemAdmin.setMaintenanceMode(enabled, user?.username || 'SUPER_ADMIN');
    return c.json({
      success: true,
      maintenanceMode: result.maintenanceMode,
      message: `Maintenance Mode is now ${result.maintenanceMode ? 'ENABLED (Portal Locked for non-SuperAdmins)' : 'DISABLED (Portal Live)'}`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
