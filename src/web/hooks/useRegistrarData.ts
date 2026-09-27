import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';

const API_BASE = '';

function getAuthHeaders(role: string = 'REGISTRAR', token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Demo-Role': role,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface CertificateRecord {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  certificateNumber: string;
  qualificationAwarded: string;
  programmeName: string;
  division: 'NCE' | 'DEGREE';
  honorsClassification: string;
  finalCgpa: number;
  confermentDate: string;
  issuedBy?: string;
  issuedAt: number;
  qrVerificationHash: string;
  digitalSignature: string;
  status: 'VALID' | 'REVOKED' | 'REISSUED';
  revocationReason?: string;
  verificationUrl: string;
  createdAt: number;
}

export interface VerificationResult {
  isValid: boolean;
  status: 'VALID' | 'REVOKED' | 'NOT_FOUND';
  certificateNumber?: string;
  studentName?: string;
  matricNumber?: string;
  programmeName?: string;
  departmentName?: string;
  qualificationAwarded?: string;
  division?: string;
  honorsClassification?: string;
  finalCgpa?: number;
  confermentDate?: string;
  issuedAt?: number;
  qrVerificationHash?: string;
  digitalSignature?: string;
  revocationReason?: string | null;
  institution: string;
  message: string;
}

export interface TranscriptRequestRecord {
  id: string;
  studentId: string;
  matricNumber?: string;
  studentName?: string;
  recipientName: string;
  recipientAddress: string;
  recipientEmail?: string;
  deliveryMethod: 'ELECTRONIC' | 'COURIER' | 'IN_PERSON';
  feeAmountKobo: number;
  paymentReference?: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SENT' | 'REJECTED';
  processedBy?: string;
  trackingNumber?: string;
  dispatchNotes?: string;
  requestedAt: number;
  processedAt?: number;
  dispatchedAt?: number;
  updatedAt: number;
}

export interface StudentArchiveRecord {
  id: string;
  studentId: string;
  matricNumber?: string;
  studentName?: string;
  graduationYear: number;
  qualificationAwarded: string;
  honorsClassification: string;
  finalCgpa: number;
  certificateNumber?: string;
  archiveStatus: 'ALUMNI' | 'WITHDRAWN' | 'DECEASED';
  archivedBy?: string;
  archivedAt: number;
  dossierSummary: any;
}

export interface CandidateWithClearance {
  studentId: string;
  matricNumber: string;
  studentName: string;
  division: 'NCE' | 'DEGREE';
  programmeName: string;
  departmentName: string;
  level: number;
  totalCreditsRegistered: number;
  totalCreditsEarned: number;
  totalQualityPoints: number;
  finalCgpa: number;
  academicStanding: string;
  honorsClassification: string;
  isEligibleForGraduation: boolean;
  outstandingFailedCourses: Array<{
    courseCode: string;
    courseTitle: string;
    creditUnits: number;
    level: number;
  }>;
  financialClearance: {
    isCleared: boolean;
    outstandingDebtKobo: number;
  };
  libraryClearance: {
    isCleared: boolean;
    status: 'CLEARED' | 'PENDING' | 'DENIED' | 'NOT_APPLIED';
  };
  overallGraduationStatus: 'QUALIFIED' | 'CLEARANCE_BLOCKED' | 'ACADEMIC_DEFICIT';
  hasCertificate: boolean;
  certificateNumber?: string;
  certificateId?: string;
  isArchived: boolean;
}

export interface RegistrarStats {
  totalCertificatesIssued: number;
  validCertificatesCount: number;
  pendingTranscriptsCount: number;
  completedTranscriptsCount: number;
  totalAlumniArchived: number;
  eligibleGraduatingCandidatesCount: number;
  recentCertificates: CertificateRecord[];
  recentTranscripts: TranscriptRequestRecord[];
}

/**
 * Hook: Registrar Stats Overview
 */
