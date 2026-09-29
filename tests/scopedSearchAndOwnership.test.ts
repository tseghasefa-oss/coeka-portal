import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { getContainer, resetDefaultMemoryContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { useAppStore } from '../src/web/stores/useAppStore';
import { getSearchPlaceholder } from '../src/web/components/layout/DashboardLayout';

describe('Scoped Search & Data Privacy Hardening Suite (IDOR Defense)', () => {
  let authService: AuthService;

  beforeEach(() => {
    resetDefaultMemoryContainer();
    const container = getContainer();
    authService = new AuthService(container.db, container.cache);
    useAppStore.setState({
      userSession: null,
      activeTab: 'dashboard_home',
    });
  });

  async function createTestSession(userId: string): Promise<string> {
    const session = await authService.createSession(userId);
    return session.sessionId;
  }

  // =========================================================================
  // 1. Pupil Attack Test (Student Scoping & Cross-Division IDOR Shield)
  // =========================================================================
  describe('1. Student Scoping & Pupil Attack Protection (Stealth Rule)', () => {
    it('primary pupil searching for a Degree student matric returns empty [] with 200 OK (no 403 / stealth)', async () => {
      const sessionId = await createTestSession('usr-test-pri');
      expect(sessionId).toBeTruthy();

      // Primary pupil searches for Degree student's matriculation number
      const res = await app.request('/api/search?q=COEKA/2026/DEG/901', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(Array.isArray(json.results)).toBe(true);
      expect(json.results.length).toBe(0);
    });

    it('primary pupil searching for another student name returns empty [] with 200 OK', async () => {
      const sessionId = await createTestSession('usr-test-pri');

      const res = await app.request('/api/search?q=Iorliam', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.results.length).toBe(0);
    });

    it('primary pupil searching for their own profile returns only their record', async () => {
      const sessionId = await createTestSession('usr-test-pri');

      const res = await app.request('/api/search?q=PRI/904', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results[0].metadata?.matricNumber).toBe('SPS/2026/PRI/904');
      expect(json.results[0].metadata?.isSelf).toBe(true);
    });
  });

  // =========================================================================
  // 2. Parent Boundary Test (Cross-Family Data Isolation)
  // =========================================================================
  describe('2. Parent Boundary Test (Ward Isolation)', () => {
    it('parent searching for non-ward student returns empty [] with 200 OK (Stealth Rule)', async () => {
      // usr-par-001 is parent of std-001 (COEKA/2026/NCE/084)
      const sessionId = await createTestSession('usr-par-001');

      // Search for Degree student (not their ward)
      const res = await app.request('/api/search?q=COEKA/2026/DEG/901', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.results).toEqual([]);
    });

    it('parent searching for their own ward by matric returns the ward', async () => {
      const sessionId = await createTestSession('usr-par-001');

      const res = await app.request('/api/search?q=COEKA/2026/NCE/084', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results[0].metadata?.matricNumber).toBe('COEKA/2026/NCE/084');
      expect(json.results[0].metadata?.isWard).toBe(true);
    });
  });

  // =========================================================================
  // 3. Lecturer Boundary Test (Course Roster & Department Isolation)
  // =========================================================================
  describe('3. Lecturer Boundary Test (Roster Scoping)', () => {
    it('lecturer searching for student in their assigned course returns the student', async () => {
      const sessionId = await createTestSession('usr-staff-001');

      // std-001 is enrolled in CSC 111 / CSC 112 taught by lecturer1
      const res = await app.request('/api/search?q=COEKA/2026/NCE/084', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results[0].metadata?.matricNumber).toBe('COEKA/2026/NCE/084');
    });

    it('lecturer searching for a primary school pupil returns empty [] with 200 OK', async () => {
      const sessionId = await createTestSession('usr-staff-001');

      // SPS/2026/PRI/904 is a Primary pupil not taking lecturer courses
      const res = await app.request('/api/search?q=SPS/2026/PRI/904', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.results).toEqual([]);
    });
  });

  // =========================================================================
  // 4. Bursar Scoping Test (Financial Data Only, No Academic Grades)
  // =========================================================================
  describe('4. Bursar Scoping Test (Strict Grade Redaction)', () => {
    it('bursar can search invoices and financial ledger entries', async () => {
      const sessionId = await createTestSession('usr-bur-001');

      const res = await app.request('/api/search?q=INV-2026', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results[0].type).toBe('INVOICE');

      // Verify that no academic grades or GPA are leaked in bursar search results
      for (const item of json.results) {
        expect(item.metadata?.examScore).toBeUndefined();
        expect(item.metadata?.ca1Score).toBeUndefined();
        expect(item.metadata?.gradePoint).toBeUndefined();
        expect(item.metadata?.letterGrade).toBeUndefined();
      }
    });
  });

  // =========================================================================
  // 5. SuperAdmin Unrestricted Search Test
  // =========================================================================
  describe('5. SuperAdmin Global Search Access', () => {
    it('super admin can search across all divisions and records', async () => {
      const sessionId = await createTestSession('usr-admin-001');

      // Search Degree student
      const resDeg = await app.request('/api/search?q=COEKA/2026/DEG/901', {
        method: 'GET',
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      expect(resDeg.status).toBe(200);
      const jsonDeg: any = await resDeg.json();
      expect(jsonDeg.results.length).toBeGreaterThan(0);
      expect(jsonDeg.results[0].metadata?.matricNumber).toBe('COEKA/2026/DEG/901');

      // Search Primary pupil
      const resPri = await app.request('/api/search?q=SPS/2026/PRI/904', {
        method: 'GET',
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      expect(resPri.status).toBe(200);
      const jsonPri: any = await resPri.json();
      expect(jsonPri.results.length).toBeGreaterThan(0);
      expect(jsonPri.results[0].metadata?.matricNumber).toBe('SPS/2026/PRI/904');
    });
  });

  // =========================================================================
  // 6. Direct URL Test (DataOwnershipGuard: 404 Not Found on Unauthorized Access)
  // =========================================================================
  describe('6. Direct URL Test (DataOwnershipGuard & IDOR Defense)', () => {
    it('blocks student accessing another student invoice with stealth 404 (NOT 403)', async () => {
      // Primary pupil (usr-test-pri)
      const pupilSession = await createTestSession('usr-test-pri');

      // Try to directly fetch Degree student invoice (inv-test-deg-01)
      const res = await app.request('/api/student/invoices/inv-test-deg-01', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${pupilSession}`,
        },
      });

      // Stealth rule: Must return 404 Not Found, NOT 403 Forbidden!
      expect(res.status).toBe(404);
      const json: any = await res.json();
      expect(json.error).toBe('Invoice not found');
    });

    it('allows student accessing their own invoice with 200 OK', async () => {
      const nceSession = await createTestSession('usr-test-nce');

      const res = await app.request('/api/student/invoices/inv-test-nce-01', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${nceSession}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.invoice).toBeDefined();
      expect(json.invoice.invoiceNumber).toBe('INV-2026-NCE-902-01');
    });

    it('allows parent accessing their own ward invoice with 200 OK', async () => {
      const parentSession = await createTestSession('usr-par-001');

      // std-001 has invoice inv-001
      const res = await app.request('/api/student/invoices/inv-001', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${parentSession}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.invoice).toBeDefined();
      expect(json.invoice.matricNumber).toBe('COEKA/2026/NCE/084');
    });

    it('blocks parent accessing an invoice of a non-ward with stealth 404', async () => {
      const parentSession = await createTestSession('usr-par-001');

      // inv-test-deg-01 belongs to Degree test student, not parent's ward
      const res = await app.request('/api/student/invoices/inv-test-deg-01', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${parentSession}`,
        },
      });

      expect(res.status).toBe(404);
      const json: any = await res.json();
      expect(json.error).toBe('Invoice not found');
    });

    it('allows SuperAdmin to access any invoice with 200 OK', async () => {
      const adminSession = await createTestSession('usr-admin-001');

      const res = await app.request('/api/finance/invoices/inv-test-deg-01', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminSession}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.invoice).toBeDefined();
      expect(json.invoice.id).toBe('inv-test-deg-01');
    });

    it('allows Bursar to access any invoice with 200 OK', async () => {
      const bursarSession = await createTestSession('usr-bur-001');

      const res = await app.request('/api/finance/invoices/inv-test-deg-01', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${bursarSession}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.invoice).toBeDefined();
      expect(json.invoice.id).toBe('inv-test-deg-01');
    });
  });

  // =========================================================================
  // 7. Dynamic UI Placeholder per Role Test
  // =========================================================================
  describe('7. Dynamic Search Bar Placeholder per Role', () => {
    it('resolves strict institutional placeholders for each persona', () => {
      expect(getSearchPlaceholder('SUPER_ADMIN')).toBe('Search any student, staff, or record...');
      expect(getSearchPlaceholder('ADMIN')).toBe('Search any student, staff, or record...');
      expect(getSearchPlaceholder('BURSAR')).toBe('Search student invoices & financial ledgers...');
      expect(getSearchPlaceholder('LECTURER')).toBe('Search students in your courses...');
      expect(getSearchPlaceholder('DEAN')).toBe('Search students in your courses...');
      expect(getSearchPlaceholder('HOD')).toBe('Search students in your courses...');
      expect(getSearchPlaceholder('PARENT')).toBe('Search for your children...');
      expect(getSearchPlaceholder('STUDENT')).toBe('Search your own records...');
      expect(getSearchPlaceholder(undefined)).toBe('Search portal records... (Ctrl + K)');
    });
  });
});

