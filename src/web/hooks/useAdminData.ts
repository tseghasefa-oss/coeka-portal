import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';

const API_BASE = '/api/admin';

export interface CourseItem {
  id: string;
  programmeId: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semesterTerm: number;
  isCompulsory: boolean;
  prerequisiteCourseId?: string | null;
  division?: string;
  programmeName?: string;
  assignedFaculty?: string;
}

export interface FeeCategoryItem {
  id: string;
  divisionId: string;
  name: string;
  code: string;
  isRecurring: boolean;
}

export interface FeeScheduleItem {
  id: string;
  categoryId: string;
  sessionId: string;
  level: number | string;
  amountKobo: number;
  dueDate: string;
  categoryName?: string;
  categoryCode?: string;
  divisionId?: string;
  divisionName?: string;
  formattedAmount?: string;
}

export interface SystemSettingsData {
  settings: {
    key: string;
    value: string;
    category: string;
    description?: string;
  }[];
  portalStatus: {
    admissions: boolean;
    courseRegistration: boolean;
    resultUpload: boolean;
    hostelBooking?: boolean;
  };
  academicCalendar?: {
    sessionId: string;
    startDate: string;
    endDate: string;
  };
}

export interface CreateCourseInput {
  programmeId: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semesterTerm: number;
  isCompulsory?: boolean;
  prerequisiteCourseId?: string;
  division?: string;
}

export interface SetFeeScheduleInput {
  categoryId: string;
  sessionId?: string;
  level: number | string;
  amountNaira?: number;
  amountKobo?: number;
  dueDate?: string;
}

export interface ApplyToAllLevelsInput {
  categoryId: string;
  sessionId?: string;
  levels: (number | string)[];
  amountNaira: number;
  dueDate?: string;
}

// Helper to get authenticated headers
function getAdminHeaders(role: string = 'SUPER_ADMIN', token: string = 'demo-jwt-admin') {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Demo-Role': role,
  };
}

/**
 * Hook for Academic Course Management
 */
