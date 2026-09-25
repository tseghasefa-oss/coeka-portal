import { describe, it, expect } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer } from '../src/infrastructure/container';
import { UserAdminService } from '../src/services/admin/userAdminService';
import { SystemAdminService } from '../src/services/admin/systemAdminService';
import { AuditService } from '../src/services/admin/auditService';

describe('Master Admin Area - User Management, System Settings & Cryptographic Audit', () => {
  // -------------------------------------------------------------
  // 1. User Directory & Filtering
  // -------------------------------------------------------------
  describe('User Directory Listing & Filtering', () => {
    it('lists users via GET /api/admin/users with authenticated SUPER_ADMIN role', async () => {
      const res = await app.request('/api/admin/users', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThanOrEqual(5);

      const founder = data.users.find((u: any) => u.username === 'founder_tsegha');
      expect(founder).toBeDefined();
      expect(founder.role).toBe('SUPER_ADMIN');
    });

    it('filters users by role (e.g. STUDENT)', async () => {
      const res = await app.request('/api/admin/users?role=STUDENT', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.users.length).toBeGreaterThanOrEqual(1);
      data.users.forEach((u: any) => {
        expect(['STUDENT'].includes(u.role) || u.userType === 'STUDENT').toBe(true);
      });
    });

    it('filters users by division (e.g. NCE)', async () => {
      const res = await app.request('/api/admin/users?division=NCE', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.users.length).toBeGreaterThanOrEqual(1);
      data.users.forEach((u: any) => {
        expect(u.division).toBe('NCE');
      });
    });

    it('filters users by search query (name or ID)', async () => {
      const res = await app.request('/api/admin/users?search=Adeyemi', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.users.length).toBeGreaterThanOrEqual(1);
      expect(data.users[0].name).toContain('Adeyemi');
    });
  });

  // -------------------------------------------------------------
  // 2. User Promotion & RBAC Elevation
  // -------------------------------------------------------------
  describe('User Role Promotion', () => {
    it('promotes a user to SUPER_ADMIN and logs cryptographic audit trail', async () => {
      const res = await app.request('/api/admin/users/usr-dean-001/promote', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ role: 'SUPER_ADMIN' }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.message).toContain('promoted to SUPER_ADMIN');
      expect(data.user.role).toBe('SUPER_ADMIN');

      // Verify that promotion was logged in audit trail
      const auditRes = await app.request('/api/admin/audit?limit=5', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });
      const auditData: any = await auditRes.json();
      const promoteLog = auditData.auditLogs.find(
        (l: any) => l.action === 'PROMOTE_USER_TO_ADMIN' && l.entityId === 'usr-dean-001'
      );
      expect(promoteLog).toBeDefined();
      expect(promoteLog.signature).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 3. Account Suspension & Reactivation
  // -------------------------------------------------------------
  describe('Account Status Management', () => {
    it('suspends an active user account and creates cryptographic audit entry', async () => {
      const res = await app.request('/api/admin/users/usr-std-002/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ isActive: false }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.isActive).toBe(false);
      expect(data.message).toContain('suspended');

      // Verify user reflects suspended status in directory
      const listRes = await app.request('/api/admin/users?search=std_gbadu', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });
      const listData: any = await listRes.json();
      const targetUser = listData.users.find((u: any) => u.id === 'usr-std-002');
      expect(targetUser.isActive).toBe(false);
    });

    it('reactivates a suspended account', async () => {
      const res = await app.request('/api/admin/users/usr-std-002/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ isActive: true }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.isActive).toBe(true);
      expect(data.message).toContain('activated');
    });
  });

  // -------------------------------------------------------------
  // 4. Temporary Password Reset
  // -------------------------------------------------------------
  describe('Password Reset Trigger', () => {
    it('generates a secure temporary password and logs audit action', async () => {
      const res = await app.request('/api/admin/users/usr-std-001/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.tempPassword).toBeDefined();
      expect(data.tempPassword.startsWith('COEKA-')).toBe(true);
      expect(data.message).toContain('Password successfully reset');

      // Check audit log for password reset
      const auditRes = await app.request('/api/admin/audit?limit=5', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });
      const auditData: any = await auditRes.json();
      const resetLog = auditData.auditLogs.find(
        (l: any) => l.action === 'RESET_USER_PASSWORD' && l.entityId === 'usr-std-001'
      );
      expect(resetLog).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 5. System Settings: Maintenance Mode & Examination Dates
  // -------------------------------------------------------------
  describe('System Settings: Maintenance Mode & Academic Calendar', () => {
    it('toggles Maintenance Mode to true and verifies status in settings', async () => {
      const updateRes = await app.request('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ maintenanceMode: true }),
      });

      expect(updateRes.status).toBe(200);
      const updateData: any = await updateRes.json();
      expect(updateData.updated.maintenanceMode).toBe(true);

      // Verify GET /api/admin/settings returns maintenanceMode: true
      const getRes = await app.request('/api/admin/settings', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });
      const getData: any = await getRes.json();
      expect(getData.maintenanceMode).toBe(true);
    });

    it('toggles Maintenance Mode back to false (normal operations)', async () => {
      const updateRes = await app.request('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ maintenanceMode: false }),
      });

      expect(updateRes.status).toBe(200);
      const getRes = await app.request('/api/admin/settings', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });
      const getData: any = await getRes.json();
      expect(getData.maintenanceMode).toBe(false);
    });

    it('updates Academic Calendar with examination start and end dates', async () => {
      const updateRes = await app.request('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          calendarSessionId: 'sess-2026-2027',
          startDate: '2026-10-01',
          endDate: '2027-08-31',
          examStartDate: '2027-02-15',
          examEndDate: '2027-03-05',
        }),
      });

      expect(updateRes.status).toBe(200);
      const updateData: any = await updateRes.json();
      expect(updateData.updated.academicCalendar.examStartDate).toBe('2027-02-15');
      expect(updateData.updated.academicCalendar.examEndDate).toBe('2027-03-05');

      // Verify GET /api/admin/settings
      const getRes = await app.request('/api/admin/settings', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });
      const getData: any = await getRes.json();
      expect(getData.academicCalendar.examStartDate).toBe('2027-02-15');
      expect(getData.academicCalendar.examEndDate).toBe('2027-03-05');
    });
  });

  // -------------------------------------------------------------
  // 6. Cryptographic Audit Trail Verification & Tamper Detection
  // -------------------------------------------------------------
  describe('Cryptographic Audit Trail & HMAC Verification', () => {
    it('verifies that genuine audit records validate successfully (HMAC match)', async () => {
      // Fetch recent audit logs
      const auditRes = await app.request('/api/admin/audit?limit=10', {
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(auditRes.status).toBe(200);
      const data: any = await auditRes.json();
      expect(data.auditLogs.length).toBeGreaterThanOrEqual(1);

      const log = data.auditLogs[0];
      expect(log.signature).toBeDefined();

      // Verify log entry via verification endpoint
      const verifyRes = await app.request(`/api/admin/audit/verify/${log.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(verifyRes.status).toBe(200);
      const verifyData: any = await verifyRes.json();
      expect(verifyData.isValid).toBe(true);
      expect(verifyData.entry.id).toBe(log.id);
    });

    it('detects tampering if an audit record in the database is modified', async () => {
      const container = createMemoryContainer();
      const auditService = new AuditService(container.db);

      const originalEntry = await auditService.logAdminAction({
        actorUserId: 'admin-1',
        action: 'UPDATE_FEE_SCHEDULE',
        entityName: 'fee_schedules',
        entityId: 'fs-test',
        newValue: { amountKobo: 5000000 },
      });

      // 1. Initial verification must pass
      const initialVerify = await auditService.verifyAuditLog(originalEntry.id);
      expect(initialVerify.isValid).toBe(true);

      // 2. Simulate malicious attacker tampering with action in DB
      await container.db.execute(`UPDATE audit_logs SET action = 'MALICIOUS_ALTERATION' WHERE id = ?`, [
        originalEntry.id,
      ]);

      // 3. Post-tamper verification MUST fail
      const tamperedVerify = await auditService.verifyAuditLog(originalEntry.id);
      expect(tamperedVerify.isValid).toBe(false);
    });
  });
});
