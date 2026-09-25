import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';

const API_BASE = '';

function getAuthHeaders(role: string = 'LIBRARIAN', token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Demo-Role': role,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface LibraryBookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publicationYear?: number;
  category: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  coverImageUrl?: string;
  createdAt: number;
}

export interface BookLoanItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  shelfLocation: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  divisionName?: string;
  programmeName?: string;
  staffId?: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';
  fineAmountKobo: number;
  formattedFine?: string;
  daysOverdue: number;
  notes?: string;
  createdAt: number;
}

export interface LibraryFineItem {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  loanId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amountKobo: number;
  formattedAmount: string;
  reason: string;
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  issuedByStaffId?: string;
  issuedAt: number;
  paidAt?: number;
}

export interface StudentClearanceDossier {
  studentId: string;
  matricNumber: string;
  studentName: string;
  divisionName: string;
  programmeName: string;
  academicStatus: string;
  activeLoansCount: number;
  activeLoans: BookLoanItem[];
  unpaidFinesCount: number;
  unpaidFinesKobo: number;
  formattedUnpaidFines: string;
  unpaidFines: LibraryFineItem[];
  canClear: boolean;
  clearanceStatus: 'PENDING' | 'CLEARED' | 'DENIED';
  reasonsIneligible: string[];
  clearedAt?: number | null;
  clearedBy?: string | null;
  digitalCertificateHash?: string | null;
  remarks?: string | null;
}

export interface LibraryStats {
  totalTitles: number;
  totalVolumes: number;
  availableVolumes: number;
  activeLoans: number;
  overdueLoans: number;
  totalFinesCount: number;
  totalFinesAssessedKobo: number;
  formattedFinesAssessed: string;
  totalStudentsCleared: number;
}

// 1. Library Telemetry Hook
export function useLibraryStats() {
  const userSession = useAppStore((state) => state.userSession);

  return useQuery<LibraryStats>({
    queryKey: ['librarian', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/librarian/stats`, {
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch library statistics');
      }
      const data = (await res.json()) as any;
      return data.stats;
    },
    staleTime: 30000,
  });
}

// 2. Library Books Catalog Hook
export function useLibraryBooks(filters?: {
  search?: string;
  category?: string;
  availableOnly?: boolean;
}) {
  const userSession = useAppStore((state) => state.userSession);

  return useQuery<LibraryBookItem[]>({
    queryKey: ['librarian', 'books', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
      if (filters?.availableOnly) params.append('availableOnly', 'true');

      const res = await fetch(`${API_BASE}/api/librarian/books?${params.toString()}`, {
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch library catalog books');
      }
      const data = (await res.json()) as any;
      return data.books || [];
    },
    staleTime: 60000,
  });
}

// 3. Add Book Mutation
export function useAddBook() {
  const queryClient = useQueryClient();
  const userSession = useAppStore((state) => state.userSession);

  return useMutation({
    mutationFn: async (bookData: {
      isbn: string;
      title: string;
      author: string;
      publisher?: string;
      publicationYear?: number;
      category?: string;
      shelfLocation: string;
      totalCopies?: number;
      coverImageUrl?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/librarian/books`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
        body: JSON.stringify(bookData),
      });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as any;
        throw new Error(errorData.error || 'Failed to catalog book');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['librarian', 'books'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'stats'] });
    },
  });
}

// 4. Book Loans Hook
export function useBookLoans(filters?: {
  status?: string;
  studentId?: string;
  bookId?: string;
  search?: string;
}) {
  const userSession = useAppStore((state) => state.userSession);

  return useQuery<BookLoanItem[]>({
    queryKey: ['librarian', 'loans', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.bookId) params.append('bookId', filters.bookId);
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE}/api/librarian/loans?${params.toString()}`, {
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch book loans');
      }
      const data = (await res.json()) as any;
      return data.loans || [];
    },
    staleTime: 15000,
  });
}

// 5. Issue Book Mutation
export function useIssueBook() {
  const queryClient = useQueryClient();
  const userSession = useAppStore((state) => state.userSession);

  return useMutation({
    mutationFn: async (payload: {
      bookId: string;
      studentId: string;
      dueDate?: string;
      notes?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/librarian/loans/issue`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        throw new Error(err.error || 'Failed to issue book');
      }
      return ((await res.json()) as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['librarian', 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'books'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'clearance'] });
    },
  });
}

