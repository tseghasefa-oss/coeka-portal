import { create } from 'zustand';

export type SchoolDivision = 'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY';
export type UserRole =
  | 'STUDENT'
  | 'STAFF'
  | 'LECTURER'
  | 'DEAN'
  | 'HOD'
  | 'BURSAR'
  | 'BURSARY'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'PARENT';

export type ActiveTab =
  | 'website'
  | 'admissions'
  | 'sims'
  | 'finance'
  | 'results'
  | 'hostels'
  | 'staff'
  | 'parent'
  | 'admin'
  | 'login'
  | 'unauthorized';

export type AdminTab = 'courses' | 'fees' | 'users' | 'settings';

export interface UserSession {
  userId?: string;
  username: string;
  fullName: string;
  role: UserRole;
  division: SchoolDivision | string;
  token?: string;
  email?: string;
}

export interface UiPreferences {
  theme: 'emerald' | 'navy';
  compactMode: boolean;
  notificationsEnabled: boolean;
}

export interface AppState {
  // Navigation & Routing State
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Master Admin Area Sub-Navigation State
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;

  // Active Institutional Division State
  activeDivision: SchoolDivision;
  setActiveDivision: (division: SchoolDivision) => void;

  // Multi-Ward Tracking State (for Parent & Guardian Portal)
  activeWardId: 'std-001' | 'std-002' | 'std-003';
  setActiveWardId: (wardId: 'std-001' | 'std-002' | 'std-003') => void;

  // User Authentication & Session State
  userSession: UserSession | null;
  setUserSession: (session: UserSession | null) => void;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;

  // Global UI Preferences
  uiPreferences: UiPreferences;
  setUiPreferences: (prefs: Partial<UiPreferences>) => void;

  // Utility Actions
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'website',
  setActiveTab: (activeTab) => set({ activeTab }),

  adminTab: 'courses',
  setAdminTab: (adminTab) => set({ adminTab, activeTab: 'admin' }),

  activeDivision: 'NCE',
  setActiveDivision: (activeDivision) => set({ activeDivision }),

  activeWardId: 'std-001',
  setActiveWardId: (activeWardId) => set({ activeWardId }),

  userSession: {
    userId: 'usr-std-001',
    username: 'COEKA/2026/NCE/084',
    fullName: 'Aondoaver Moses Iorliam',
    role: 'STUDENT',
    division: 'NCE',
    token: 'jwt-coeka-demo-token',
  },
  setUserSession: (userSession) => set({ userSession }),

  authLoading: false,
  setAuthLoading: (authLoading) => set({ authLoading }),

  uiPreferences: {
    theme: 'emerald',
    compactMode: false,
    notificationsEnabled: true,
  },
  setUiPreferences: (prefs) =>
    set((state) => ({
      uiPreferences: { ...state.uiPreferences, ...prefs },
    })),

  logout: () =>
    set({
      userSession: null,
      activeTab: 'login',
      adminTab: 'courses',
    }),
}));

/**
 * Resolves the appropriate dashboard view tab based on the authenticated user's role.
 * SUPER_ADMIN / ADMIN -> 'admin'
 * LECTURER / DEAN / HOD / STAFF -> 'staff'
 * BURSAR / BURSARY -> 'finance'
 * PARENT -> 'parent'
 * STUDENT (or default) -> 'sims'
 */
export function resolveDashboardTab(role?: string): ActiveTab {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return 'admin';
    case 'LECTURER':
    case 'DEAN':
    case 'HOD':
    case 'STAFF':
      return 'staff';
    case 'BURSAR':
    case 'BURSARY':
      return 'finance';
    case 'PARENT':
      return 'parent';
    case 'STUDENT':
    default:
      return 'sims';
  }
}
