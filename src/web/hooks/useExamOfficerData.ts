import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';

const API_BASE = '';

function getAuthHeaders(role: string = 'EXAM_OFFICER', token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Demo-Role': role,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface BroadsheetStudentCourseResult {
  courseId: string;
  courseCode: string;
  creditUnits: number;
  caScore: number;
  examScore: number;
  totalScore: number;
  letterGrade: string;
  gradePoint: number;
  qualityPoints: number;
  isPass: boolean;
  status: 'PUBLISHED' | 'PENDING_APPROVAL';
}

export interface BroadsheetStudentRow {
  studentId: string;
  matricNumber: string;
  studentName: string;
  gender: string;
  level: number;
  courses: Record<string, BroadsheetStudentCourseResult>;
  totalCreditsRegistered: number;
  totalCreditsEarned: number;
  totalQualityPoints: number;
  gpa: number;
  cgpa: number;
  status: 'GOOD_STANDING' | 'PROBATION' | 'CARRY_OVER' | 'WITHDRAWAL';
  carryOverCourses: string[];
  remarks: string;
}

export interface BroadsheetCourseColumn {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  isCompulsory: boolean;
  hasUnpublishedDrafts: boolean;
}

export interface BroadsheetData {
  id: string;
  departmentId: string;
  departmentName: string;
  schoolName: string;
  level: number;
  sessionId: string;
  sessionName: string;
  courses: BroadsheetCourseColumn[];
  students: BroadsheetStudentRow[];
  summary: {
    totalStudents: number;
    passedCount: number;
    probationCount: number;
    carryOverCount: number;
    averageCgpa: number;
    unpublishedDraftsCount: number;
  };
  status: 'DRAFT' | 'CERTIFIED' | 'LOCKED';
  compiledBy?: string;
  compiledAt: number;
  certifiedBy?: string;
  certifiedAt?: number;
}

export interface ProbationStudentItem {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  departmentId: string;
  departmentName: string;
  level: number;
  cgpa: number;
  gpa: number;
  status: 'PROBATION' | 'CARRY_OVER';
  carryOverCourses: string[];
  warningSent: boolean;
  warningSentAt?: number;
  remarks?: string;
}

export interface GraduationCandidateItem {
  studentId: string;
  matricNumber: string;
  studentName: string;
  gender: string;
  division: 'NCE' | 'DEGREE';
  programmeName: string;
  departmentName: string;
  level: number;
  finalCgpa: number;
  honorsClassification: string;
  totalCreditsEarned: number;
  financialStatus: 'CLEARED' | 'DEBT';
  outstandingDebtKobo: number;
  libraryStatus: 'CLEARED' | 'PENDING' | 'DENIED';
  graduationStatus: 'QUALIFIED' | 'CLEARANCE_BLOCKED' | 'ACADEMIC_DEFICIT';
}

export interface ExamOfficerStats {
  totalBroadsheets: number;
  certifiedBroadsheets: number;
  totalOnProbation: number;
  totalGraduationEligible: number;
  pendingDraftsCount: number;
}

