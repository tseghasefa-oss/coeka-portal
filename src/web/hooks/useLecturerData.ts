import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';
import { API_HOST } from '../config/api';

const API_BASE = `${API_HOST}/api/lecturer`;

export interface LecturerCourseItem {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semesterTerm: number;
  programmeName: string;
  divisionName: string;
}

export interface CourseRosterItem {
  studentId: string;
  matricNumber: string;
  fullName: string;
  division: string;
  level: number;
  programmeName: string;
  grade?: {
    ca1Score: number;
    ca2Score: number;
    caTotal: number;
    examScore: number;
    totalScore: number;
    letterGrade: string;
    gradePoint: number;
    status: 'DRAFT' | 'PUBLISHED';
  } | null;
  attendance: {
    totalLectures: number;
    attendedCount: number;
    attendanceRate: number;
  };
}

export interface CourseGradesData {
  course: {
    id: string;
    code: string;
    title: string;
    creditUnits: number;
    level: number;
    programmeName: string;
    divisionName: string;
  };
  grades: {
    id: string;
    studentId: string;
    matricNumber: string;
    studentName: string;
    ca1Score: number;
    ca2Score: number;
    caTotal: number;
    examScore: number;
    totalScore: number;
    letterGrade: string;
    gradePoint: number;
    status: 'DRAFT' | 'PUBLISHED';
  }[];
  summary: {
    totalSubmissions: number;
    publishedCount: number;
    draftCount: number;
    averageScore: number;
    passCount: number;
    failCount: number;
  };
}

export interface AttendanceRecordItem {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  lectureDate: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
}

function getLecturerHeaders(role?: string, token?: string): HeadersInit {
  const effectiveRole = role || 'LECTURER';
  const effectiveToken = token || 'coeka_sess_demo_lecturer';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${effectiveToken}`,
    'X-Demo-Role': effectiveRole,
  };
}

/**
 * Hook to retrieve courses assigned to the logged-in lecturer
 */
export function useLecturerCourses() {
  const { userSession } = useAppStore();

  return useQuery<LecturerCourseItem[]>({
    queryKey: ['lecturer', 'courses'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/courses`, {
          headers: getLecturerHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: any = await res.json();
        return (data.courses || []) as LecturerCourseItem[];
      } catch (err) {
        // Fallback baseline courses
        return [
          {
            id: 'crs-csc111',
            code: 'CSC 111',
            title: 'Introduction to Computer Systems',
            creditUnits: 2,
            level: 100,
            semesterTerm: 1,
            programmeName: 'NCE Computer Science / Mathematics',
            divisionName: 'NCE Programmes',
          },
          {
            id: 'crs-csc112',
            code: 'CSC 112',
            title: 'Problem Solving & BASIC Programming',
            creditUnits: 3,
            level: 100,
            semesterTerm: 1,
            programmeName: 'NCE Computer Science / Mathematics',
            divisionName: 'NCE Programmes',
          },
          {
            id: 'crs-bed111',
            code: 'BED 111',
            title: 'Principles of Business Education (Degree)',
            creditUnits: 3,
            level: 100,
            semesterTerm: 1,
            programmeName: 'B.Ed Business Education',
            divisionName: 'Degree Programmes',
          },
        ];
      }
    },
    staleTime: 30000,
  });
}

/**
 * Hook to retrieve class roster and current grading/attendance status
 */
