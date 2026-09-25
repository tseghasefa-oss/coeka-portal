import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';
import { API_HOST } from '../config/api';

const API_BASE = API_HOST;

function getAuthHeaders(role: string = 'SUPER_ADMIN', token: string = 'demo-jwt-admin') {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Demo-Role': role,
  };
}

export interface AdmittedStudentSummary {
  id: string;
  matricNumber: string;
  fullName: string;
  division: string;
  level: number;
  academicStatus: string;
  hasPassport: boolean;
  hasBiodata: boolean;
}

export interface AdmissionsStatsData {
  totalAdmitted: number;
  provisionalCount: number;
  biodataCompletedCount: number;
  activeCount: number;
  acceptancePaidCount: number;
  acceptanceTotalKobo: number;
  completionPercentage: number;
  students: AdmittedStudentSummary[];
}

export interface OnboardingStatusData {
  studentId: string;
  matricNumber: string;
  fullName: string;
  academicStatus: string;
  checklist: {
    accountCreated: boolean;
    biodataSubmitted: boolean;
    passportUploaded: boolean;
    acceptanceFeeSettled: boolean;
    courseRegistrationUnlocked: boolean;
  };
  isFullyOnboarded: boolean;
}

export interface PromotionResultData {
  totalEvaluated: number;
  promotedCount: number;
  probationCount: number;
  graduatedCount: number;
  carryOverCount: number;
  promotions: Array<{
    studentId: string;
    matricNumber: string;
    fullName: string;
    previousLevel: number;
    newLevel: number;
    cgpa: number;
    status: 'PROMOTED' | 'PROBATION' | 'GRADUATED' | 'WITHDRAWN';
    academicStatus: string;
    hasCarryOvers: boolean;
    message: string;
  }>;
}

export interface BillingResetResultData {
  session: string;
  totalBilledStudents: number;
  totalInvoicesCreated: number;
  totalBilledKobo: number;
  formattedTotalBilled: string;
  invoicesSummary: Array<{
    studentId: string;
    matricNumber: string;
    level: number;
    invoiceNumber: string;
    amountKobo: number;
    formattedAmount: string;
  }>;
}

/**
 * Hook to retrieve admissions & onboarding statistics for admin overview
 */
export function useAdmissionsStats() {
  const { userSession } = useAppStore();

  return useQuery<AdmissionsStatsData>({
    queryKey: ['admin', 'admissions', 'stats'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/admissions/stats`, {
          headers: getAuthHeaders(userSession?.role || 'SUPER_ADMIN', userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        // Fallback demo data if offline
        return {
          totalAdmitted: 120,
          provisionalCount: 25,
          biodataCompletedCount: 35,
          activeCount: 60,
          acceptancePaidCount: 60,
          acceptanceTotalKobo: 90000000,
          completionPercentage: 50,
          students: [
            {
              id: 'std-demo-1',
              matricNumber: 'COEKA/2026/NCE/084',
              fullName: 'Aondoaver Moses Iorliam',
              division: 'NCE',
              level: 100,
              academicStatus: 'ACTIVE',
              hasPassport: true,
              hasBiodata: true,
            },
            {
              id: 'std-demo-2',
              matricNumber: 'COEKA/2026/DEG/012',
              fullName: 'Ngodoo Blessing Terfa',
              division: 'DEGREE',
              level: 100,
              academicStatus: 'PROVISIONAL_ADMISSION',
              hasPassport: false,
              hasBiodata: false,
            },
            {
              id: 'std-demo-3',
              matricNumber: 'COEKA/2026/NCE/105',
              fullName: 'Doofan Mercy Tyav',
              division: 'NCE',
              level: 100,
              academicStatus: 'BIODATA_COMPLETED',
              hasPassport: true,
              hasBiodata: true,
            },
          ],
        };
      }
    },
    staleTime: 5000,
  });
}

/**
 * Mutation for bulk CSV admissions upload
 */
export function useBulkUploadAdmissions() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: { csvContent?: string; applicants?: any[]; admissionYear?: number }) => {
      const res = await fetch(`${API_BASE}/api/admissions/bulk-upload`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'SUPER_ADMIN', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Failed to process bulk upload');
      }
      return (await res.json()) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admissions', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * Hook to retrieve onboarding status for a specific student
 */
export function useOnboardingStatus(studentId?: string) {
  const { userSession } = useAppStore();
  const effectiveId = studentId || userSession?.userId || 'std-001';

  return useQuery<OnboardingStatusData>({
    queryKey: ['admissions', 'onboard', 'status', effectiveId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admissions/onboard/status/${effectiveId}`, {
          headers: getAuthHeaders(userSession?.role || 'STUDENT', userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        return {
          studentId: effectiveId,
          matricNumber: 'COEKA/2026/NCE/084',
          fullName: userSession?.fullName || 'Student Applicant',
          academicStatus: 'PROVISIONAL_ADMISSION',
          checklist: {
            accountCreated: true,
            biodataSubmitted: false,
            passportUploaded: false,
            acceptanceFeeSettled: false,
            courseRegistrationUnlocked: false,
          },
          isFullyOnboarded: false,
        };
      }
    },
    staleTime: 5000,
  });
}

/**
 * Mutation for student bio-data submission
 */
export function useSubmitBiodata() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      dateOfBirth: string;
      gender: string;
      stateOfOrigin: string;
      lgaOfOrigin: string;
      bloodGroup?: string;
      contactAddress: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/admissions/onboard/biodata`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'STUDENT', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Biodata submission failed' }));
        throw new Error(error.error || 'Failed to submit biodata');
      }
      return (await res.json()) as any;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', 'onboard', 'status', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
    },
  });
}

/**
 * Mutation for student passport photo upload (to R2)
 */
export function useUploadPassport() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: { studentId: string; imageBase64: string; filename?: string }) => {
      const res = await fetch(`${API_BASE}/api/admissions/onboard/passport`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'STUDENT', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Passport upload failed' }));
        throw new Error(error.error || 'Failed to upload passport');
      }
      return (await res.json()) as any;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', 'onboard', 'status', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
    },
  });
}

/**
 * Mutation for acceptance fee payment settlement
 */
export function usePayAcceptance() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: { studentId: string; gateway?: string }) => {
      const res = await fetch(`${API_BASE}/api/admissions/onboard/pay-acceptance`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'STUDENT', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Acceptance fee payment failed' }));
        throw new Error(error.error || 'Failed to pay acceptance fee');
      }
      return (await res.json()) as any;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', 'onboard', 'status', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'courses', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
    },
  });
}

/**
 * Mutation for Year-End Batch Student Promotion
 */
export function useBatchPromote() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: { divisionCode?: string; fromLevel?: number }) => {
      const res = await fetch(`${API_BASE}/api/admin/session/promote`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'SUPER_ADMIN', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Promotion failed' }));
        throw new Error(error.error || 'Failed to execute student promotion');
      }
      return (await res.json()) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'admissions', 'stats'] });
    },
  });
}

/**
 * Mutation for Financial Reset: Apply New Session Fee Matrix
 */
export function useResetSessionBilling() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: { newSession: string; divisionCode?: string; targetLevel?: number }) => {
      const res = await fetch(`${API_BASE}/api/admin/session/billing-reset`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'SUPER_ADMIN', userSession?.token),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const error: any = await res.json().catch(() => ({ error: 'Billing reset failed' }));
        throw new Error(error.error || 'Failed to apply session fee matrix');
      }
      return (await res.json()) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['bursar', 'revenue'] });
    },
  });
}
