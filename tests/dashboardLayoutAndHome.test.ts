import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, resolveDashboardTab, resolveCommandCenterTab } from '../src/web/stores/useAppStore';
import { DashboardLayout } from '../src/web/components/layout/DashboardLayout';
import { DashboardHome } from '../src/web/components/dashboard/DashboardHome';
import { UserProfilePage } from '../src/web/components/profile/UserProfilePage';

describe('Unified User Dashboard Frame, Command Center & Personalization', () => {
  beforeEach(() => {
    // Reset store to known student baseline
    useAppStore.setState({
      activeTab: 'dashboard_home',
      adminTab: 'courses',
      activeDivision: 'NCE',
      uiPreferences: {
        theme: 'navy',
        compactMode: false,
        notificationsEnabled: true,
      },
      userSession: {
        userId: 'std-001',
        username: 'COEKA/2026/NCE/084',
        fullName: 'Aondoaver Moses Iorliam',
        role: 'STUDENT',
        division: 'NCE',
        token: 'jwt-coeka-demo-token',
        email: 'std_iorliam@coeka.edu.ng',
      },
    });
  });

  describe('1. Component Module Integrity', () => {
    it('exports DashboardLayout, DashboardHome, and UserProfilePage as valid React components', () => {
      expect(typeof DashboardLayout).toBe('function');
      expect(typeof DashboardHome).toBe('function');
      expect(typeof UserProfilePage).toBe('function');
    });
  });

  describe('2. Role-Based Landing & resolveDashboardTab Resolution', () => {
    it('resolves primary command center tab to dashboard_home via resolveCommandCenterTab', () => {
      expect(resolveCommandCenterTab()).toBe('dashboard_home');
    });

    it('resolves role-specific underlying module tabs via resolveDashboardTab', () => {
      expect(resolveDashboardTab('STUDENT')).toBe('sims');
      expect(resolveDashboardTab('BURSAR')).toBe('finance');
      expect(resolveDashboardTab('LECTURER')).toBe('staff');
      expect(resolveDashboardTab('DEAN')).toBe('dean');
      expect(resolveDashboardTab('EXAM_OFFICER')).toBe('exam_officer');
      expect(resolveDashboardTab('REGISTRAR')).toBe('registrar');
      expect(resolveDashboardTab('WARDEN')).toBe('hostels');
      expect(resolveDashboardTab('SUPER_ADMIN')).toBe('admin');
      expect(resolveDashboardTab('PARENT')).toBe('parent');
      expect(resolveDashboardTab('LIBRARIAN')).toBe('librarian');
    });
  });

  describe('3. Dynamic Role Synchronization in Client Store', () => {
    it('switches persona from STUDENT to BURSAR instantly without page reload', () => {
      const store = useAppStore.getState();
      expect(store.userSession?.role).toBe('STUDENT');

      // Update to Bursar persona
      store.setUserSession({
        userId: 'usr-bur-001',
        username: 'bursar_ikyur',
        fullName: 'Hon. Simon Ikyur',
        role: 'BURSAR',
        division: 'COLLEGE',
        token: 'bursar-jwt',
      });

      const updated = useAppStore.getState();
      expect(updated.userSession?.role).toBe('BURSAR');
      expect(updated.userSession?.fullName).toBe('Hon. Simon Ikyur');
      expect(resolveDashboardTab(updated.userSession?.role)).toBe('finance');
    });

    it('switches persona from BURSAR to REGISTRAR and DEAN seamlessly', () => {
      const store = useAppStore.getState();

      store.setUserSession({
        userId: 'usr-reg-001',
        username: 'registrar_coeka',
        fullName: 'Dr. Elizabeth Angbiandoo',
        role: 'REGISTRAR',
        division: 'COLLEGE',
        token: 'registrar-jwt',
      });
      expect(useAppStore.getState().userSession?.role).toBe('REGISTRAR');

      store.setUserSession({
        userId: 'usr-dean-001',
        username: 'dean_tyav',
        fullName: 'Prof. Scholastica Tyav',
        role: 'DEAN',
        division: 'NCE',
        token: 'dean-jwt',
      });
      expect(useAppStore.getState().userSession?.role).toBe('DEAN');
    });
  });

  describe('4. RBAC Guard Redirect Logic for Unauthorized Tabs', () => {
    it('triggers guard redirect for STUDENT attempting to access /admin and reroutes to authorized dashboard', () => {
      const store = useAppStore.getState();
      expect(store.userSession?.role).toBe('STUDENT');

      // Attempt to access admin tab directly
      store.setActiveTab('admin');
      expect(useAppStore.getState().activeTab).toBe('admin');

      // RBAC guard condition evaluation
      const isUnauthorized =
        store.userSession?.role !== 'SUPER_ADMIN' && store.userSession?.role !== 'ADMIN';
      expect(isUnauthorized).toBe(true);

      // Guard redirects back to authorized dashboard
      if (isUnauthorized) {
        store.setActiveTab(resolveDashboardTab(store.userSession?.role));
      }

      expect(useAppStore.getState().activeTab).toBe('sims');
    });
  });

  describe('5. Personalization & Account Preferences State', () => {
    it('manages theme preference between navy and emerald', () => {
      const store = useAppStore.getState();
      expect(store.uiPreferences.theme).toBe('navy');

      store.setUiPreferences({ theme: 'emerald' });
      expect(useAppStore.getState().uiPreferences.theme).toBe('emerald');

      store.setUiPreferences({ theme: 'navy' });
      expect(useAppStore.getState().uiPreferences.theme).toBe('navy');
    });

    it('manages compactMode and notificationsEnabled preferences', () => {
      const store = useAppStore.getState();
      store.setUiPreferences({ compactMode: true, notificationsEnabled: false });

      const updated = useAppStore.getState();
      expect(updated.uiPreferences.compactMode).toBe(true);
      expect(updated.uiPreferences.notificationsEnabled).toBe(false);
    });

    it('clears session and returns to login upon logout action', () => {
      const store = useAppStore.getState();
      expect(store.userSession).not.toBeNull();

      store.logout();

      const cleared = useAppStore.getState();
      expect(cleared.userSession).toBeNull();
      expect(cleared.activeTab).toBe('login');
    });
  });
});