// 1. Fetch Exam Officer Overview Stats
export function useExamOfficerStats() {
  const { userSession } = useAppStore();

  return useQuery<ExamOfficerStats>({
    queryKey: ['exam-officer-stats'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/exam-officer/stats`, {
          headers: getAuthHeaders(userSession?.role || 'EXAM_OFFICER', userSession?.token),
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data?.stats) return data.stats;
        }
      } catch {
        // Fallback below
      }

      return {
        totalBroadsheets: 8,
        certifiedBroadsheets: 6,
        totalOnProbation: 14,
        totalGraduationEligible: 284,
        pendingDraftsCount: 2,
      };
    },
    staleTime: 30000,
  });
}

// 2. Fetch Master Broadsheet for Dept & Level
export function useBroadsheet(departmentId: string, level: number, session?: string) {
  const { userSession } = useAppStore();

  return useQuery<BroadsheetData>({
    queryKey: ['exam-broadsheet', departmentId, level, session],
    queryFn: async () => {
      const params = new URLSearchParams({
        departmentId,
        level: level.toString(),
      });
      if (session) params.append('session', session);

      try {
        const res = await fetch(`${API_BASE}/api/exam-officer/broadsheet?${params.toString()}`, {
          headers: getAuthHeaders(userSession?.role || 'EXAM_OFFICER', userSession?.token),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback
      }

      // Demo fallback broadsheet
      return {
        id: `bsh-${departmentId}-${level}-2026`,
        departmentId,
        departmentName: 'Computer Science Education',
        schoolName: 'School of Sciences',
        level,
        sessionId: 'sess-2026-2027',
        sessionName: '2026/2027 Academic Session',
        courses: [
          { courseId: 'crs-csc-111', courseCode: 'CSC 111', courseTitle: 'Intro to Computer Systems', creditUnits: 2, isCompulsory: true, hasUnpublishedDrafts: false },
          { courseId: 'crs-csc-112', courseCode: 'CSC 112', courseTitle: 'Problem Solving & BASIC', creditUnits: 3, isCompulsory: true, hasUnpublishedDrafts: true },
          { courseId: 'crs-mth-111', courseCode: 'MTH 111', courseTitle: 'Algebra & Trigonometry', creditUnits: 3, isCompulsory: true, hasUnpublishedDrafts: false },
          { courseId: 'crs-edu-111', courseCode: 'EDU 111', courseTitle: 'Philosophy of Education', creditUnits: 2, isCompulsory: true, hasUnpublishedDrafts: false },
          { courseId: 'crs-gse-111', courseCode: 'GSE 111', courseTitle: 'General English I', creditUnits: 2, isCompulsory: true, hasUnpublishedDrafts: false },
        ],
        students: [
          {
            studentId: 'std-001',
            matricNumber: 'COEKA/2026/NCE/084',
            studentName: 'Aondoaver Moses Iorliam',
            gender: 'MALE',
            level,
            courses: {
              'CSC 111': { courseId: 'crs-csc-111', courseCode: 'CSC 111', creditUnits: 2, caScore: 34, examScore: 52, totalScore: 86, letterGrade: 'A', gradePoint: 5.0, qualityPoints: 10.0, isPass: true, status: 'PUBLISHED' },
              'CSC 112': { courseId: 'crs-csc-112', courseCode: 'CSC 112', creditUnits: 3, caScore: 30, examScore: 48, totalScore: 78, letterGrade: 'A', gradePoint: 5.0, qualityPoints: 15.0, isPass: true, status: 'PUBLISHED' },
              'MTH 111': { courseId: 'crs-mth-111', courseCode: 'MTH 111', creditUnits: 3, caScore: 28, examScore: 42, totalScore: 70, letterGrade: 'A', gradePoint: 5.0, qualityPoints: 15.0, isPass: true, status: 'PUBLISHED' },
              'EDU 111': { courseId: 'crs-edu-111', courseCode: 'EDU 111', creditUnits: 2, caScore: 36, examScore: 44, totalScore: 80, letterGrade: 'A', gradePoint: 5.0, qualityPoints: 10.0, isPass: true, status: 'PUBLISHED' },
              'GSE 111': { courseId: 'crs-gse-111', courseCode: 'GSE 111', creditUnits: 2, caScore: 32, examScore: 46, totalScore: 78, letterGrade: 'A', gradePoint: 5.0, qualityPoints: 10.0, isPass: true, status: 'PUBLISHED' },
            },
            totalCreditsRegistered: 12,
            totalCreditsEarned: 12,
            totalQualityPoints: 60.0,
            gpa: 5.0,
            cgpa: 5.0,
            status: 'GOOD_STANDING',
            carryOverCourses: [],
            remarks: 'Passed All Registered Courses',
          },
          {
            studentId: 'std-002',
            matricNumber: 'COEKA/2026/NCE/085',
            studentName: 'Dooshima Grace Tyav',
            gender: 'FEMALE',
            level,
            courses: {
              'CSC 111': { courseId: 'crs-csc-111', courseCode: 'CSC 111', creditUnits: 2, caScore: 24, examScore: 38, totalScore: 62, letterGrade: 'B', gradePoint: 4.0, qualityPoints: 8.0, isPass: true, status: 'PUBLISHED' },
              'CSC 112': { courseId: 'crs-csc-112', courseCode: 'CSC 112', creditUnits: 3, caScore: 12, examScore: 22, totalScore: 34, letterGrade: 'F', gradePoint: 0.0, qualityPoints: 0.0, isPass: false, status: 'PUBLISHED' },
              'MTH 111': { courseId: 'crs-mth-111', courseCode: 'MTH 111', creditUnits: 3, caScore: 25, examScore: 35, totalScore: 60, letterGrade: 'B', gradePoint: 4.0, qualityPoints: 12.0, isPass: true, status: 'PUBLISHED' },
              'EDU 111': { courseId: 'crs-edu-111', courseCode: 'EDU 111', creditUnits: 2, caScore: 22, examScore: 36, totalScore: 58, letterGrade: 'C', gradePoint: 3.0, qualityPoints: 6.0, isPass: true, status: 'PUBLISHED' },
              'GSE 111': { courseId: 'crs-gse-111', courseCode: 'GSE 111', creditUnits: 2, caScore: 20, examScore: 30, totalScore: 50, letterGrade: 'C', gradePoint: 3.0, qualityPoints: 6.0, isPass: true, status: 'PUBLISHED' },
            },
            totalCreditsRegistered: 12,
            totalCreditsEarned: 9,
            totalQualityPoints: 32.0,
            gpa: 2.67,
            cgpa: 2.67,
            status: 'CARRY_OVER',
            carryOverCourses: ['CSC 112'],
            remarks: 'Carry-Over: CSC 112',
          },
          {
            studentId: 'std-003',
            matricNumber: 'COEKA/2026/NCE/086',
            studentName: 'Torkwase Comfort Chia',
            gender: 'FEMALE',
            level,
            courses: {
              'CSC 111': { courseId: 'crs-csc-111', courseCode: 'CSC 111', creditUnits: 2, caScore: 10, examScore: 22, totalScore: 32, letterGrade: 'F', gradePoint: 0.0, qualityPoints: 0.0, isPass: false, status: 'PUBLISHED' },
              'CSC 112': { courseId: 'crs-csc-112', courseCode: 'CSC 112', creditUnits: 3, caScore: 14, examScore: 20, totalScore: 34, letterGrade: 'F', gradePoint: 0.0, qualityPoints: 0.0, isPass: false, status: 'PUBLISHED' },
              'MTH 111': { courseId: 'crs-mth-111', courseCode: 'MTH 111', creditUnits: 3, caScore: 15, examScore: 20, totalScore: 35, letterGrade: 'E', gradePoint: 1.0, qualityPoints: 3.0, isPass: true, status: 'PUBLISHED' },
              'EDU 111': { courseId: 'crs-edu-111', courseCode: 'EDU 111', creditUnits: 2, caScore: 18, examScore: 24, totalScore: 42, letterGrade: 'D', gradePoint: 2.0, qualityPoints: 4.0, isPass: true, status: 'PUBLISHED' },
              'GSE 111': { courseId: 'crs-gse-111', courseCode: 'GSE 111', creditUnits: 2, caScore: 12, examScore: 22, totalScore: 34, letterGrade: 'F', gradePoint: 0.0, qualityPoints: 0.0, isPass: false, status: 'PUBLISHED' },
            },
            totalCreditsRegistered: 12,
            totalCreditsEarned: 5,
            totalQualityPoints: 7.0,
            gpa: 0.58,
            cgpa: 0.58,
            status: 'PROBATION',
            carryOverCourses: ['CSC 111', 'CSC 112', 'GSE 111'],
            remarks: 'Academic Probation (CGPA 0.58 < 1.50)',
          },
        ],
        summary: {
          totalStudents: 3,
          passedCount: 1,
          probationCount: 1,
          carryOverCount: 1,
          averageCgpa: 2.75,
          unpublishedDraftsCount: 1,
        },
        status: 'DRAFT',
        compiledBy: 'usr-admin-001',
        compiledAt: Math.floor(Date.now() / 1000) - 3600,
      };
    },
    staleTime: 15000,
  });
}

// 3. Certify Broadsheet Mutation
export function useCertifyBroadsheet() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (broadsheetId: string) => {
      const res = await fetch(`${API_BASE}/api/exam-officer/broadsheet/certify`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'EXAM_OFFICER', userSession?.token),
        body: JSON.stringify({ broadsheetId }),
      });
      if (!res.ok) {
        const error = (await res.json()) as any;
        throw new Error(error.error || 'Failed to certify broadsheet');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-broadsheet'] });
      queryClient.invalidateQueries({ queryKey: ['exam-officer-stats'] });
    },
  });
}

// 4. Fetch Academic Probation Students
export function useProbationStudents(departmentId?: string, session?: string) {
  const { userSession } = useAppStore();

  return useQuery<ProbationStudentItem[]>({
    queryKey: ['exam-probation', departmentId, session],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (session) params.append('session', session);

      try {
        const res = await fetch(`${API_BASE}/api/exam-officer/probation?${params.toString()}`, {
          headers: getAuthHeaders(userSession?.role || 'EXAM_OFFICER', userSession?.token),
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data?.students) return data.students;
        }
      } catch {
        // Fallback
      }

      return [
        {
          id: 'ast-001',
          studentId: 'std-003',
          matricNumber: 'COEKA/2026/NCE/086',
          studentName: 'Torkwase Comfort Chia',
          departmentId: 'dept-csc-001',
          departmentName: 'Computer Science Education',
          level: 100,
          cgpa: 0.58,
          gpa: 0.58,
          status: 'PROBATION',
          carryOverCourses: ['CSC 111', 'CSC 112', 'GSE 111'],
          warningSent: false,
          remarks: 'Academic Probation (CGPA 0.58 < 1.50)',
        },
        {
          id: 'ast-002',
          studentId: 'std-002',
          matricNumber: 'COEKA/2026/NCE/085',
          studentName: 'Dooshima Grace Tyav',
          departmentId: 'dept-csc-001',
          departmentName: 'Computer Science Education',
          level: 100,
          cgpa: 2.67,
          gpa: 2.67,
          status: 'CARRY_OVER',
          carryOverCourses: ['CSC 112'],
          warningSent: true,
          warningSentAt: Math.floor(Date.now() / 1000) - 86400,
          remarks: 'Carry-Over: CSC 112',
        },
      ];
    },
    staleTime: 30000,
  });
}

// 5. Send Academic Probation Warning Mutation
export function useSendProbationWarning() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`${API_BASE}/api/exam-officer/probation/${studentId}/warn`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'EXAM_OFFICER', userSession?.token),
      });
      if (!res.ok) {
        const error = (await res.json()) as any;
        throw new Error(error.error || 'Failed to dispatch academic warning');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-probation'] });
      queryClient.invalidateQueries({ queryKey: ['exam-officer-stats'] });
    },
  });
}

// 6. Fetch Senate Graduation List
export function useGraduationList(departmentId?: string, session?: string) {
  const { userSession } = useAppStore();

  return useQuery<{
    totalCandidates: number;
    qualifiedCount: number;
    clearanceBlockedCount: number;
    academicDeficitCount: number;
    candidates: GraduationCandidateItem[];
  }>({
    queryKey: ['exam-graduation', departmentId, session],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (session) params.append('session', session);

      try {
        const res = await fetch(`${API_BASE}/api/exam-officer/graduation?${params.toString()}`, {
          headers: getAuthHeaders(userSession?.role || 'EXAM_OFFICER', userSession?.token),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback
      }

      return {
        totalCandidates: 3,
        qualifiedCount: 1,
        clearanceBlockedCount: 1,
        academicDeficitCount: 1,
        candidates: [
          {
            studentId: 'std-fin-001',
            matricNumber: 'COEKA/2023/NCE/012',
            studentName: 'Terna Simon Aernyi',
            gender: 'MALE',
            division: 'NCE',
            programmeName: 'Computer Science / Mathematics',
            departmentName: 'Computer Science Education',
            level: 300,
            finalCgpa: 4.62,
            honorsClassification: 'Distinction',
            totalCreditsEarned: 114,
            financialStatus: 'CLEARED',
            outstandingDebtKobo: 0,
            libraryStatus: 'CLEARED',
            graduationStatus: 'QUALIFIED',
          },
          {
            studentId: 'std-fin-002',
            matricNumber: 'COEKA/2023/NCE/045',
            studentName: 'Hembadoon Cynthia Iorpuu',
            gender: 'FEMALE',
            division: 'NCE',
            programmeName: 'Computer Science / Physics',
            departmentName: 'Computer Science Education',
            level: 300,
            finalCgpa: 3.84,
            honorsClassification: 'Credit',
            totalCreditsEarned: 112,
            financialStatus: 'DEBT',
            outstandingDebtKobo: 1500000,
            libraryStatus: 'PENDING',
            graduationStatus: 'CLEARANCE_BLOCKED',
          },
          {
            studentId: 'std-fin-003',
            matricNumber: 'COEKA/2023/NCE/078',
            studentName: 'Kater Joseph Vihimga',
            gender: 'MALE',
            division: 'NCE',
            programmeName: 'Computer Science / Chemistry',
            departmentName: 'Computer Science Education',
            level: 300,
            finalCgpa: 1.42,
            honorsClassification: 'Fail',
            totalCreditsEarned: 88,
            financialStatus: 'CLEARED',
            outstandingDebtKobo: 0,
            libraryStatus: 'CLEARED',
            graduationStatus: 'ACADEMIC_DEFICIT',
          },
        ],
      };
    },
    staleTime: 30000,
  });
}