export function useCourses(filters?: { programmeId?: string; level?: number; semesterTerm?: number }) {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  const coursesQuery = useQuery<CourseItem[]>({
    queryKey: ['admin', 'courses', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.programmeId) params.append('programmeId', filters.programmeId);
        if (filters?.level) params.append('level', filters.level.toString());
        if (filters?.semesterTerm) params.append('semesterTerm', filters.semesterTerm.toString());

        const res = await fetch(`${API_BASE}/courses?${params.toString()}`, {
          headers: getAdminHeaders(userSession?.role, userSession?.token),
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: any = await res.json();
        return (data.courses || []) as CourseItem[];
      } catch (err) {
        // Fallback baseline data if API server not mounted
        return [
          {
            id: 'crs-1',
            programmeId: 'prog-nce-csc-mth',
            code: 'CSC 111',
            title: 'Introduction to Computer Science & Information Technology',
            creditUnits: 3,
            level: 100,
            semesterTerm: 1,
            isCompulsory: true,
            division: 'NCE',
            programmeName: 'NCE Computer Science / Mathematics',
            assignedFaculty: 'Dr. Olufemi Adeyemi (Senior Lecturer)',
          },
          {
            id: 'crs-2',
            programmeId: 'prog-nce-csc-mth',
            code: 'MTH 111',
            title: 'General Mathematics I (Algebra & Trigonometry)',
            creditUnits: 3,
            level: 100,
            semesterTerm: 1,
            isCompulsory: true,
            division: 'NCE',
            programmeName: 'NCE Computer Science / Mathematics',
            assignedFaculty: 'Prof. Terver Akume (Reader)',
          },
          {
            id: 'crs-3',
            programmeId: 'prog-nce-csc-mth',
            code: 'EDU 111',
            title: 'Foundations of Education & Teacher Professionalism',
            creditUnits: 2,
            level: 100,
            semesterTerm: 1,
            isCompulsory: true,
            division: 'NCE',
            programmeName: 'General Education Foundation',
            assignedFaculty: 'Dr. (Mrs) Bridget Tyav (Chief Lecturer)',
          },
          {
            id: 'crs-4',
            programmeId: 'prog-deg-bed',
            code: 'BED 211',
            title: 'Principles of Business Education & Microeconomics',
            creditUnits: 3,
            level: 200,
            semesterTerm: 1,
            isCompulsory: true,
            division: 'DEGREE',
            programmeName: 'B.Ed Business Education',
            assignedFaculty: 'Dr. Simon Iorliam (Senior Lecturer)',
          },
          {
            id: 'crs-5',
            programmeId: 'prog-sec-sss',
            code: 'BIO 101',
            title: 'Senior Secondary Biology (Living Organisms & Cell Biology)',
            creditUnits: 2,
            level: 100,
            semesterTerm: 1,
            isCompulsory: true,
            division: 'SECONDARY',
            programmeName: 'Senior Secondary Science',
            assignedFaculty: 'Mr. Moses Terfa (Master Teacher II)',
          },
        ];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const res = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateCourseInput> }) => {
      const res = await fetch(`${API_BASE}/courses/${id}`, {
        method: 'PATCH',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/courses/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });

  const assignFacultyMutation = useMutation({
    mutationFn: async (input: { staffId: string; courseId: string; semesterId: string; role?: string }) => {
      const res = await fetch(`${API_BASE}/courses/assign`, {
        method: 'POST',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });

  return {
    courses: coursesQuery.data || [],
    isLoading: coursesQuery.isLoading,
    isError: coursesQuery.isError,
    error: coursesQuery.error,
    refetch: coursesQuery.refetch,
    createCourse: createCourseMutation.mutateAsync,
    isCreating: createCourseMutation.isPending,
    updateCourse: updateCourseMutation.mutateAsync,
    isUpdating: updateCourseMutation.isPending,
    deleteCourse: deleteCourseMutation.mutateAsync,
    isDeleting: deleteCourseMutation.isPending,
    assignFaculty: assignFacultyMutation.mutateAsync,
    isAssigning: assignFacultyMutation.isPending,
  };
}

/**
 * Hook for Financial Fee Schedules & Price Matrix
 */
export function useFeeSchedules(filters?: { sessionId?: string; divisionId?: string; level?: number | string }) {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  const feesQuery = useQuery<{ feeSchedules: FeeScheduleItem[]; feeCategories: FeeCategoryItem[] }>({
    queryKey: ['admin', 'fees', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.sessionId) params.append('sessionId', filters.sessionId);
        if (filters?.divisionId) params.append('divisionId', filters.divisionId);
        if (filters?.level !== undefined) params.append('level', filters.level.toString());

        const res = await fetch(`${API_BASE}/fees?${params.toString()}`, {
          headers: getAdminHeaders(userSession?.role, userSession?.token),
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: any = await res.json();
        return {
          feeSchedules: (data.feeSchedules || []) as FeeScheduleItem[],
          feeCategories: (data.feeCategories || []) as FeeCategoryItem[],
        };
      } catch (err) {
        // Fallback baseline data
        return {
          feeCategories: [
            { id: 'fee-nce-tuition', divisionId: 'div-nce', name: 'NCE School Fees (Tuition & Services)', code: 'NCE-TUI', isRecurring: true },
            { id: 'fee-nce-accept', divisionId: 'div-nce', name: 'Provisional Acceptance Fee', code: 'NCE-ACC', isRecurring: false },
            { id: 'fee-hostel-std', divisionId: 'div-nce', name: 'Hostel Accommodation (Standard Hall)', code: 'HST-STD', isRecurring: true },
            { id: 'fee-teaching-prac', divisionId: 'div-nce', name: 'Teaching Practice & Supervision Levy', code: 'TP-LEVY', isRecurring: true },
            { id: 'fee-deg-tuition', divisionId: 'div-degree', name: 'Degree Programme School Fees', code: 'DEG-TUI', isRecurring: true },
            { id: 'fee-sec-termly', divisionId: 'div-secondary', name: 'Demonstration Secondary Termly Fees', code: 'SEC-TRM', isRecurring: true },
            { id: 'fee-pri-termly', divisionId: 'div-primary', name: 'Staff Primary School Termly Fees', code: 'PRI-TRM', isRecurring: true },
            { id: 'fee-ict-levy', divisionId: 'div-nce', name: 'ICT & Computational Laboratory Levy', code: 'FEE-NCE-ICT', isRecurring: true },
          ],
          feeSchedules: [
            {
              id: 'sched-nce-100-tui',
              categoryId: 'fee-nce-tuition',
              sessionId: 'sess-2026-2027',
              level: 100,
              amountKobo: 4500000,
              dueDate: '2026-12-15',
              categoryName: 'NCE School Fees (Tuition & Services)',
              categoryCode: 'NCE-TUI',
              divisionId: 'div-nce',
              divisionName: 'NCE',
              formattedAmount: '₦45,000.00',
            },
            {
              id: 'sched-nce-200-tui',
              categoryId: 'fee-nce-tuition',
              sessionId: 'sess-2026-2027',
              level: 200,
              amountKobo: 4200000,
              dueDate: '2026-12-15',
              categoryName: 'NCE School Fees (Tuition & Services)',
              categoryCode: 'NCE-TUI',
              divisionId: 'div-nce',
              divisionName: 'NCE',
              formattedAmount: '₦42,000.00',
            },
            {
              id: 'sched-nce-300-tui',
              categoryId: 'fee-nce-tuition',
              sessionId: 'sess-2026-2027',
              level: 300,
              amountKobo: 4000000,
              dueDate: '2026-12-15',
              categoryName: 'NCE School Fees (Tuition & Services)',
              categoryCode: 'NCE-TUI',
              divisionId: 'div-nce',
              divisionName: 'NCE',
              formattedAmount: '₦40,000.00',
            },
            {
              id: 'sched-nce-accept',
              categoryId: 'fee-nce-accept',
              sessionId: 'sess-2026-2027',
              level: 100,
              amountKobo: 1500000,
              dueDate: '2026-11-30',
              categoryName: 'Provisional Acceptance Fee',
              categoryCode: 'NCE-ACC',
              divisionId: 'div-nce',
              divisionName: 'NCE',
              formattedAmount: '₦15,000.00',
            },
            {
              id: 'sched-hostel-std',
              categoryId: 'fee-hostel-std',
              sessionId: 'sess-2026-2027',
              level: 100,
              amountKobo: 2000000,
              dueDate: '2026-12-15',
              categoryName: 'Hostel Accommodation (Standard Hall)',
              categoryCode: 'HST-STD',
              divisionId: 'div-nce',
              divisionName: 'NCE',
              formattedAmount: '₦20,000.00',
            },
            {
              id: 'sched-deg-100-tui',
              categoryId: 'fee-deg-tuition',
              sessionId: 'sess-2026-2027',
              level: 100,
              amountKobo: 7500000,
              dueDate: '2026-12-15',
              categoryName: 'Degree Programme School Fees',
              categoryCode: 'DEG-TUI',
              divisionId: 'div-degree',
              divisionName: 'DEGREE',
              formattedAmount: '₦75,000.00',
            },
            {
              id: 'sched-ict-levy-100',
              categoryId: 'fee-ict-levy',
              sessionId: 'sess-2026-2027',
              level: 100,
              amountKobo: 1250000,
              dueDate: '2026-12-15',
              categoryName: 'ICT & Computational Laboratory Levy',
              categoryCode: 'FEE-NCE-ICT',
              divisionId: 'div-nce',
              divisionName: 'NCE',
              formattedAmount: '₦12,500.00',
            },
          ],
        };
      }
    },
    staleTime: 1000 * 60 * 2,
  });

  const setFeePriceMutation = useMutation({
    mutationFn: async (input: SetFeeScheduleInput) => {
      const payload: any = {
        categoryId: input.categoryId,
        sessionId: input.sessionId || 'sess-2026-2027',
        level: Number(input.level) || 100,
        dueDate: input.dueDate || '2026-12-15',
      };

      if (input.amountNaira !== undefined) {
        payload.amountNaira = Number(input.amountNaira);
      } else if (input.amountKobo !== undefined) {
        payload.amountKobo = Number(input.amountKobo);
      }

      const res = await fetch(`${API_BASE}/fees`, {
        method: 'POST',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate fee schedules AND student invoices cache so students see updated prices immediately
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const updateFeeScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SetFeeScheduleInput> }) => {
      const res = await fetch(`${API_BASE}/fees/${id}`, {
        method: 'PATCH',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const deleteFeeScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/fees/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const applyToAllLevelsMutation = useMutation({
    mutationFn: async (input: ApplyToAllLevelsInput) => {
      const promises = input.levels.map((lvl) => {
        return fetch(`${API_BASE}/fees`, {
          method: 'POST',
          headers: getAdminHeaders(userSession?.role, userSession?.token),
          body: JSON.stringify({
            categoryId: input.categoryId,
            sessionId: input.sessionId || 'sess-2026-2027',
            level: Number(lvl) || 100,
            amountNaira: Number(input.amountNaira),
            dueDate: input.dueDate || '2026-12-15',
          }),
        }).catch(() => null);
      });

      await Promise.all(promises);
      return { success: true, count: input.levels.length };
    },
    onSuccess: () => {
      // Invalidate fee schedules and invoices
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    feeSchedules: feesQuery.data?.feeSchedules || [],
    feeCategories: feesQuery.data?.feeCategories || [],
    isLoading: feesQuery.isLoading,
    isError: feesQuery.isError,
    error: feesQuery.error,
    refetch: feesQuery.refetch,
    setFeePrice: setFeePriceMutation.mutateAsync,
    isSettingPrice: setFeePriceMutation.isPending,
    updateFeeSchedule: updateFeeScheduleMutation.mutateAsync,
    isUpdating: updateFeeScheduleMutation.isPending,
    deleteFeeSchedule: deleteFeeScheduleMutation.mutateAsync,
    isDeleting: deleteFeeScheduleMutation.isPending,
    applyToAllLevels: applyToAllLevelsMutation.mutateAsync,
    isApplyingToAll: applyToAllLevelsMutation.isPending,
  };
}

/**
 * Hook for System Settings & Operational Controls
 */
export function useSystemSettings() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  const settingsQuery = useQuery<SystemSettingsData>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`, {
          headers: getAdminHeaders(userSession?.role, userSession?.token),
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return (await res.json()) as SystemSettingsData;
      } catch (err) {
        // Fallback baseline
        return {
          settings: [
            { key: 'institution_name', value: 'College of Education, Katsina-Ala', category: 'GENERAL', description: 'Official institution name' },
            { key: 'institution_motto', value: 'Knowledge, Character and Excellence', category: 'GENERAL', description: 'Official motto' },
            { key: 'support_email', value: 'portal.support@coeka.edu.ng', category: 'CONTACT', description: 'Support helpdesk email' },
            { key: 'max_credit_units', value: '24', category: 'ACADEMIC', description: 'Max allowed credit units per semester' },
            { key: 'portal_announcement', value: 'Welcome to 2026/2027 Academic Session', category: 'ANNOUNCEMENT', description: 'Public banner' },
          ],
          portalStatus: {
            admissions: true,
            courseRegistration: true,
            resultUpload: true,
            hostelBooking: true,
          },
          academicCalendar: {
            sessionId: 'sess-2026-2027',
            startDate: '2026-10-01',
            endDate: '2027-08-31',
          },
        };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: {
      portalModule?: string;
      isOpen?: boolean;
      calendarSessionId?: string;
      startDate?: string;
      endDate?: string;
      key?: string;
      value?: string;
      category?: string;
      description?: string;
    }) => {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: getAdminHeaders(userSession?.role, userSession?.token),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });

  return {
    settingsData: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  };
}