export function useRegistrarStats() {
  const { userSession } = useAppStore();

  return useQuery<RegistrarStats>({
    queryKey: ['registrar', 'stats'],
    queryFn: async () => {
      const role = userSession?.role || 'REGISTRAR';
      const res = await fetch(`${API_BASE}/api/registrar/stats`, {
        headers: getAuthHeaders(role, userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch registrar statistics');
      }
      const data: any = await res.json();
      return data.stats;
    },
    staleTime: 30000,
  });
}

/**
 * Hook: Graduating Candidates with Clearance Breakdown
 */
export function useGraduationCandidates(division?: string) {
  const { userSession } = useAppStore();

  return useQuery<CandidateWithClearance[]>({
    queryKey: ['registrar', 'candidates', division],
    queryFn: async () => {
      const role = userSession?.role || 'REGISTRAR';
      const url = division
        ? `${API_BASE}/api/registrar/candidates?division=${encodeURIComponent(division)}`
        : `${API_BASE}/api/registrar/candidates`;
      const res = await fetch(url, {
        headers: getAuthHeaders(role, userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch graduation candidates');
      }
      const data: any = await res.json();
      return data.candidates;
    },
    staleTime: 15000,
  });
}

/**
 * Hook: Issued Certificates List
 */
export function useIssuedCertificates(filters?: {
  division?: string;
  status?: string;
  search?: string;
}) {
  const { userSession } = useAppStore();

  return useQuery<CertificateRecord[]>({
    queryKey: ['registrar', 'certificates', filters],
    queryFn: async () => {
      const role = userSession?.role || 'REGISTRAR';
      const params = new URLSearchParams();
      if (filters?.division && filters.division !== 'ALL') params.set('division', filters.division);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);

      const res = await fetch(`${API_BASE}/api/registrar/certificates?${params.toString()}`, {
        headers: getAuthHeaders(role, userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch certificates');
      }
      const data: any = await res.json();
      return data.certificates;
    },
    staleTime: 15000,
  });
}

/**
 * Hook: Transcript Requests Pipeline
 */
export function useTranscriptRequests(status?: string) {
  const { userSession } = useAppStore();

  return useQuery<TranscriptRequestRecord[]>({
    queryKey: ['registrar', 'transcripts', status],
    queryFn: async () => {
      const role = userSession?.role || 'REGISTRAR';
      const url = status && status !== 'ALL'
        ? `${API_BASE}/api/registrar/transcripts?status=${encodeURIComponent(status)}`
        : `${API_BASE}/api/registrar/transcripts`;

      const res = await fetch(url, {
        headers: getAuthHeaders(role, userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch transcript requests');
      }
      const data: any = await res.json();
      return data.requests;
    },
    staleTime: 10000,
  });
}

/**
 * Hook: Alumni Archive Search
 */
export function useStudentArchive(filters?: {
  query?: string;
  year?: number;
  division?: string;
}) {
  const { userSession } = useAppStore();

  return useQuery<StudentArchiveRecord[]>({
    queryKey: ['registrar', 'archive', filters],
    queryFn: async () => {
      const role = userSession?.role || 'REGISTRAR';
      const params = new URLSearchParams();
      if (filters?.query) params.set('query', filters.query);
      if (filters?.year) params.set('year', filters.year.toString());
      if (filters?.division && filters.division !== 'ALL') params.set('division', filters.division);

      const res = await fetch(`${API_BASE}/api/registrar/archive?${params.toString()}`, {
        headers: getAuthHeaders(role, userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch student archive');
      }
      const data: any = await res.json();
      return data.records;
    },
    staleTime: 15000,
  });
}

/**
 * Mutation: Issue Certificate
 */
export function useIssueCertificateMutation() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      confermentDate?: string;
      qualification?: string;
    }) => {
      const role = userSession?.role || 'REGISTRAR';
      const res = await fetch(`${API_BASE}/api/registrar/certificates/issue`, {
        method: 'POST',
        headers: getAuthHeaders(role, userSession?.token),
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue certificate');
      }
      return data.certificate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrar'] });
    },
  });
}

/**
 * Mutation: Update Transcript Status
 */
export function useUpdateTranscriptStatusMutation() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      trackingNumber,
      dispatchNotes,
    }: {
      id: string;
      status: 'PROCESSING' | 'SENT' | 'REJECTED' | 'PAID';
      trackingNumber?: string;
      dispatchNotes?: string;
    }) => {
      const role = userSession?.role || 'REGISTRAR';
      const res = await fetch(`${API_BASE}/api/registrar/transcripts/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(role, userSession?.token),
        body: JSON.stringify({ status, trackingNumber, dispatchNotes }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update transcript status');
      }
      return data.request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrar', 'transcripts'] });
      queryClient.invalidateQueries({ queryKey: ['registrar', 'stats'] });
    },
  });
}

/**
 * Mutation: Finalize Student Archive
 */
export function useArchiveStudentMutation() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const role = userSession?.role || 'REGISTRAR';
      const res = await fetch(`${API_BASE}/api/registrar/students/${studentId}/archive`, {
        method: 'POST',
        headers: getAuthHeaders(role, userSession?.token),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to archive student record');
      }
      return data.archive;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrar'] });
    },
  });
}
