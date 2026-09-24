import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { ICacheProvider } from '../../infrastructure/interfaces/ICacheProvider';
import { IQueueProvider } from '../../infrastructure/interfaces/IQueueProvider';
import { LedgerEngine } from './ledgerEngine';
import { VirtualAccountService } from './virtualAccountService';

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  feeTitle: string;
  category: string;
  amountDueKobo: number;
  amountPaidKobo: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  dueDate: string;
  paidAt?: string;
  formattedDue?: string;
  formattedPaid?: string;
}

export class FinanceService {
  constructor(
    private db: IDatabaseProvider,
    private cache: ICacheProvider,
    private queue?: IQueueProvider
  ) {}

  async getInvoices(studentId: string = 'std-sample-001'): Promise<InvoiceItem[]> {
    // Check cache first
    const cacheKey = `invoices:${studentId}`;
    const cached = await this.cache.get<InvoiceItem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const defaultInvoices: InvoiceItem[] = [
      {
        id: 'inv-001',
        invoiceNumber: 'INV-2026-COEKA-00184',
        feeTitle: '2026/2027 NCE Tuition & Consolidated Institutional Fees',
        category: 'TUITION',
        amountDueKobo: 4500000, // ₦45,000.00
        amountPaidKobo: 0,
        status: 'UNPAID',
        dueDate: '2026-12-15',
      },
      {
        id: 'inv-002',
        invoiceNumber: 'INV-2026-COEKA-00185',
        feeTitle: 'Hostel Accommodation (Hall A - Female Bedspace)',
        category: 'HOSTEL',
        amountDueKobo: 2000000, // ₦20,000.00
        amountPaidKobo: 2000000,
        status: 'PAID',
        dueDate: '2026-11-30',
        paidAt: '2026-10-05T14:32:00Z',
      },
    ];

    const formatted = defaultInvoices.map(inv => ({
      ...inv,
      formattedDue: LedgerEngine.koboToNaira(inv.amountDueKobo),
      formattedPaid: LedgerEngine.koboToNaira(inv.amountPaidKobo),
    }));

    await this.cache.set(cacheKey, formatted, 300); // 5 min cache
    return formatted;
  }

  async getVirtualAccount(student: {
    studentId: string;
    matricNumber: string;
    studentName: string;
    phoneNumber?: string;
  }) {
    const cacheKey = `virtual-account:${student.studentId}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const account = await VirtualAccountService.createDedicatedAccount({
      ...student,
      phoneNumber: student.phoneNumber || '08000000000',
    }, 'VPAY');
    await this.cache.set(cacheKey, account, 86400); // 24 hour cache
    return account;
  }

  async recordPayment(invoiceId: string, amountKobo: number, reference: string) {
    if (this.queue) {
      await this.queue.push({
        type: 'FINANCE_PAYMENT_RECONCILED',
        invoiceId,
        amountKobo,
        reference,
        timestamp: new Date().toISOString(),
      });
    }

    // Invalidate invoice cache
    await this.cache.delete(`invoices:std-sample-001`);
    return { success: true, reference };
  }
}
