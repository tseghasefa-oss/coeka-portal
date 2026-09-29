import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { useAppStore } from '../src/web/stores/useAppStore';
import {
  DIVISION_FEATURES,
  isFeatureAllowed,
  getStudentNavItems,
} from '../src/web/components/student/StudentSidebar';
import { DivisionGuard } from '../src/web/components/common/DivisionGuard';
import { CourseRegistrationView } from '../src/web/components/student/CourseRegistrationView';
import { SenateResultsView } from '../src/web/components/student/SenateResultsView';
import { HostelAllocationView } from '../src/web/components/student/HostelAllocationView';
import { createMemoryContainer, resetDefaultMemoryContainer } from '../src/infrastructure/container';
import { AuthService } from '../src/services/auth/authService';
import { UserAdminService } from '../src/services/admin/userAdminService';

describe('Institutional Feature Gating & Navigation Security Suite', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
    useAppStore.setState({
      activeTab: 'sims',
      activeDivision: 'NCE',
      toast: null,
      userSession: {
        userId: 'std-deg-001',
        username: 'COEKA/2026/DEG/901',
        fullName: 'Degree Test',
        role: 'STUDENT',
        division: 'DEGREE',
        token: 'token-deg',
        email: 'degree@test.com',
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 1. Division-Based Feature Map & Navigation Filtering (Sidebar Gate)
  // ---------------------------------------------------------------------------
  describe('1. Division-Based Feature Map & Sidebar Gate', () => {
    it('defines the strict institutional DIVISION_FEATURES mapping', () => {
      expect(DIVISION_FEATURES.DEGREE).toEqual([
        'profile',
        'fees',
        'course_reg',
        'results',
        'hostels',
        'clearance',
      ]);
      expect(DIVISION_FEATURES.NCE).toEqual([
        'profile',
        'fees',
        'course_reg',
        'results',
        'hostels',
        'clearance',
      ]);
      expect(DIVISION_FEATURES.SECONDARY).toEqual([
        'profile',
        'fees',
        'report_cards',
        'timetable',
        'clearance',
      ]);
      expect(DIVISION_FEATURES.PRIMARY).toEqual([
        'profile',
        'fees',
        'report_cards',
        'timetable',
        'clearance',
      ]);
    });

    it('allows tertiary features for DEGREE and NCE students', () => {
      expect(isFeatureAllowed('DEGREE', 'course_reg')).toBe(true);
      expect(isFeatureAllowed('DEGREE', 'results')).toBe(true);
      expect(isFeatureAllowed('DEGREE', 'hostels')).toBe(true);

      expect(isFeatureAllowed('NCE', 'course_reg')).toBe(true);
      expect(isFeatureAllowed('NCE', 'results')).toBe(true);
      expect(isFeatureAllowed('NCE', 'hostels')).toBe(true);
    });

    it('strictly blocks tertiary features for SECONDARY and PRIMARY students', () => {
      // Secondary
      expect(isFeatureAllowed('SECONDARY', 'course_reg')).toBe(false);
      expect(isFeatureAllowed('SECONDARY', 'results')).toBe(false);
      expect(isFeatureAllowed('SECONDARY', 'hostels')).toBe(false);

      // Primary
      expect(isFeatureAllowed('PRIMARY', 'course_reg')).toBe(false);
      expect(isFeatureAllowed('PRIMARY', 'results')).toBe(false);
      expect(isFeatureAllowed('PRIMARY', 'hostels')).toBe(false);

      // Basic education features allowed
      expect(isFeatureAllowed('SECONDARY', 'report_cards')).toBe(true);
      expect(isFeatureAllowed('SECONDARY', 'timetable')).toBe(true);
      expect(isFeatureAllowed('PRIMARY', 'report_cards')).toBe(true);
      expect(isFeatureAllowed('PRIMARY', 'timetable')).toBe(true);
    });

    it('omits Course Registration, Senate Results, and Hostels from Secondary sidebar', () => {
      const items = getStudentNavItems('SECONDARY');
      const labels = items.map((i) => i.label);
      const features = items.map((i) => i.feature);

      expect(labels).not.toContain('Course Registration');
      expect(labels).not.toContain('My Academic Results');
      expect(labels).not.toContain('Hostel Allocation');

      expect(features).not.toContain('course_reg');
      expect(features).not.toContain('results');
      expect(features).not.toContain('hostels');

      expect(labels).toContain('Command Center');
      expect(labels).toContain('Continuous Assessment & Reports');
      expect(labels).toContain('Class Timetable');
      expect(labels).toContain('Tuition & Fees');
      expect(labels).toContain('Student Bio & ID');
    });

    it('omits Course Registration, Senate Results, and Hostels from Primary sidebar', () => {
      const items = getStudentNavItems('PRIMARY');
      const labels = items.map((i) => i.label);
      const features = items.map((i) => i.feature);

      expect(labels).not.toContain('Course Registration');
      expect(labels).not.toContain('My Academic Results');
      expect(labels).not.toContain('Hostel Allocation');

      expect(features).not.toContain('course_reg');
      expect(features).not.toContain('results');
      expect(features).not.toContain('hostels');

      expect(labels).toContain('Command Center');
      expect(labels).toContain('Star Report & Progress');
      expect(labels).toContain('Daily Adventure Schedule');
      expect(labels).toContain('School Fees & Levies');
      expect(labels).toContain('Pupil Profile & ID');
    });

    it('includes all tertiary modules for Degree and NCE students', () => {
      const degItems = getStudentNavItems('DEGREE');
      const degFeatures = degItems.map((i) => i.feature);

      expect(degFeatures).toContain('course_reg');
      expect(degFeatures).toContain('results');
      expect(degFeatures).toContain('hostels');
      expect(degFeatures).toContain('fees');
      expect(degFeatures).toContain('profile');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. DivisionGuard Component Integrity
  // ---------------------------------------------------------------------------
  describe('2. DivisionGuard Component Integrity', () => {
    it('exports DivisionGuard, CourseRegistrationView, SenateResultsView, and HostelAllocationView', () => {
      expect(typeof DivisionGuard).toBe('function');
      expect(typeof CourseRegistrationView).toBe('function');
      expect(typeof SenateResultsView).toBe('function');
      expect(typeof HostelAllocationView).toBe('function');
    });

    it('sets error toast message when triggering division security alert in store', () => {
      const store = useAppStore.getState();
      expect(store.toast).toBeNull();

      store.showToast('This feature is not available for your academic division.', 'error');

      const updated = useAppStore.getState();
      expect(updated.toast?.message).toBe('This feature is not available for your academic division.');
      expect(updated.toast?.type).toBe('error');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. API-Level Security Enforcement (HTTP 403 Forbidden)
  // ---------------------------------------------------------------------------
  describe('3. API Route Division Security Enforcement', () => {
    it('blocks SECONDARY student from POST /api/student/courses/register with 403', async () => {
      // Login via app
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sec@test.com', password: 'Pass123!' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData: any = await loginRes.json();

      const res = await app.request('/api/student/courses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.sessionId}`,
        },
        body: JSON.stringify({
          courseIds: ['crs-csc111'],
        }),
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toBe('Unauthorized: Feature not available for this division');
    });

    it('blocks PRIMARY student from POST /api/student/register-course with 403', async () => {
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pri@test.com', password: 'Pass123!' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData: any = await loginRes.json();

      const res = await app.request('/api/student/register-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.sessionId}`,
        },
        body: JSON.stringify({
          courseIds: ['crs-csc111'],
        }),
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toBe('Unauthorized: Feature not available for this division');
    });

    it('blocks SECONDARY student from POST /api/hostels/reserve and lock-bed with 403', async () => {
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sec@test.com', password: 'Pass123!' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData: any = await loginRes.json();

      const resReserve = await app.request('/api/hostels/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.sessionId}`,
        },
        body: JSON.stringify({
          bedspaceId: 'bed-101-a',
        }),
      });

      expect(resReserve.status).toBe(403);
      const jsonReserve: any = await resReserve.json();
      expect(jsonReserve.error).toBe('Unauthorized: Feature not available for this division');

      const resLock = await app.request('/api/hostels/lock-bed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.sessionId}`,
        },
        body: JSON.stringify({
          bedspaceId: 'bed-101-a',
        }),
      });

      expect(resLock.status).toBe(403);
      const jsonLock: any = await resLock.json();
      expect(jsonLock.error).toBe('Unauthorized: Feature not available for this division');
    });

    it('blocks PRIMARY student from GET /api/hostels/student-status with 403', async () => {
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pri@test.com', password: 'Pass123!' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData: any = await loginRes.json();

      const res = await app.request('/api/hostels/student-status', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${loginData.sessionId}`,
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toBe('Unauthorized: Feature not available for this division');
    });

    it('allows DEGREE student to access GET /api/student/courses/available', async () => {
      const loginRes = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'degree@test.com', password: 'Pass123!' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData: any = await loginRes.json();

      const res = await app.request('/api/student/courses/available', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${loginData.sessionId}`,
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(Array.isArray(json.courses)).toBe(true);
    });

    it('enforces 403 using X-Demo-Role and X-Demo-Division headers', async () => {
      const res = await app.request('/api/student/courses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
          'X-Demo-Division': 'SECONDARY',
        },
        body: JSON.stringify({ courseIds: ['crs-csc111'] }),
      });
      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toBe('Unauthorized: Feature not available for this division');
    });
  });
});