export function useCourseRoster(courseId: string) {
  const { userSession } = useAppStore();

  return useQuery<{
    course: any;
    students: CourseRosterItem[];
    totalEnrolled: number;
    resultsPublished: boolean;
  }>({
    queryKey: ['lecturer', 'roster', courseId],
    queryFn: async () => {
      if (!courseId) return null as any;
      try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/roster`, {
          headers: getLecturerHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return await res.json();
      } catch (err) {
        // Fallback baseline roster
        return {
          course: {
            id: courseId,
            code: courseId.includes('112') ? 'CSC 112' : 'CSC 111',
            title: 'Introduction to Computer Systems',
            creditUnits: 2,
            level: 100,
            programmeName: 'NCE Computer Science / Mathematics',
            divisionName: 'NCE Programmes',
          },
          students: [
            {
              studentId: 'std-001',
              matricNumber: 'COEKA/2026/NCE/084',
              fullName: 'Aondoaver Moses Iorliam',
              division: 'NCE Programmes',
              level: 100,
              programmeName: 'NCE Computer Science / Mathematics',
              grade: {
                ca1Score: 16,
                ca2Score: 18,
                caTotal: 34,
                examScore: 52,
                totalScore: 86,
                letterGrade: 'A',
                gradePoint: 5.0,
                status: 'DRAFT',
              },
              attendance: {
                totalLectures: 12,
                attendedCount: 11,
                attendanceRate: 91.7,
              },
            },
            {
              studentId: 'std-002',
              matricNumber: 'COEKA/2026/NCE/087',
              fullName: 'Doose Mercy Gbadu',
              division: 'NCE Programmes',
              level: 100,
              programmeName: 'NCE Biology / Integrated Science',
              grade: {
                ca1Score: 14,
                ca2Score: 14,
                caTotal: 28,
                examScore: 46,
                totalScore: 74,
                letterGrade: 'A',
                gradePoint: 5.0,
                status: 'DRAFT',
              },
              attendance: {
                totalLectures: 12,
                attendedCount: 10,
                attendanceRate: 83.3,
              },
            },
            {
              studentId: 'std-003',
              matricNumber: 'COEKA/2026/DEG/018',
              fullName: 'Terna Victor Chia',
              division: 'Degree Programmes',
              level: 100,
              programmeName: 'B.Ed Business Education',
              grade: null,
              attendance: {
                totalLectures: 12,
                attendedCount: 9,
                attendanceRate: 75.0,
              },
            },
          ],
          totalEnrolled: 3,
          resultsPublished: false,
        };
      }
    },
    enabled: Boolean(courseId),
    staleTime: 10000,
  });
}

/**
 * Hook to retrieve course grade entries
 */
export function useCourseGrades(courseId: string) {
  const { userSession } = useAppStore();

  return useQuery<CourseGradesData>({
    queryKey: ['lecturer', 'grades', courseId],
    queryFn: async () => {
      if (!courseId) return null as any;
      try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/grades`, {
          headers: getLecturerHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return await res.json();
      } catch (err) {
        return {
          course: {
            id: courseId,
            code: 'CSC 111',
            title: 'Introduction to Computer Systems',
            creditUnits: 2,
            level: 100,
            programmeName: 'NCE Computer Science / Mathematics',
            divisionName: 'NCE Programmes',
          },
          grades: [],
          summary: {
            totalSubmissions: 0,
            publishedCount: 0,
            draftCount: 0,
            averageScore: 0,
            passCount: 0,
            failCount: 0,
          },
        };
      }
    },
    enabled: Boolean(courseId),
    staleTime: 10000,
  });
}

/**
 * Hook to retrieve attendance records for a course
 */
export function useCourseAttendance(courseId: string, lectureDate?: string) {
  const { userSession } = useAppStore();

  return useQuery<AttendanceRecordItem[]>({
    queryKey: ['lecturer', 'attendance', courseId, lectureDate],
    queryFn: async () => {
      if (!courseId) return [];
      try {
        const params = new URLSearchParams();
        if (lectureDate) params.append('date', lectureDate);
        const res = await fetch(`${API_BASE}/courses/${courseId}/attendance?${params.toString()}`, {
          headers: getLecturerHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: any = await res.json();
        return (data.attendance || []) as AttendanceRecordItem[];
      } catch (err) {
        return [];
      }
    },
    enabled: Boolean(courseId),
    staleTime: 10000,
  });
}

/**
 * Mutation to submit scores (CA1, CA2, Exam) for a student or batch
 */
export function useSubmitGrades(courseId: string) {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation<
    any,
    Error,
    | { studentId: string; ca1Score?: number; ca2Score?: number; caScore?: number; examScore?: number }
    | { grades: Array<{ studentId: string; ca1Score?: number; ca2Score?: number; examScore?: number }> }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/courses/${courseId}/grades`, {
        method: 'POST',
        headers: getLecturerHeaders(userSession?.role, userSession?.token),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData: any = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'roster', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'grades', courseId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'results'] });
    },
  });
}

/**
 * Mutation to mark attendance for a lecture date
 */
export function useMarkAttendance(courseId: string) {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation<
    any,
    Error,
    { studentIds: string[]; lectureDate?: string; status?: 'PRESENT' | 'ABSENT' | 'EXCUSED' }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: getLecturerHeaders(userSession?.role, userSession?.token),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData: any = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'roster', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'attendance', courseId] });
    },
  });
}

/**
 * Mutation to publish results (transition DRAFT -> PUBLISHED)
 */
export function usePublishResults(courseId: string) {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation<any, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/courses/${courseId}/publish`, {
        method: 'POST',
        headers: getLecturerHeaders(userSession?.role, userSession?.token),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData: any = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'roster', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'grades', courseId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'results'] });
    },
  });
}
