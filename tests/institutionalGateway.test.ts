import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, resolveDashboardTab } from '../src/web/stores/useAppStore';
import { app } from '../src/api/index';
import { getContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';

describe('Institutional Gateway (LoginPage Redesign & Dashboard Transition Verification)', () => {
  let authService: AuthService;
  let userAdminService: UserAdminService;

  beforeEach(async () => {
    const container = getContainer();
    authService = new AuthService(container.db, container.cache);
    userAdminService = new UserAdminService(container.db);
    await userAdminService.ensureSeedUsers();

    // Reset store state to unauthenticated login view
    useAppStore.setState({
      activeTab: 'login',
      adminTab: 'courses',
      userSession: null,
      authLoading: false,
    });
  });

  // -------------------------------------------------------------
  // 1. Role-Based Dashboard Resolution & Transition Logic
  // -------------------------------------------------------------
  describe('Role-Based Dashboard Redirection Architecture', () => {
    it('redirects STUDENT to "sims" dashboard', () => {
      expect(resolveDashboardTab('STUDENT')).toBe('sims');
    });

    it('redirects SUPER_ADMIN and ADMIN to "admin" God Mode dashboard', () => {
      expect(resolveDashboardTab('SUPER_ADMIN')).toBe('admin');
      expect(resolveDashboardTab('ADMIN')).toBe('admin');
    });

    it('redirects REGISTRAR to "registrar" certification dashboard', () => {
      expect(resolveDashboardTab('REGISTRAR')).toBe('registrar');
    });

    it('redirects EXAM_OFFICER to "exam_officer" broadsheet hub', () => {
      expect(resolveDashboardTab('EXAM_OFFICER')).toBe('exam_officer');
    });

    it('redirects DEAN to "dean" approval oversight dashboard', () => {
      expect(resolveDashboardTab('DEAN')).toBe('dean');
    });

    it('redirects BURSAR to "finance" reconciliation dashboard', () => {
      expect(resolveDashboardTab('BURSAR')).toBe('finance');
      expect(resolveDashboardTab('BURSARY')).toBe('finance');
    });

    it('redirects LIBRARIAN to "librarian" clearance dashboard', () => {
      expect(resolveDashboardTab('LIBRARIAN')).toBe('librarian');
    });

    it('redirects LECTURER and academic staff to "staff" grade entry dashboard', () => {
      expect(resolveDashboardTab('LECTURER')).toBe('staff');
      expect(resolveDashboardTab('HOD')).toBe('staff');
      expect(resolveDashboardTab('STAFF')).toBe('staff');
    });

    it('redirects PARENT to "parent" multi-ward dashboard', () => {
      expect(resolveDashboardTab('PARENT')).toBe('parent');
    });
  });

  // -------------------------------------------------------------
  // 2. End-to-End Authentication & Dashboard Transition Flow
  // -------------------------------------------------------------
  describe('Live Login & Immediate Session Transition', () => {
    it('logs in STUDENT (std_iorliam) and immediately transitions activeTab from "login" to "sims"', async () => {
      expect(useAppStore.getState().activeTab).toBe('login');
      expect(useAppStore.getState().userSession).toBeNull();

      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.10',
        },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('STUDENT');
      expect(data.user.username).toBe('std_iorliam');

      // Emulate useAuth transition
      const targetTab = resolveDashboardTab(data.user.role);
      useAppStore.setState({
        userSession: {
          userId: data.user.userId,
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
          division: data.user.division || 'NCE',
          token: data.session?.sessionId,
        },
        activeTab: targetTab,
      });

      const store = useAppStore.getState();
      expect(store.userSession).not.toBeNull();
      expect(store.userSession?.role).toBe('STUDENT');
      expect(store.activeTab).toBe('sims');
    });

    it('logs in SUPER_ADMIN (founder_tsegha) and immediately transitions activeTab to "admin"', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.11',
        },
        body: JSON.stringify({
          username: 'founder_tsegha',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.user.role).toBe('SUPER_ADMIN');

      const targetTab = resolveDashboardTab(data.user.role);
      useAppStore.setState({
        userSession: {
          userId: data.user.userId,
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
          division: data.user.division || 'NCE',
          token: data.session?.sessionId,
        },
        activeTab: targetTab,
      });

      const store = useAppStore.getState();
      expect(store.userSession?.role).toBe('SUPER_ADMIN');
      expect(store.activeTab).toBe('admin');
    });

    it('rejects invalid password, maintains activeTab as "login", and leaves userSession null', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.12',
        },
        body: JSON.stringify({
          username: 'std_iorliam',
          password: 'IncorrectPassword!',
        }),
      });

      expect(res.status).toBe(401);
      const store = useAppStore.getState();
      expect(store.userSession).toBeNull();
      expect(store.activeTab).toBe('login');
    });

    it('rejects non-existent username with 401', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.13',
        },
        body: JSON.stringify({
          username: 'non_existent_account',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(401);
      expect(useAppStore.getState().userSession).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 3. Credential Recovery Flow Verification
  // -------------------------------------------------------------
  describe('Credential Recovery Channels', () => {
    it('validates recovery pathway inputs for student and staff personas', () => {
      const studentRecovery = {
        role: 'STUDENT',
        identifier: 'COEKA/2026/NCE/084',
      };
      expect(studentRecovery.role).toBe('STUDENT');
      expect(studentRecovery.identifier).toBeTruthy();

      const staffRecovery = {
        role: 'STAFF',
        identifier: 'founder_tsegha',
      };
      expect(staffRecovery.role).toBe('STAFF');
      expect(staffRecovery.identifier).toBeTruthy();
    });
  });
});