// 6. Return Book Mutation
export function useReturnBook() {
  const queryClient = useQueryClient();
  const userSession = useAppStore((state) => state.userSession);

  return useMutation({
    mutationFn: async ({
      loanId,
      data,
    }: {
      loanId: string;
      data?: {
        returnDate?: string;
        isDamaged?: boolean;
        damageFineKobo?: number;
        damageReason?: string;
      };
    }) => {
      const res = await fetch(`${API_BASE}/api/librarian/loans/${loanId}/return`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        throw new Error(err.error || 'Failed to return book');
      }
      return ((await res.json()) as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['librarian', 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'books'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'fines'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'clearance'] });
      queryClient.invalidateQueries({ queryKey: ['bursar'] });
    },
  });
}

// 7. Send Loan Reminder Mutation
export function useSendLoanReminder() {
  const userSession = useAppStore((state) => state.userSession);

  return useMutation({
    mutationFn: async (loanId: string) => {
      const res = await fetch(`${API_BASE}/api/librarian/loans/${loanId}/remind`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        throw new Error(err.error || 'Failed to send loan reminder');
      }
      return ((await res.json()) as any);
    },
  });
}

// 8. Library Fines Hook
export function useLibraryFines(filters?: {
  studentId?: string;
  status?: string;
  search?: string;
}) {
  const userSession = useAppStore((state) => state.userSession);

  return useQuery<LibraryFineItem[]>({
    queryKey: ['librarian', 'fines', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE}/api/librarian/fines?${params.toString()}`, {
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch library fines');
      }
      const data = (await res.json()) as any;
      return data.fines || [];
    },
    staleTime: 30000,
  });
}

// 9. Apply Fine Mutation
export function useApplyFine() {
  const queryClient = useQueryClient();
  const userSession = useAppStore((state) => state.userSession);

  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      amountKobo: number;
      reason: string;
      loanId?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/librarian/fines`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        throw new Error(err.error || 'Failed to apply library fine');
      }
      return ((await res.json()) as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['librarian', 'fines'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'clearance'] });
      queryClient.invalidateQueries({ queryKey: ['bursar'] });
      queryClient.invalidateQueries({ queryKey: ['studentClearance'] });
    },
  });
}

// 10. Student Clearance Inspection Hook
export function useStudentClearanceCheck(studentId?: string) {
  const userSession = useAppStore((state) => state.userSession);

  return useQuery<StudentClearanceDossier>({
    queryKey: ['librarian', 'clearance', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID required');
      const res = await fetch(`${API_BASE}/api/librarian/clearance/check/${encodeURIComponent(studentId)}`, {
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        throw new Error(err.error || 'Failed to check clearance');
      }
      const data = (await res.json()) as any;
      return data.dossier;
    },
    enabled: Boolean(studentId),
    staleTime: 10000,
  });
}

// 11. Grant Clearance Mutation
export function useGrantClearance() {
  const queryClient = useQueryClient();
  const userSession = useAppStore((state) => state.userSession);

  return useMutation({
    mutationFn: async (payload: { studentId: string; remarks?: string }) => {
      const res = await fetch(`${API_BASE}/api/librarian/clearance/grant`, {
        method: 'POST',
        headers: getAuthHeaders(userSession?.role || 'LIBRARIAN', userSession?.token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        throw new Error(err.error || 'Failed to grant clearance');
      }
      return ((await res.json()) as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['librarian', 'clearance', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['librarian', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['studentClearance'] });
    },
  });
}
