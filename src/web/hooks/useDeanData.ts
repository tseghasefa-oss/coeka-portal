import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';

const API_BASE = '';

function getAuthHeaders(role: string = 'DEAN', token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Demo-Role': role,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface PendingCourseQueueItem {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  level: number;
  programmeId: string;
  programmeName: string;
  departmentId?: string;
  departmentName?: string;
  lecturerName: string;
  lecturerStaffId?: string;
  draftCount: number;
  publishedCount: number;
  totalStudents: number;
  lastSubmittedAt?: number;
  status: 'PENDING_APPROVAL' | 'PARTIALLY_APPROVED' | 'APPROVED';
}

export interface CourseReviewData {
  course: {
    id: string;
    code: string;
    title: string;
    creditUnits: number;
    level: number;
    programmeName?: string;
    departmentName?: string;
  };
  metrics: {
    totalStudents: number;
    draftCount: number;
    publishedCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passCount: number;
    failCount: number;
    passRate: number;
    gradeDistribution: Record<string, number>;
  };
  approvalHistory: Array<{
    id: string;
    deanUserId: string;
    deanName?: string;
    totalStudentsApproved: number;
    approvalStatus: string;
    comments?: string;
    approvedAt: number;
  }>;
  results: Array<{
    gradeEntryId: string;
    studentId: string;
    matricNumber: string;
    studentName: string;
    gender: string;
    ca1Score: number;
    ca2Score: number;
    examScore: number;
    totalScore: number;
    letterGrade: string;
    gradePoint: number;
    status: 'DRAFT' | 'PUBLISHED';
    publishedAt?: number;
  }>;
}

export interface AppealItem {
  id: string;
  studentId: string;
  studentMatric: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  gradeEntryId?: string;
  currentScores?: {
    ca1Score: number;
    ca2Score: number;
    examScore: number;
    totalScore: number;
    letterGrade: string;
  };
  reason: string;
  desiredCorrection?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNotes?: string;
  resolvedByDeanId?: string;
  resolvedByDeanName?: string;
  resolvedAt?: number;
  createdAt: number;
}

export interface FacultyMapData {
  allocations: Array<{
    allocationId: string;
    courseId: string;
    courseCode: string;
    courseTitle: string;
    creditUnits: number;
    level: number;
    semesterId: string;
    staffId: string;
    staffName: string;
    staffEmail?: string;
    role: string;
  }>;
  lecturers: Array<{ id: string; name: string; email: string }>;
  courses: Array<{ id: string; code: string; title: string; level: number; units: number; assignedLecturer?: string }>;
}

/**
 * 1. Fetch courses awaiting approval in the Dean's Queue
 */
export function useDeanApprovalQueue() {
  const { userSession } = useAppStore();

  return useQuery<PendingCourseQueueItem[]>({
    queryKey: ['dean', 'queue'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/dean/queue`, {
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load Dean approval queue');
      const data: any = await res.json();
      return data.queue || [];
    },
    staleTime: 30000,
  });
}

/**
 * 2. Fetch comprehensive course review broadsheet & statistics
 */
export function useCourseReview(courseId: string | null) {
  const { userSession } = useAppStore();

  return useQuery<CourseReviewData | null>({
    queryKey: ['dean', 'course', courseId, 'review'],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await fetch(`${API_BASE}/api/dean/courses/${courseId}/review`, {
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to review course results');
      return (await res.json()) as CourseReviewData;
    },
    enabled: Boolean(courseId),
  });
}

/**
 * 3. Mutation: Dean Master Switch to Approve & Publish Course Results
 */
export function useApproveResults() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async ({ courseId, comments }: { courseId: string; comments?: string }) => {
      const res = await fetch(`${API_BASE}/api/dean/courses/${courseId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        body: JSON.stringify({ comments }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Approval failed' }));
        throw new Error(error.error || 'Failed to approve results');
      }
      return (await res.json()) as any;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dean', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['dean', 'course', variables.courseId, 'review'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'results'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'courses'] });
    },
  });
}

/**
 * 4. Fetch Student Grade Appeals
 */
export function useDeanAppeals(filters?: { status?: string; courseId?: string }) {
  const { userSession } = useAppStore();

  return useQuery<AppealItem[]>({
    queryKey: ['dean', 'appeals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.courseId) params.set('courseId', filters.courseId);

      const res = await fetch(`${API_BASE}/api/dean/appeals?${params.toString()}`, {
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load grade appeals');
      const data: any = await res.json();
      return data.appeals || [];
    },
    staleTime: 30000,
  });
}

/**
 * 5. Mutation: Resolve Student Appeal (Approve with Score Correction or Reject)
 */
export function useResolveAppeal() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async ({
      appealId,
      decision,
      ca1Score,
      ca2Score,
      examScore,
      decisionNotes,
    }: {
      appealId: string;
      decision: 'APPROVED' | 'REJECTED';
      ca1Score?: number;
      ca2Score?: number;
      examScore?: number;
      decisionNotes?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/dean/appeals/${appealId}/resolve`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        body: JSON.stringify({ decision, ca1Score, ca2Score, examScore, decisionNotes }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Appeal resolution failed' }));
        throw new Error(error.error || 'Failed to resolve grade appeal');
      }
      return (await res.json()) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dean', 'appeals'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'results'] });
    },
  });
}

/**
 * 6. Mutation: Student Submit Appeal
 */
export function useSubmitAppeal() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      courseId: string;
      reason: string;
      desiredCorrection?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/dean/appeals/submit`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'STUDENT', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Appeal submission failed' }));
        throw new Error(error.error || 'Failed to submit grade appeal');
      }
      return (await res.json()) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dean', 'appeals'] });
    },
  });
}

/**
 * 7. Fetch Faculty Assignments & Course-Lecturer Map
 */
export function useFacultyAssignments() {
  const { userSession } = useAppStore();

  return useQuery<FacultyMapData>({
    queryKey: ['dean', 'faculty', 'assignments'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/dean/faculty/assignments`, {
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load faculty assignments');
      return (await res.json()) as FacultyMapData;
    },
    staleTime: 60000,
  });
}

/**
 * 8. Mutation: Assign Lecturer to Course
 */
export function useAssignFaculty() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: {
      courseId: string;
      staffId: string;
      semesterId?: string;
      role?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/dean/faculty/assign`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Assignment failed' }));
        throw new Error(error.error || 'Failed to assign lecturer to course');
      }
      return (await res.json()) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dean', 'faculty', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });
}

/**
 * 9. Mutation: Unassign Lecturer from Course
 */
export function useUnassignFaculty() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (allocationId: string) => {
      const res = await fetch(`${API_BASE}/api/dean/faculty/assign/${allocationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(userSession?.role || 'DEAN', userSession?.token),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to unassign lecturer');
      return (await res.json()) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dean', 'faculty', 'assignments'] });
    },
  });
}
