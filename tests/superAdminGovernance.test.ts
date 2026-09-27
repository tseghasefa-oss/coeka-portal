import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api';
import { getContainer } from '../src/infrastructure/container';
import { GovernanceService } from '../src/services/admin/governanceService';
import { AuditService } from '../src/services/admin/auditService';
import { SystemAdminService } from '../src/services/admin/systemAdminService';
import { FinanceAdminService } from '../src/services/admin/financeAdminService';

describe('Module: God Mode System Governor (SuperAdmin Dashboard & Governance Suite)', () => {
  const container = getContainer();
  const governanceService = new GovernanceService(container.db, container.cache);
  const auditService = new AuditService(container.db);
  const systemAdminService = new SystemAdminService(container.db, auditService);
  const financeAdminService = new FinanceAdminService(container.db);

  beforeEach(async () => {
    // Reset maintenance mode and ensure seed records
    await systemAdminService.setMaintenanceMode(false, 'test-setup');
    await financeAdminService.ensureSeedInvoicesAndTransactions();
  });

  describe('1. Strict Role-Based Access Control (RBAC) Gating', () => {
    it('allows SUPER_ADMIN full access to governance pipeline telemetry (HTTP 200)', async () => {
      const res = await app.request('/api/admin/governance/pipeline', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.pipeline).toBeDefined();
      expect(data.pipeline.financials).toBeDefined();
      expect(data.pipeline.academics).toBeDefined();
    });

    it('strictly forbids standard ADMIN role with HTTP 403 Forbidden', async () => {
      const res = await app.request('/api/admin/governance/pipeline', {
        headers: { 'X-Demo-Role': 'ADMIN' },
      });

      expect(res.status).toBe(403);
      const data: any = await res.json();
      expect(data.error).toMatch(/Forbidden/i);
    });

    it('strictly forbids LECTURER and DEAN roles with HTTP 403 Forbidden', async () => {
      const resLecturer = await app.request('/api/admin/governance/pipeline', {
        headers: { 'X-Demo-Role': 'LECTURER' },
      });
      expect(resLecturer.status).toBe(403);

      const resDean = await app.request('/api/admin/governance/pipeline', {
        headers: { 'X-Demo-Role': 'DEAN' },
      });
      expect(resDean.status).toBe(403);
    });

    it('strictly forbids STUDENT role with HTTP 403 Forbidden', async () => {
      const res = await app.request('/api/admin/governance/pipeline', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(403);
      const data: any = await res.json();
      expect(data.error).toMatch(/Forbidden/i);
    });

    it('strictly denies unauthenticated requests with HTTP 401 Unauthorized', async () => {
      const res = await app.request('/api/admin/governance/pipeline');
      expect(res.status).toBe(401);
    });
  });

  describe('2. High-Performance Edge KV Caching on Pipeline Telemetry', () => {
    it('caches pipeline overview in KV and forces refresh when query param refresh=true is passed', async () => {
      // 1. Force refresh to ensure cache recomputation
      const freshRes = await app.request('/api/admin/governance/pipeline?refresh=true', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });
      expect(freshRes.status).toBe(200);
      const freshData: any = await freshRes.json();
      expect(freshData.pipeline.isCached).toBe(false);

      // 2. Subsequent call without refresh query param should be served from KV cache
      const cachedRes = await app.request('/api/admin/governance/pipeline', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });
      expect(cachedRes.status).toBe(200);
      const cachedData: any = await cachedRes.json();
      expect(cachedData.pipeline.isCached).toBe(true);
      expect(cachedData.pipeline.financials.totalRevenueKobo).toBe(freshData.pipeline.financials.totalRevenueKobo);

      // 3. Explicit force refresh recomputes and resets isCached to false
      const reFreshRes = await app.request('/api/admin/governance/pipeline?refresh=true', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });
      const reFreshData: any = await reFreshRes.json();
      expect(reFreshData.pipeline.isCached).toBe(false);
    });
  });

  describe('3. Cryptographic Tamper Detection & Audit Vault Forensics', () => {
    it('verifies valid HMAC-SHA256 signatures on pristine audit log records', async () => {
      const entry = await auditService.logAdminAction({
        actorUserId: 'usr-superadmin-001',
        action: 'TEST_PRISTINE_ACTION',
        entityName: 'system_settings',
        entityId: 'cfg-test-01',
        newValue: { test: true },
      });

      expect(entry.signature).toBeDefined();

      const verifiedLogs = await auditService.getAuditLogsWithVerification(10);
      const targetLog = verifiedLogs.find((l) => l.id === entry.id);

      expect(targetLog).toBeDefined();
      expect(targetLog?.isTampered).toBe(false);
      expect(targetLog?.isValidSignature).toBe(true);
    });

    it('detects direct database tampering and highlights tampered entries in audit vault', async () => {
      // 1. Create a pristine logged action
      const entry = await auditService.logAdminAction({
        actorUserId: 'usr-superadmin-001',
        action: 'PRISTINE_ORIGINAL_ACTION',
        entityName: 'students',
        entityId: 'std-test-tamper',
        newValue: { balanceKobo: 500000 },
      });

      // 2. Direct malicious SQL update bypassing HMAC signing
      await container.db.execute(
        `UPDATE audit_logs SET action = 'TAMPERED_MALICIOUS_MODIFICATION' WHERE id = ?`,
        [entry.id]
      );

      // 3. Inspect using AuditService verification
      const verifiedLogs = await auditService.getAuditLogsWithVerification(20);
      const tamperedEntry = verifiedLogs.find((l) => l.id === entry.id);

      expect(tamperedEntry).toBeDefined();
      expect(tamperedEntry?.action).toBe('TAMPERED_MALICIOUS_MODIFICATION');
      expect(tamperedEntry?.isTampered).toBe(true);
      expect(tamperedEntry?.isValidSignature).toBe(false);

      // 4. Inspect via HTTP API GET /api/admin/governance/audit-vault
      const vaultRes = await app.request('/api/admin/governance/audit-vault?limit=50', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(vaultRes.status).toBe(200);
      const vaultData: any = await vaultRes.json();
      expect(vaultData.success).toBe(true);
      expect(vaultData.isCompromised).toBe(true);
      expect(vaultData.tamperedCount).toBeGreaterThanOrEqual(1);

      const foundInVault = vaultData.logs.find((l: any) => l.id === entry.id);
      expect(foundInVault.isTampered).toBe(true);
    });
  });

  describe('4. Executive Emergency Overrides Engine', () => {
    it('executes FORCE_CLEAR_LIBRARY to bypass fines and issue instant clearance', async () => {
      const studentId = 'std-001'; // Aondoaver Moses Iorliam

      const res = await app.request('/api/admin/governance/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          overrideType: 'FORCE_CLEAR_LIBRARY',
          targetId: studentId,
          reason: 'Emergency clearance approved by College Governing Council',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.overrideType).toBe('FORCE_CLEAR_LIBRARY');
      expect(data.details).toContain('Forced library clearance granted');

      // Verify clearance record in database
      const clearance = await container.db.queryFirst<any>(
        `SELECT status, remarks FROM library_clearances WHERE student_id = ?`,
        [studentId]
      );
      expect(clearance.status).toBe('CLEARED');
      expect(clearance.remarks).toContain('SuperAdmin Executive Override');
    });

    it('executes FORCE_CLEAR_BURSARY to waive unpaid invoices in emergencies', async () => {
      const studentId = 'std-002'; // Doose Mercy Gbadu

      // Ensure student has an unpaid invoice
      await container.db.execute(
        `INSERT INTO student_invoices (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status, created_at)
         VALUES ('inv-test-waiver', ?, 'sched-nce-100-tui', 'INV-TEST-WAIVER-001', 4500000, 0, 'UNPAID', ?)
         ON CONFLICT(id) DO UPDATE SET status = 'UNPAID', amount_paid_kobo = 0`,
        [studentId, Math.floor(Date.now() / 1000)]
      );

      const res = await app.request('/api/admin/governance/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          overrideType: 'FORCE_CLEAR_BURSARY',
          targetId: studentId,
          reason: 'Executive humanitarian waiver granted by Provost',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);

      // Verify invoices are now PAID
      const unpaidInvoices = await container.db.query<any>(
        `SELECT id FROM student_invoices WHERE student_id = ? AND status = 'UNPAID'`,
        [studentId]
      );
      expect(unpaidInvoices.length).toBe(0);
    });

    it('executes FORCE_RELEASE_HOSTEL_LOCK to free up stuck bedspace locks', async () => {
      // 1. Ensure bedspace and active lock exist
      const bedId = 'bed-a101-1';
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 900; // 15 mins lock

      await container.db.execute(
        `UPDATE hostel_bedspaces SET reserved_until = ?, is_occupied = 0 WHERE id = ?`,
        [expiresAt, bedId]
      );
      await container.db.execute(
        `INSERT INTO allocation_locks (id, student_id, bedspace_id, status, expires_at, created_at, updated_at)
         VALUES ('lock-test-override', 'std-001', ?, 'LOCKED', ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET status = 'LOCKED', expires_at = excluded.expires_at`,
        [bedId, expiresAt, now, now]
      );

      // 2. SuperAdmin executes lock release override
      const res = await app.request('/api/admin/governance/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          overrideType: 'FORCE_RELEASE_HOSTEL_LOCK',
          targetId: bedId,
          reason: 'Applicant payment timeout failed to unlock bedspace',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.details).toContain('unlocked and returned to available pool');

      // Verify bedspace reserved_until is cleared
      const bed = await container.db.queryFirst<any>(
        `SELECT reserved_until, is_occupied FROM hostel_bedspaces WHERE id = ?`,
        [bedId]
      );
      expect(bed.reserved_until).toBeNull();
    });

    it('rejects overrides with insufficient executive justification', async () => {
      const res = await app.request('/api/admin/governance/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          overrideType: 'FORCE_CLEAR_LIBRARY',
          targetId: 'std-001',
          reason: 'ok', // too short (< 5 chars)
        }),
      });

      expect(res.status).toBe(400);
      const data: any = await res.json();
      expect(data.error).toMatch(/at least 5 characters/i);
    });
  });

  describe('5. Bulk Cohort Level Promotions', () => {
    it('advances student levels in bulk and records audit trail', async () => {
      // 1. Ensure test student at 100 level exists
      await container.db.execute(
        `UPDATE students SET current_level = 100, academic_status = 'ACTIVE' WHERE id = 'std-001'`
      );

      const res = await app.request('/api/admin/governance/bulk-promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          fromLevel: 100,
          toLevel: 200,
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.fromLevel).toBe(100);
      expect(data.toLevel).toBe(200);
      expect(data.promotedCount).toBeGreaterThanOrEqual(1);

      // Verify student in DB is now level 200
      const student = await container.db.queryFirst<any>(
        `SELECT current_level FROM students WHERE id = 'std-001'`
      );
      expect(student.current_level).toBe(200);

      // Verify audit trail logged
      const logs = await container.db.query<any>(
        `SELECT action, entity_name FROM audit_logs WHERE action = 'BULK_LEVEL_PROMOTION' ORDER BY created_at DESC LIMIT 1`
      );
      expect(logs.length).toBe(1);
      expect(logs[0].entity_name).toBe('students');
    });
  });

  describe('6. Emergency Kill-Switch (Maintenance Mode Lifecycle)', () => {
    it('enables maintenance mode, blocks non-SuperAdmin access with 503, and allows SuperAdmin bypass', async () => {
      // 1. Enable maintenance mode via Governance API
      const lockRes = await app.request('/api/admin/governance/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ enabled: true }),
      });

      expect(lockRes.status).toBe(200);
      const lockData: any = await lockRes.json();
      expect(lockData.maintenanceMode).toBe(true);

      // 2. Student login attempt is blocked with 503 Service Unavailable
      const studentLoginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'Password123!',
        }),
      });

      expect(studentLoginRes.status).toBe(503);
      const errJson: any = await studentLoginRes.json();
      expect(errJson.error).toMatch(/maintenance/i);

      // 3. SuperAdmin login bypasses maintenance mode
      const adminLoginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'Password123!',
        }),
      });

      expect(adminLoginRes.status).toBe(200);
      const adminJson: any = await adminLoginRes.json();
      expect(adminJson.message).toBe('Authentication successful');
      expect(adminJson.user.role).toBe('SUPER_ADMIN');

      // 4. Deactivate Maintenance Mode
      const unlockRes = await app.request('/api/admin/governance/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ enabled: false }),
      });

      expect(unlockRes.status).toBe(200);
      const unlockData: any = await unlockRes.json();
      expect(unlockData.maintenanceMode).toBe(false);

      // 5. Student login is restored
      const restoredLogin = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'Password123!',
        }),
      });
      expect(restoredLogin.status).toBe(200);
    });
  });

  describe('7. Read-Only Fee Matrix Policy Auditor & Physical Asset Oversight', () => {
    it('GET /api/admin/governance/fee-matrix returns structured institutional fee tariff schedule', async () => {
      const res = await app.request('/api/admin/governance/fee-matrix', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.feeMatrix)).toBe(true);
      expect(data.feeMatrix.length).toBeGreaterThan(0);
      expect(data.feeMatrix[0]).toHaveProperty('feeTitle');
      expect(data.feeMatrix[0]).toHaveProperty('amountNaira');
      expect(data.feeMatrix[0]).toHaveProperty('isCompulsory');
    });

    it('GET /api/admin/governance/assets returns physical inventory telemetry for library and hostels', async () => {
      const res = await app.request('/api/admin/governance/assets', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.assets).toBeDefined();

      // Library assertions
      expect(data.assets.library.totalTitles).toBeGreaterThanOrEqual(1);
      expect(data.assets.library.totalVolumes).toBeGreaterThanOrEqual(1);
      expect(typeof data.assets.library.utilizationRate).toBe('number');

      // Hostel assertions
      expect(data.assets.hostels.totalHalls).toBeGreaterThanOrEqual(1);
      expect(data.assets.hostels.totalBeds).toBeGreaterThanOrEqual(1);
      expect(typeof data.assets.hostels.occupancyRate).toBe('number');
    });

    it('GET /api/admin/governance/security returns security compliance and failed auth telemetry', async () => {
      const res = await app.request('/api/admin/governance/security', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.summary.activeSuperAdminsCount).toBeGreaterThanOrEqual(1);
      expect(['SECURE', 'WARNING', 'ALERT']).toContain(data.summary.systemStatus);
    });
  });
});
