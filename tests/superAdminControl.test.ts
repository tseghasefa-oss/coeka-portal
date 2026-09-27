import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api';
import { getContainer } from '../src/infrastructure/container';
import { UserAdminService } from '../src/services/admin/userAdminService';
import { AuditService } from '../src/services/admin/auditService';
import { SystemAdminService } from '../src/services/admin/systemAdminService';
import { AuthService } from '../src/services/auth/authService';

describe('Module 8: The God Mode (SuperAdmin System Control Suite)', () => {
  const container = getContainer();
  const auditService = new AuditService(container.db);
  const userAdminService = new UserAdminService(container.db, auditService);
  const systemAdminService = new SystemAdminService(container.db, auditService);
  const authService = new AuthService(container.db, container.cache);

  beforeEach(async () => {
    // Ensure maintenance mode is off before each test
    await systemAdminService.setMaintenanceMode(false, 'test-setup');
  });

  describe('1. User Lifecycle & Role Management (changeUserRole)', () => {
    it('promotes a Lecturer to Dean and updates user_roles, users, and staff_profiles', async () => {
      const lecturerId = 'usr-staff-001'; // Dr. Aondover Tarhule

      // Promote to DEAN
      const result = await userAdminService.changeUserRole(
        lecturerId,
        'DEAN',
        'usr-admin-001',
        'Appointed Acting Dean of Education'
      );

      expect(result.targetUserId).toBe(lecturerId);
      expect(result.previousRole).toBe('LECTURER');
      expect(result.newRole).toBe('DEAN');

      // Verify in DB user_roles table
      const roleRow = await container.db.queryFirst<any>(
        `SELECT r.name as role FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
        [lecturerId]
      );
      expect(roleRow.role).toBe('DEAN');

      // Verify staff_profiles designation updated
      const profile = await container.db.queryFirst<any>(
        `SELECT designation FROM staff_profiles WHERE user_id = ?`,
        [lecturerId]
      );
      expect(profile.designation).toBe('Dean of School');

      // Revert back to LECTURER
      await userAdminService.changeUserRole(lecturerId, 'LECTURER', 'usr-admin-001');
    });

    it('rejects promotion with an invalid or unknown role', async () => {
      await expect(
        userAdminService.changeUserRole(
          'usr-staff-001',
          'SUPREME_OVERLORD' as any,
          'usr-admin-001'
        )
      ).rejects.toThrow(/invalid target role/i);
    });

    it('toggles user active/suspended status and logs the action', async () => {
      const targetUser = 'usr-std-002'; // Doose Mercy Gbadu

      // Suspend
      const suspendRes = await userAdminService.toggleUserStatus(
        targetUser,
        false,
        'usr-admin-001',
        'Academic probation suspension'
      );
      expect(suspendRes.isActive).toBe(false);

      const dbUser = await container.db.queryFirst<any>(
        `SELECT is_active FROM users WHERE id = ?`,
        [targetUser]
      );
      expect(dbUser.is_active).toBe(0);

      // Reactivate
      const reactivateRes = await userAdminService.toggleUserStatus(
        targetUser,
        true,
        'usr-admin-001'
      );
      expect(reactivateRes.isActive).toBe(true);
    });
  });

  describe('2. Instant Session Synchronization upon Role Change', () => {
    it('instantly updates session role in KV on the user’s next request without re-login', async () => {
      const testUserId = 'usr-staff-001';

      // Ensure user starts as LECTURER
      await userAdminService.changeUserRole(testUserId, 'LECTURER', 'usr-admin-001');

      // Create an active session for the user
      const user = await authService.getUserProfile(testUserId);
      expect(user?.role).toBe('LECTURER');

      const session = await authService.createSession(user!);
      const sessionToken = session.token;

      // 1. As LECTURER, Dean-only route should be rejected (403 Forbidden)
      const initialDeanReq = await app.request('/api/dean/queue', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      expect(initialDeanReq.status).toBe(403);

      // 2. SuperAdmin promotes the user to DEAN
      await userAdminService.changeUserRole(
        testUserId,
        'DEAN',
        'usr-admin-001',
        'Immediate promotion to Dean'
      );

      // 3. User immediately repeats the request with the EXACT SAME session token
      // RBAC middleware detects DB role mismatch and syncs session in KV
      const postPromotionReq = await app.request('/api/dean/queue', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      expect(postPromotionReq.status).toBe(200);
      const queueData: any = await postPromotionReq.json();
      expect(queueData.success).toBe(true);

      // 4. Verify that session in cache was updated
      const refreshedSession = await container.cache.get<any>(`session:${sessionToken}`);
      expect(refreshedSession.role).toBe('DEAN');

      // Cleanup
      await userAdminService.changeUserRole(testUserId, 'LECTURER', 'usr-admin-001');
    });
  });

  describe('3. Password Force-Reset Tool (resetPassword)', () => {
    it('force-resets user password with a custom secure password', async () => {
      const studentId = 'usr-std-001'; // Aondoaver Moses Iorliam
      const customPass = 'Coeka@Secure2026!';

      const resetRes = await userAdminService.resetPassword({
        targetUserId: studentId,
        actorUserId: 'usr-admin-001',
        customPassword: customPass,
        reason: 'Requested by HOD due to compromised email',
      });

      expect(resetRes.success).toBe(true);
      expect(resetRes.temporaryPassword).toBe(customPass);

      // Verify that user can authenticate with the new password
      const studentUser = await container.db.queryFirst<any>(
        `SELECT email, password_hash FROM users WHERE id = ?`,
        [studentId]
      );
      expect(studentUser.password_hash).toBeDefined();

      const verifyRes = await authService.verifyCredentials(
        studentUser.email,
        customPass
      );
      expect(verifyRes).not.toBeNull();
      expect(verifyRes?.id).toBe(studentId);
    });

    it('generates an automated temporary password if custom password is not provided', async () => {
      const studentId = 'usr-std-002'; // Doose Mercy Gbadu

      const resetRes = await userAdminService.resetPassword({
        targetUserId: studentId,
        actorUserId: 'usr-admin-001',
      });

      expect(resetRes.success).toBe(true);
      expect(resetRes.temporaryPassword).toBeDefined();
      expect(resetRes.temporaryPassword.length).toBeGreaterThanOrEqual(10);

      // Verify authentication works with generated password
      const studentUser = await container.db.queryFirst<any>(
        `SELECT email FROM users WHERE id = ?`,
        [studentId]
      );
      const verifyRes = await authService.verifyCredentials(
        studentUser.email,
        resetRes.temporaryPassword
      );
      expect(verifyRes).not.toBeNull();
    });
  });

  describe('4. Cryptographic Audit Trail & HMAC Tamper Detection', () => {
    it('verifies that legitimately created audit logs pass HMAC signature verification', async () => {
      // Create a fresh audit log
      await auditService.logAdminAction({
        actorUserId: 'usr-admin-001',
        action: 'UPDATE_TUITION_FEE',
        entityName: 'fee_structures',
        entityId: 'fee-nce-100',
        oldValue: { amount: 45000 },
        newValue: { amount: 50000 },
      });

      const logs = await auditService.getAuditLogsWithVerification({ limit: 10 });
      expect(logs.length).toBeGreaterThan(0);

      const tuitionLog = logs.find((l) => l.action === 'UPDATE_TUITION_FEE');
      expect(tuitionLog).toBeDefined();
      expect(tuitionLog?.isTampered).toBe(false);
      expect(tuitionLog?.isValidSignature).toBe(true);
    });

    it('DETECTS TAMPERING: flags an audit record in RED when directly tampered in database', async () => {
      // 1. Insert a log with legitimate HMAC
      await auditService.logAdminAction({
        actorUserId: 'usr-admin-001',
        action: 'ORIGINAL_SAFE_ACTION',
        entityName: 'system_settings',
        entityId: 'tamper-key',
        oldValue: { val: 1 },
        newValue: { val: 2 },
      });

      // 2. Directly tamper with the stored action and payload in the database without updating the HMAC
      const latestLog = await container.db.queryFirst<any>(
        `SELECT id, signature FROM audit_logs WHERE action = 'ORIGINAL_SAFE_ACTION' ORDER BY created_at DESC LIMIT 1`
      );
      expect(latestLog).toBeDefined();

      await container.db.execute(
        `UPDATE audit_logs SET action = 'MALICIOUS_TAMPERED_ACTION', new_value_json = '{"hacked": true}' WHERE id = ?`,
        [latestLog.id]
      );

      // 3. Verify that getAuditLogsWithVerification detects the signature mismatch
      const logs = await auditService.getAuditLogsWithVerification({ limit: 20 });
      const tamperedRecord = logs.find((l) => l.id === latestLog.id);

      expect(tamperedRecord).toBeDefined();
      expect(tamperedRecord?.action).toBe('MALICIOUS_TAMPERED_ACTION');
      expect(tamperedRecord?.isTampered).toBe(true); // Flagged in RED
      expect(tamperedRecord?.isValidSignature).toBe(false);
    });

    it('GET /api/admin/audit returns verified audit logs to SuperAdmin', async () => {
      const res = await app.request('/api/admin/audit?limit=10', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.logs)).toBe(true);
      expect(json.logs.length).toBeGreaterThan(0);
      expect(json.logs[0].signature).toBeDefined();
      expect(typeof json.logs[0].isTampered).toBe('boolean');
    });
  });

  describe('5. Real-Time System Status & D1 Health Telemetry', () => {
    it('GET /api/admin/system/health returns operational telemetry and table metrics', async () => {
      const res = await app.request('/api/admin/system/health', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const health: any = await res.json();

      expect(health.status).toBe('HEALTHY');
      expect(health.database.status).toBe('CONNECTED');
      expect(health.database.engine).toBe('Cloudflare D1 SQLite Engine');
      expect(health.database.totalTables).toBeGreaterThanOrEqual(40);
      expect(health.database.dbQueryLatencyMs).toBeGreaterThanOrEqual(0);
      expect(health.cache.status).toBe('CONNECTED');
      expect(health.systemUptimeSeconds).toBeGreaterThan(0);
      expect(health.environment).toBeDefined();
    });
  });

  describe('6. Global Institutional Branding & Calendar Configuration', () => {
    it('updates institutional name, motto, logo, and contact info via PATCH /api/admin/settings/institutional', async () => {
      const updateData = {
        name: 'College of Education, Katsina-Ala, Benue State',
        motto: 'Excellence in Pedagogy & Character',
        logoUrl: 'https://coeka.edu.ng/assets/logo-crest.png',
        email: 'info@coeka.edu.ng',
        phone: '+234 812 999 8888',
        address: 'Katsina-Ala Central Campus, Benue State, Nigeria',
      };

      const patchRes = await app.request('/api/admin/settings/institutional', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify(updateData),
      });

      expect(patchRes.status).toBe(200);
      const patchJson: any = await patchRes.json();
      expect(patchJson.success).toBe(true);
      expect(patchJson.settings.name).toBe(updateData.name);
      expect(patchJson.settings.motto).toBe(updateData.motto);

      // Verify persistence via GET
      const getRes = await app.request('/api/admin/settings/institutional', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(getRes.status).toBe(200);
      const getJson: any = await getRes.json();
      expect(getJson.settings.name).toBe(updateData.name);
      expect(getJson.settings.email).toBe(updateData.email);
    });

    it('configures academic calendar dates and examination windows', async () => {
      const calendarDates = {
        sessionId: 'sess-2026-2027',
        startDate: '2026-10-01',
        endDate: '2027-07-31',
        examStartDate: '2027-02-20',
        examEndDate: '2027-03-10',
      };

      const result = await systemAdminService.setAcademicCalendarDates(calendarDates);
      expect(result.sessionId).toBe('sess-2026-2027');
      expect(result.startDate).toBe('2026-10-01');
      expect(result.examStartDate).toBe('2027-02-20');

      // Verify via getAcademicCalendar
      const calendar = await systemAdminService.getAcademicCalendar('sess-2026-2027');
      expect(calendar.examStartDate).toBe('2027-02-20');
      expect(calendar.examEndDate).toBe('2027-03-10');
    });
  });

  describe('7. Global Maintenance Mode Kill-Switch & Student Blocking', () => {
    it('BLOCKS students from logging in (503 Service Unavailable) during Maintenance Mode while ALLOWING SuperAdmins', async () => {
      // 1. Enable Maintenance Mode via Admin API
      const toggleRes = await app.request('/api/admin/settings/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          enabled: true,
          reason: 'Emergency database optimization and security updates',
        }),
      });

      expect(toggleRes.status).toBe(200);
      const toggleJson: any = await toggleRes.json();
      expect(toggleJson.maintenanceMode).toBe(true);

      // 2. Student attempts login with valid credentials -> MUST BE BLOCKED WITH 503 SERVICE UNAVAILABLE
      const studentLoginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'm.iorliam@student.coeka.edu.ng',
          password: 'Coeka@Secure2026!',
        }),
      });

      // If password was reset in test 3, it works with 'Coeka@Secure2026!' or 'Password123!'
      let finalStudentRes = studentLoginRes;
      if (studentLoginRes.status === 401) {
        finalStudentRes = await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: 'm.iorliam@student.coeka.edu.ng',
            password: 'Password123!',
          }),
        });
      }

      expect(finalStudentRes.status).toBe(503);
      const studentJson: any = await finalStudentRes.json();
      expect(studentJson.error).toMatch(/maintenance/i);
      expect(studentJson.maintenanceMode).toBe(true);

      // 3. SuperAdmin attempts login -> MUST SUCCEED (200 OK)
      const adminLoginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'founder@fruitfulujah.com',
          password: 'Password123!',
        }),
      });

      expect(adminLoginRes.status).toBe(200);
      const adminJson: any = await adminLoginRes.json();
      expect(adminJson.token).toBeDefined();
      expect(adminJson.user.role).toBe('SUPER_ADMIN');

      // 4. Disable Maintenance Mode
      const disableRes = await app.request('/api/admin/settings/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ enabled: false }),
      });

      expect(disableRes.status).toBe(200);

      // 5. Student login is restored -> SUCCEEDS (200 OK)
      const restoredLoginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'm.iorliam@student.coeka.edu.ng',
          password: 'Coeka@Secure2026!',
        }),
      });

      if (restoredLoginRes.status !== 200) {
        const fallbackRes = await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: 'm.iorliam@student.coeka.edu.ng',
            password: 'Password123!',
          }),
        });
        expect(fallbackRes.status).toBe(200);
      } else {
        expect(restoredLoginRes.status).toBe(200);
      }
    });
  });

  describe('8. Database Snapshots & Migration Manifest (D1 Tools)', () => {
    it('POST /api/admin/database/backup generates a verified D1 snapshot with HMAC checksum', async () => {
      const res = await app.request('/api/admin/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ name: 'Automated Post-Exam Snapshot' }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.backup).toBeDefined();
      expect(json.backup.id).toMatch(/^(bkp|snap)-/);
      expect(json.backup.name).toBe('Automated Post-Exam Snapshot');
      expect(json.backup.checksum).toBeDefined();
      expect(json.backup.tableCount).toBeGreaterThanOrEqual(40);
      expect(json.backup.sizeBytes).toBeGreaterThan(0);
      expect(json.backup.status).toBe('COMPLETED');
    });

    it('GET /api/admin/database/backups returns historical snapshot list', async () => {
      const res = await app.request('/api/admin/database/backups', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.backups)).toBe(true);
      expect(json.backups.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/admin/database/migrations returns complete Drizzle schema migration manifest', async () => {
      const res = await app.request('/api/admin/database/migrations', {
        headers: { 'X-Demo-Role': 'SUPER_ADMIN' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.migrations)).toBe(true);

      const migrationNames = json.migrations.map((m: any) => m.name);
      expect(migrationNames).toContain('0000_first_kylun.sql');
      expect(migrationNames).toContain('0006_system_control.sql');

      // Verify batch order and applied timestamps
      const latestMig = json.migrations.find((m: any) => m.name === '0006_system_control.sql');
      expect(latestMig.batch).toBe(3);
      expect(latestMig.checksum).toBeDefined();
      expect(latestMig.appliedAt).toBeGreaterThan(0);
    });
  });
});
