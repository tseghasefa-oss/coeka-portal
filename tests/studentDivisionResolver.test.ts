import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../src/web/stores/useAppStore';
import { StudentDivisionResolver } from '../src/web/components/student/StudentDivisionResolver';
import { TertiaryAcademicView } from '../src/web/components/student/TertiaryAcademicView';
import { SecondaryAcademicView } from '../src/web/components/student/SecondaryAcademicView';
import { PrimaryAcademicView } from '../src/web/components/student/PrimaryAcademicView';
import { StudentDashboard } from '../src/web/components/student/StudentDashboard';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';
import { createMemoryContainer, resetDefaultMemoryContainer } from '../src/infrastructure/container';

describe('Student Division-Based Experience & Resolver Suite', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeTab: 'sims',
      activeDivision: 'NCE',
      userSession: {
        userId: 'std-deg-001',
        username: 'COEKA/2026/DEG/901',
        fullName: 'Chiemeka Prince Odo',
        role: 'STUDENT',
        division: 'DEGREE',
        token: 'test-token',
        email: 'degree@test.com',
      },
    });
  });

  describe('1. Component Module Integrity', () => {
    it('exports all division components and resolver as valid functions', () => {
      expect(typeof StudentDivisionResolver).toBe('function');
      expect(typeof TertiaryAcademicView).toBe('function');
      expect(typeof SecondaryAcademicView).toBe('function');
      expect(typeof PrimaryAcademicView).toBe('function');
      expect(typeof StudentDashboard).toBe('function');
    });
  });

  describe('2. Division Resolver State & Switching Logic', () => {
    it('sets initial session to DEGREE student correctly', () => {
      const state = useAppStore.getState();
      expect(state.userSession?.division).toBe('DEGREE');
      expect(state.userSession?.email).toBe('degree@test.com');
    });

    it('updates state when switching to NCE student', () => {
      useAppStore.setState({
        activeDivision: 'NCE',
        userSession: {
          userId: 'std-nce-002',
          username: 'COEKA/2026/NCE/902',
          fullName: 'Amina Fatima Bello',
          role: 'STUDENT',
          division: 'NCE',
          token: 'test-token',
          email: 'nce@test.com',
        },
      });
      const state = useAppStore.getState();
      expect(state.userSession?.division).toBe('NCE');
      expect(state.userSession?.fullName).toBe('Amina Fatima Bello');
    });

    it('updates state when switching to SECONDARY student', () => {
      useAppStore.setState({
        activeDivision: 'SECONDARY',
        userSession: {
          userId: 'std-sec-003',
          username: 'DSS/2026/SEC/903',
          fullName: 'Terkimbi Isaac Iorfa',
          role: 'STUDENT',
          division: 'SECONDARY',
          token: 'test-token',
          email: 'sec@test.com',
        },
      });
      const state = useAppStore.getState();
      expect(state.userSession?.division).toBe('SECONDARY');
      expect(state.userSession?.username).toBe('DSS/2026/SEC/903');
    });

    it('updates state when switching to PRIMARY pupil', () => {
      useAppStore.setState({
        activeDivision: 'PRIMARY',
        userSession: {
          userId: 'std-pri-004',
          username: 'SPS/2026/PRI/904',
          fullName: 'Miracle Joy Ameh',
          role: 'STUDENT',
          division: 'PRIMARY',
          token: 'test-token',
          email: 'pri@test.com',
        },
      });
      const state = useAppStore.getState();
      expect(state.userSession?.division).toBe('PRIMARY');
      expect(state.userSession?.email).toBe('pri@test.com');
    });
  });

  describe('3. Test Student Seed Authentication Verification', () => {
    it('authenticates degree@test.com with Pass123!', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();
      const auth = new AuthService(container.db, container.cache);

      const user = await auth.verifyCredentials('degree@test.com', 'Pass123!');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('STUDENT');
      expect(user?.division).toBe('DEGREE');
      expect(user?.fullName).toBe('Degree Test');
    });

    it('authenticates nce@test.com with Pass123!', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();
      const auth = new AuthService(container.db, container.cache);

      const user = await auth.verifyCredentials('nce@test.com', 'Pass123!');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('STUDENT');
      expect(user?.division).toBe('NCE');
      expect(user?.fullName).toBe('NCE Test');
    });

    it('authenticates sec@test.com with Pass123!', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();
      const auth = new AuthService(container.db, container.cache);

      const user = await auth.verifyCredentials('sec@test.com', 'Pass123!');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('STUDENT');
      expect(user?.division).toBe('SECONDARY');
      expect(user?.fullName).toBe('Sec Test');
    });

    it('authenticates pri@test.com with Pass123!', async () => {
      const container = createMemoryContainer();
      const userAdmin = new UserAdminService(container.db);
      await userAdmin.ensureSeedUsers();
      const auth = new AuthService(container.db, container.cache);

      const user = await auth.verifyCredentials('pri@test.com', 'Pass123!');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('STUDENT');
      expect(user?.division).toBe('PRIMARY');
      expect(user?.fullName).toBe('Pri Test');
    });
  });
});
