import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WardSummary, WardPerformance, MultiChildPaymentItem, ConsolidatedPaymentResult } from '../../services/parent/parentService';

export type { WardSummary, WardPerformance, MultiChildPaymentItem, ConsolidatedPaymentResult };

export interface ParentWardsResponse {
  parent: {
    parentId: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  wards: WardSummary[];
}

export interface ChildPerformanceResponse {
  success: boolean;
  performance: WardPerformance;
}

export interface ChildInvoicesResponse {
  success: boolean;
  childId: string;
  fullName: string;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    title: string;
    category: string;
    amountDueKobo: number;
    amountPaidKobo: number;
    balanceKobo: number;
    formattedDue: string;
    formattedPaid: string;
    formattedBalance: string;
    status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
    dueDate: string;
  }>;
  summary: {
    totalDueKobo: number;
    totalPaidKobo: number;
    outstandingBalanceKobo: number;
    formattedOutstandingBalance: string;
    hasOutstandingDebt: boolean;
  };
  virtualAccount: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

export function useParentWards() {
  return useQuery<ParentWardsResponse>({
    queryKey: ['parent', 'wards'],
    queryFn: async () => {
      const res = await fetch('/api/parent/wards', {
        headers: { credentials: 'include' },
      });
      if (!res.ok) {
        throw new Error(`Failed to load parent wards: ${res.statusText}`);
      }
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useChildPerformance(childId: string | null) {
  return useQuery<ChildPerformanceResponse>({
    queryKey: ['parent', 'ward-performance', childId],
    queryFn: async () => {
      if (!childId) throw new Error('No childId provided');
      const res = await fetch(`/api/parent/wards/${childId}/performance`, {
        headers: { credentials: 'include' },
      });
      if (!res.ok) {
        throw new Error(`Failed to load child performance: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: Boolean(childId),
    staleTime: 60 * 1000,
  });
}

export function useChildInvoices(childId: string | null) {
  return useQuery<ChildInvoicesResponse>({
    queryKey: ['parent', 'ward-invoices', childId],
    queryFn: async () => {
      if (!childId) throw new Error('No childId provided');
      const res = await fetch(`/api/parent/wards/${childId}/invoices`, {
        headers: { credentials: 'include' },
      });
      if (!res.ok) {
        throw new Error(`Failed to load child invoices: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: Boolean(childId),
    staleTime: 60 * 1000,
  });
}

export function useMultiChildPay() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; payment: ConsolidatedPaymentResult }, Error, {
    items: MultiChildPaymentItem[];
    gateway?: string;
  }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/parent/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          credentials: 'include',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson: any = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error || `Payment checkout failed with status ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent'] });
    },
  });
}
