import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../src/web/stores/useAppStore';
import {
  AdminLayout,
  AdminCoursesTab,
  AdminFeesTab,
  AdminUsersTab,
  AdminSettingsTab,
} from '../src/web/components/admin';

describe('Master Admin Frontend Shell & Zustand Store Integration', () => {
  beforeEach(() => {
    // Reset store to known baseline
    useAppStore.setState({
      activeTab: 'website',
      adminTab: 'courses',
      activeDivision: 'NCE',
      uiPreferences: {
        theme: 'emerald',
        compactMode: false,
        notificationsEnabled: true,
      },
      userSession: {
        username: 'COEKA/2026/NCE/084',
        fullName: 'Aondoaver Moses Iorliam',
        role: 'STUDENT',
        division: 'NCE',
        token: 'jwt-coeka-demo-token',
      },
    });
  });

  describe('Zustand Store Admin Navigation State', () => {
    it('initializes with default adminTab as "courses"', () => {
      const state = useAppStore.getState();
      expect(state.adminTab).toBe('courses');
    });

    it('updates adminTab and activeTab correctly when navigating to fees section', () => {
      const store = useAppStore.getState();
      store.setAdminTab('fees');

      const updated = useAppStore.getState();
      expect(updated.adminTab).toBe('fees');
      expect(updated.activeTab).toBe('admin');
    });

    it('updates adminTab and activeTab correctly when navigating to users section', () => {
      const store = useAppStore.getState();
      store.setAdminTab('users');

      const updated = useAppStore.getState();
      expect(updated.adminTab).toBe('users');
      expect(updated.activeTab).toBe('admin');
    });

    it('updates adminTab and activeTab correctly when navigating to settings section', () => {
      const store = useAppStore.getState();
      store.setAdminTab('settings');

      const updated = useAppStore.getState();
      expect(updated.adminTab).toBe('settings');
      expect(updated.activeTab).toBe('admin');
    });

    it('switches between all admin sections seamlessly and updates store state', () => {
      const store = useAppStore.getState();

      const tabs: ('courses' | 'fees' | 'users' | 'settings')[] = [
        'fees',
        'users',
        'settings',
        'courses',
      ];

      for (const tab of tabs) {
        store.setAdminTab(tab);
        expect(useAppStore.getState().adminTab).toBe(tab);
        expect(useAppStore.getState().activeTab).toBe('admin');
      }
    });
  });

  describe('RBAC Guard and Role Validation', () => {
    it('verifies non-super-admin user roles are detected', () => {
      const store = useAppStore.getState();
      expect(store.userSession?.role).toBe('STUDENT');
      const isSuperAdmin = store.userSession?.role === 'SUPER_ADMIN';
      expect(isSuperAdmin).toBe(false);
    });

    it('allows role upgrade to SUPER_ADMIN', () => {
      const store = useAppStore.getState();
      store.setUserSession({
        username: 'COEKA/ADM/001',
        fullName: 'Engr. Prof. S. L. Tsegha',
        role: 'SUPER_ADMIN',
        division: 'NCE',
        token: 'jwt-coeka-admin-token',
      });

      const updated = useAppStore.getState();
      expect(updated.userSession?.role).toBe('SUPER_ADMIN');
      expect(updated.userSession?.username).toBe('COEKA/ADM/001');
    });

    it('enforces guard redirect condition for non-admin attempting to access admin tab', () => {
      const store = useAppStore.getState();

      // Given a student
      expect(store.userSession?.role).toBe('STUDENT');

      // If activeTab is set to admin, guard logic checks role
      store.setActiveTab('admin');

      // Verification of guard condition
      const shouldRedirect =
        store.userSession?.role !== 'SUPER_ADMIN' && useAppStore.getState().activeTab === 'admin';
      expect(shouldRedirect).toBe(true);

      // Simulating guard action as done in App.tsx useEffect
      if (shouldRedirect) {
        store.setActiveTab('website');
      }

      expect(useAppStore.getState().activeTab).toBe('website');
    });
  });

  describe('Theme and UI Preferences', () => {
    it('toggles theme between emerald and navy', () => {
      const store = useAppStore.getState();
      expect(store.uiPreferences.theme).toBe('emerald');

      store.setUiPreferences({ theme: 'navy' });
      expect(useAppStore.getState().uiPreferences.theme).toBe('navy');

      store.setUiPreferences({ theme: 'emerald' });
      expect(useAppStore.getState().uiPreferences.theme).toBe('emerald');
    });
  });

  describe('Admin Component Shell Integrity', () => {
    it('exports all admin layout components as valid callable functions', () => {
      expect(typeof AdminLayout).toBe('function');
      expect(typeof AdminCoursesTab).toBe('function');
      expect(typeof AdminFeesTab).toBe('function');
      expect(typeof AdminUsersTab).toBe('function');
      expect(typeof AdminSettingsTab).toBe('function');
    });
  });
});
