import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { ICacheProvider } from '../../infrastructure/interfaces/ICacheProvider';
import { LedgerEngine } from './ledgerEngine';

export interface SessionBillingParams {
  newSession: string; // e.g. '2027/2028'
  divisionCode?: string; // Optional filter: 'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY'
  targetLevel?: number; // Optional filter: 100, 200, 300
}

export interface SessionBillingResult {
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

export class SessionBillingService {
  constructor(
    private db: IDatabaseProvider,
    private cache?: ICacheProvider
  ) {}

  /**
   * Determine statutory tuition and levy amount based on division and level
   */
  static getStatutoryFeeAmountKobo(division: string, level: number): { title: string; amountKobo: number } {
    const div = division.toUpperCase();
    if (div === 'DEGREE') {
      return level === 100
        ? { title: 'Degree Affiliated Regular Tuition & Institutional Consolidated Levy', amountKobo: 6500000 } // ₦65,000
        : { title: 'Degree Returning Student Tuition & Departmental Practicals Fee', amountKobo: 6000000 }; // ₦60,000
    }
    if (div === 'SECONDARY') {
      return { title: 'Demonstration Secondary School Consolidated Termly Tuition & PTA Levy', amountKobo: 2500000 }; // ₦25,000
    }
    if (div === 'PRIMARY') {
      return { title: 'Staff Primary School Termly Tuition & Development Levy', amountKobo: 1800000 }; // ₦18,000
    }
    // NCE Standard
    switch (level) {
      case 200:
        return { title: 'NCE 200 Level Returning Student Tuition & Teaching Practice Levy', amountKobo: 4000000 }; // ₦40,000
      case 300:
        return { title: 'NCE 300 Level Final Year Tuition & Project Supervision Levy', amountKobo: 3800000 }; // ₦38,000
      default:
        return { title: 'NCE 100 Level Fresh Student Tuition & Consolidated Academic Fees', amountKobo: 4500000 }; // ₦45,000
    }
  }

  /**
   * Apply new session fee matrix to all active students in a division or institution-wide
   */
  async applySessionFeeMatrix(params: SessionBillingParams): Promise<SessionBillingResult> {
    const conditions: string[] = ["s.academic_status = 'ACTIVE'"];
    const queryParams: any[] = [];

    if (params.targetLevel) {
      conditions.push('s.current_level = ?');
      queryParams.push(params.targetLevel);
    }

    const students = await this.db.query<any>(
      `SELECT s.id, s.matric_number, s.current_level, d.code as divisionCode
       FROM students s
       LEFT JOIN divisions d ON s.division_id = d.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.matric_number ASC`,
      queryParams
    );

    let totalBilledKobo = 0;
    const invoicesSummary: SessionBillingResult['invoicesSummary'] = [];

    const cleanSession = params.newSession.replace(/[^0-9]/g, '');

    for (let i = 0; i < (students || []).length; i++) {
      const student = students[i];
      const divCode = (student.divisionCode || params.divisionCode || 'NCE').toUpperCase();
      const level = Number(student.current_level || 100);

      const fee = SessionBillingService.getStatutoryFeeAmountKobo(divCode, level);
      const invoiceId = `inv-${cleanSession}-${student.id}`;
      const invoiceNumber = `INV-${params.newSession.replace('/', '-')}-${student.matric_number.replace(/\//g, '-')}`;

      // Insert new session invoice
      await this.db.execute(
        `INSERT OR IGNORE INTO student_invoices 
         (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES (?, ?, 'sched-nce-100-tui', ?, ?, 0, 'UNPAID')`,
        [invoiceId, student.id, invoiceNumber, fee.amountKobo]
      );

      totalBilledKobo += fee.amountKobo;
      invoicesSummary.push({
        studentId: student.id,
        matricNumber: student.matric_number,
        level,
        invoiceNumber,
        amountKobo: fee.amountKobo,
        formattedAmount: LedgerEngine.koboToNaira(fee.amountKobo),
      });

      // Clear student invoices cache if cache provider present
      if (this.cache) {
        await this.cache.delete(`invoices:${student.id}`);
      }
    }

    return {
      session: params.newSession,
      totalBilledStudents: students?.length || 0,
      totalInvoicesCreated: invoicesSummary.length,
      totalBilledKobo,
      formattedTotalBilled: LedgerEngine.koboToNaira(totalBilledKobo),
      invoicesSummary,
    };
  }
}
