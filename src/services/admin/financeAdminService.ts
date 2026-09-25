import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { schema } from '../../database/client';
import { LedgerEngine } from '../finance/ledgerEngine';
import { SignatureService } from '../finance/signatureService';
import { eq, and } from 'drizzle-orm';
import { AuditService } from './auditService';

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
  categoryName?: string;
  categoryCode?: string;
  divisionId?: string;
  sessionId: string;
  sessionName?: string;
  level: number;
  amountKobo: number;
  formattedAmount: string;
  dueDate: string | null;
  createdAt: number;
}

export class FinanceAdminService {
  private auditService: AuditService;

  constructor(private db: IDatabaseProvider, auditService?: AuditService) {
    this.auditService = auditService || new AuditService(db);
  }

  /**
   * Validate that an amount is strictly an integer in Kobo and non-negative.
   */
  private validateKoboAmount(amountKobo: number): void {
    if (!Number.isInteger(amountKobo)) {
      throw new Error(
        `Financial Engine Violation: Monetary amounts must be strictly integers in Kobo. Floating-point value received: ${amountKobo}`
      );
    }
    if (amountKobo < 0) {
      throw new Error(
        `Financial Engine Violation: Monetary amounts cannot be negative. Value received: ${amountKobo}`
      );
    }
  }

  // -------------------------------------------------------------
  // Fee Categories (Tuition, Registration, ICT Levy, etc.)
  // -------------------------------------------------------------

  async createFeeCategory(data: {
    divisionId: string;
    name: string;
    code: string;
    isRecurring?: boolean;
  }): Promise<FeeCategoryItem> {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isRecurring = data.isRecurring !== undefined ? (data.isRecurring ? 1 : 0) : 1;

    if (this.db.drizzle) {
      try {
        const res = await this.db.drizzle
          .insert(schema.feeCategories)
          .values({
            id,
            divisionId: data.divisionId,
            name: data.name,
            code: data.code.toUpperCase(),
            isRecurring,
          })
          .returning();
        if (res && res.length > 0) {
          const row = res[0];
          return {
            id: row.id,
            divisionId: row.divisionId,
            name: row.name,
            code: row.code,
            isRecurring: Boolean(row.isRecurring),
          };
        }
      } catch {
        // Fallback to raw SQL
      }
    }

    await this.db.execute(
      `INSERT INTO fee_categories (id, division_id, name, code, is_recurring)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.divisionId, data.name, data.code.toUpperCase(), isRecurring]
    );

    return {
      id,
      divisionId: data.divisionId,
      name: data.name,
      code: data.code.toUpperCase(),
      isRecurring: Boolean(isRecurring),
    };
  }

  async listFeeCategories(divisionId?: string): Promise<FeeCategoryItem[]> {
    const sql = divisionId
      ? `SELECT id, division_id as divisionId, name, code, is_recurring as isRecurring FROM fee_categories WHERE division_id = ? ORDER BY name ASC`
      : `SELECT id, division_id as divisionId, name, code, is_recurring as isRecurring FROM fee_categories ORDER BY name ASC`;
    const rows = await this.db.query<any>(sql, divisionId ? [divisionId] : []);
    return rows.map(r => ({
      ...r,
      isRecurring: Boolean(r.isRecurring),
    }));
  }

  // -------------------------------------------------------------
  // Fee Schedules (Price Setting per Category, Session & Level)
  // -------------------------------------------------------------

  /**
   * Set or update a fee schedule price using strictly Kobo-integer arithmetic
   */
  async setFeePrice(data: {
    categoryId: string;
    sessionId: string;
    level: number;
    amountKobo: number;
    dueDate?: string;
  }): Promise<FeeScheduleItem> {
    this.validateKoboAmount(data.amountKobo);

    // Check if a fee schedule already exists for this (category, session, level)
    const existing = await this.db.queryFirst<any>(
      `SELECT id FROM fee_schedules WHERE category_id = ? AND session_id = ? AND level = ?`,
      [data.categoryId, data.sessionId, data.level]
    );

    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      // Update existing schedule
      if (this.db.drizzle) {
        try {
          await this.db.drizzle
            .update(schema.feeSchedules)
            .set({
              amountKobo: data.amountKobo,
              ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
            })
            .where(eq(schema.feeSchedules.id, existing.id));
        } catch {
          // Fallback
        }
      }

      await this.db.execute(
        `UPDATE fee_schedules SET amount_kobo = ?, due_date = COALESCE(?, due_date) WHERE id = ?`,
        [data.amountKobo, data.dueDate || null, existing.id]
      );

      const feeSchedule = (await this.getFeeScheduleById(existing.id))!;
      await this.auditService.logAdminAction({
        actorUserId: 'system-admin',
        action: 'UPDATE_FEE_SCHEDULE',
        entityName: 'fee_schedules',
        entityId: existing.id,
        newValue: { amountKobo: data.amountKobo, dueDate: data.dueDate, level: data.level },
      });
      return feeSchedule;
    } else {
      // Create new schedule
      const id = `fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      if (this.db.drizzle) {
        try {
          const res = await this.db.drizzle
            .insert(schema.feeSchedules)
            .values({
              id,
              categoryId: data.categoryId,
              sessionId: data.sessionId,
              level: data.level,
              amountKobo: data.amountKobo,
              dueDate: data.dueDate || null,
              createdAt: now,
            })
            .returning();
          if (res && res.length > 0) {
            const feeSchedule = (await this.getFeeScheduleById(id))!;
            await this.auditService.logAdminAction({
              actorUserId: 'system-admin',
              action: 'CREATE_FEE_SCHEDULE',
              entityName: 'fee_schedules',
              entityId: id,
              newValue: { amountKobo: data.amountKobo, level: data.level, categoryId: data.categoryId },
            });
            return feeSchedule;
          }
        } catch {
          // Fallback
        }
      }

      await this.db.execute(
        `INSERT INTO fee_schedules (id, category_id, session_id, level, amount_kobo, due_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, data.categoryId, data.sessionId, data.level, data.amountKobo, data.dueDate || null, now]
      );

      const feeSchedule = (await this.getFeeScheduleById(id))!;
      await this.auditService.logAdminAction({
        actorUserId: 'system-admin',
        action: 'CREATE_FEE_SCHEDULE',
        entityName: 'fee_schedules',
        entityId: id,
        newValue: { amountKobo: data.amountKobo, level: data.level, categoryId: data.categoryId },
      });
      return feeSchedule;
    }
  }

  /**
   * Set fee price using Nigerian Naira, safely converted to integer Kobo
   */
  async setFeePriceInNaira(data: {
    categoryId: string;
    sessionId: string;
    level: number;
    amountNaira: number;
    dueDate?: string;
  }): Promise<FeeScheduleItem> {
    const amountKobo = LedgerEngine.nairaToKobo(data.amountNaira);
    return await this.setFeePrice({
      categoryId: data.categoryId,
      sessionId: data.sessionId,
      level: data.level,
      amountKobo,
      dueDate: data.dueDate,
    });
  }

  async updateFeeSchedule(
    id: string,
    data: Partial<{
      amountKobo: number;
      amountNaira: number;
      dueDate: string | null;
      level: number;
    }>
  ): Promise<FeeScheduleItem> {
    const existing = await this.getFeeScheduleById(id);
    if (!existing) {
      throw new Error(`FeeSchedule with ID ${id} not found`);
    }

    let finalAmountKobo = existing.amountKobo;

    if (data.amountNaira !== undefined) {
      finalAmountKobo = LedgerEngine.nairaToKobo(data.amountNaira);
    } else if (data.amountKobo !== undefined) {
      this.validateKoboAmount(data.amountKobo);
      finalAmountKobo = data.amountKobo;
    }

    if (this.db.drizzle) {
      try {
        await this.db.drizzle
          .update(schema.feeSchedules)
          .set({
            amountKobo: finalAmountKobo,
            ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
            ...(data.level !== undefined && { level: data.level }),
          })
          .where(eq(schema.feeSchedules.id, id));
      } catch {
        // Fallback
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.amountKobo !== undefined || data.amountNaira !== undefined) {
      updates.push('amount_kobo = ?');
      params.push(finalAmountKobo);
    }
    if (data.dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(data.dueDate);
    }
    if (data.level !== undefined) {
      updates.push('level = ?');
      params.push(data.level);
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.execute(`UPDATE fee_schedules SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return (await this.getFeeScheduleById(id))!;
  }

  async deleteFeeSchedule(id: string): Promise<boolean> {
    const existing = await this.getFeeScheduleById(id);
    if (this.db.drizzle) {
      try {
        await this.db.drizzle.delete(schema.feeSchedules).where(eq(schema.feeSchedules.id, id));
      } catch {
        // Fallback
      }
    }
    const res = await this.db.execute(`DELETE FROM fee_schedules WHERE id = ?`, [id]);
    const success = (res.rowsAffected ?? 0) > 0;
    if (success && existing) {
      await this.auditService.logAdminAction({
        actorUserId: 'system-admin',
        action: 'DELETE_FEE_SCHEDULE',
        entityName: 'fee_schedules',
        entityId: id,
        oldValue: { amountKobo: existing.amountKobo, categoryId: existing.categoryId },
      });
    }
    return success;
  }

  async getFeeScheduleById(id: string): Promise<FeeScheduleItem | null> {
    const row = await this.db.queryFirst<any>(
      `SELECT fs.id, fs.category_id as categoryId, fs.session_id as sessionId, fs.level,
              fs.amount_kobo as amountKobo, fs.due_date as dueDate, fs.created_at as createdAt,
              fc.name as categoryName, fc.code as categoryCode, fc.division_id as divisionId,
              s.name as sessionName
       FROM fee_schedules fs
       LEFT JOIN fee_categories fc ON fs.category_id = fc.id
       LEFT JOIN academic_sessions s ON fs.session_id = s.id
       WHERE fs.id = ?`,
      [id]
    );

    if (!row) return null;

    return {
      ...row,
      formattedAmount: LedgerEngine.koboToNaira(row.amountKobo),
    };
  }

  async listFeeSchedules(filters?: {
    sessionId?: string;
    categoryId?: string;
    level?: number;
    divisionId?: string;
  }): Promise<FeeScheduleItem[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.sessionId) {
      conditions.push('fs.session_id = ?');
      params.push(filters.sessionId);
    }
    if (filters?.categoryId) {
      conditions.push('fs.category_id = ?');
      params.push(filters.categoryId);
    }
    if (filters?.level) {
      conditions.push('fs.level = ?');
      params.push(filters.level);
    }
    if (filters?.divisionId) {
      conditions.push('fc.division_id = ?');
      params.push(filters.divisionId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.db.query<any>(
      `SELECT fs.id, fs.category_id as categoryId, fs.session_id as sessionId, fs.level,
              fs.amount_kobo as amountKobo, fs.due_date as dueDate, fs.created_at as createdAt,
              fc.name as categoryName, fc.code as categoryCode, fc.division_id as divisionId,
              s.name as sessionName
       FROM fee_schedules fs
       LEFT JOIN fee_categories fc ON fs.category_id = fc.id
       LEFT JOIN academic_sessions s ON fs.session_id = s.id
       ${whereClause}
       ORDER BY fc.name ASC, fs.level ASC`,
      params
    );

    return rows.map(r => ({
      ...r,
      formattedAmount: LedgerEngine.koboToNaira(r.amountKobo),
    }));
  }

  // =============================================================
  // Bursar Financial Management: Transactions & Reconciliation
  // =============================================================

  /**
   * Ensure standard baseline demo student invoices and pending transactions exist
   */
  async ensureSeedInvoicesAndTransactions(): Promise<void> {
    const existingInvoices = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM student_invoices`
    );

    if (!existingInvoices || existingInvoices.count === 0) {
      // Find fee schedules to bind to invoices
      const nceSched = await this.db.queryFirst<any>(
        `SELECT id, amount_kobo FROM fee_schedules WHERE category_id = 'fee-nce-tuition' LIMIT 1`
      );
      const degSched = await this.db.queryFirst<any>(
        `SELECT id, amount_kobo FROM fee_schedules WHERE category_id = 'fee-deg-tuition' LIMIT 1`
      );

      const nceSchedId = nceSched?.id || 'sched-nce-100-tui';
      const nceAmount = nceSched?.amount_kobo || 4500000;
      const degSchedId = degSched?.id || 'sched-deg-100-tui';
      const degAmount = degSched?.amount_kobo || 7500000;

      // Seed student invoices
      await this.db.execute(
        `INSERT OR IGNORE INTO student_invoices (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES 
         ('inv-std-001', 'std-001', ?, 'INV-2026-COEKA-00184', ?, 0, 'UNPAID'),
         ('inv-std-002', 'std-002', ?, 'INV-2026-COEKA-00185', ?, 2000000, 'PARTIALLY_PAID'),
         ('inv-std-003', 'std-003', ?, 'INV-2026-COEKA-00186', ?, 0, 'UNPAID')`,
        [nceSchedId, nceAmount, nceSchedId, nceAmount, degSchedId, degAmount]
      );
    }

    const existingTx = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM payment_transactions`
    );

    if (!existingTx || existingTx.count === 0) {
      await this.db.execute(
        `INSERT OR IGNORE INTO payment_transactions 
         (id, student_id, invoice_id, transaction_reference, bank_reference, payment_channel, amount_kobo, channel_fee_kobo, net_amount_kobo, status, payer_name, payer_phone, reconciliation_notes)
         VALUES 
         ('tx-pend-001', 'std-001', 'inv-std-001', 'BNK-TRF-2026-88192', 'FBN/TRF/98716254', 'BANK_TRANSFER', 4500000, 0, 4500000, 'PENDING', 'Elder Tor Moses Iorliam', '08088889900', 'Direct deposit from First Bank Mobile App for Aondoaver Iorliam'),
         ('tx-pend-002', 'std-002', 'inv-std-002', 'POS-COEKA-2026-4412', 'POS/STANBIC/7721', 'POS_TERMINAL', 2500000, 15000, 2485000, 'PENDING', 'Doose Mercy Gbadu', '08066667788', 'Campus Bursary POS terminal payment - NCE Biology'),
         ('tx-pend-003', 'std-003', 'inv-std-003', 'UBA-DEP-2026-3391', 'UBA/KTS/66129', 'BANK_TRANSFER', 7500000, 0, 7500000, 'PENDING', 'Victor Terna Chia', '08077778899', 'Bank branch teller deposit receipt slip 003921'),
         ('tx-rec-004', 'std-002', 'inv-std-002', 'VPAY-NUBAN-2026-1102', 'VPAY/WEMA/991084', 'VPAY_VIRTUAL_ACCOUNT', 2000000, 0, 2000000, 'RECONCILED', 'Doose Mercy Gbadu', '08066667788', 'Instant dynamic NUBAN auto-clearing')`
      );
    }
  }

  /**
   * List payment transactions with rich student and invoice metadata
   */
  async listPaymentTransactions(filters?: {
    status?: string;
    studentId?: string;
    paymentChannel?: string;
    search?: string;
  }): Promise<any[]> {
    await this.ensureSeedInvoicesAndTransactions();

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.status) {
      conditions.push('pt.status = ?');
      params.push(filters.status.toUpperCase());
    }
    if (filters?.studentId) {
      conditions.push('pt.student_id = ?');
      params.push(filters.studentId);
    }
    if (filters?.paymentChannel) {
      conditions.push('pt.payment_channel = ?');
      params.push(filters.paymentChannel);
    }
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push('(LOWER(pt.transaction_reference) LIKE ? OR LOWER(pt.bank_reference) LIKE ? OR LOWER(pt.payer_name) LIKE ? OR LOWER(s.matric_number) LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await this.db.query<any>(
      `SELECT 
         pt.*,
         s.matric_number as studentMatricNumber,
         s.first_name || ' ' || s.last_name as studentName,
         d.name as divisionName,
         p.name as programmeName,
         inv.invoice_number as invoiceNumber,
         inv.amount_due_kobo as invoiceAmountDueKobo,
         inv.amount_paid_kobo as invoiceAmountPaidKobo,
         rec.receipt_number as receiptNumber,
         rec.verification_hash as receiptVerificationHash
       FROM payment_transactions pt
       LEFT JOIN students s ON pt.student_id = s.id
       LEFT JOIN divisions d ON s.division_id = d.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       LEFT JOIN student_invoices inv ON pt.invoice_id = inv.id
       LEFT JOIN payment_receipts rec ON pt.id = rec.transaction_id
       ${whereClause}
       ORDER BY pt.created_at DESC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.studentName || 'Unallocated Deposit',
      studentMatricNumber: r.studentMatricNumber || 'N/A',
      divisionName: r.divisionName || 'N/A',
      programmeName: r.programmeName || 'N/A',
      invoiceId: r.invoice_id,
      invoiceNumber: r.invoiceNumber || 'N/A',
      transactionReference: r.transaction_reference,
      bankReference: r.bank_reference || 'N/A',
      paymentChannel: r.payment_channel,
      amountKobo: r.amount_kobo,
      channelFeeKobo: r.channel_fee_kobo,
      netAmountKobo: r.net_amount_kobo,
      formattedAmount: LedgerEngine.koboToNaira(r.amount_kobo),
      formattedNetAmount: LedgerEngine.koboToNaira(r.net_amount_kobo),
      status: r.status,
      payerName: r.payer_name || 'Anonymous Payer',
      payerPhone: r.payer_phone || 'N/A',
      reconciledByStaffId: r.reconciled_by_staff_id,
      reconciledAt: r.reconciled_at,
      reconciliationNotes: r.reconciliation_notes,
      createdAt: r.created_at,
      receiptNumber: r.receiptNumber,
      receiptVerificationHash: r.receiptVerificationHash,
    }));
  }

  /**
   * Reconcile an incoming bank or gateway payment with a student account & invoice
   */
  async reconcilePayment(input: {
    transactionId: string;
    studentId: string;
    amountKobo?: number;
    invoiceId?: string;
    staffId?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    transaction: any;
    invoice: any;
    receipt: any;
  }> {
    await this.ensureSeedInvoicesAndTransactions();

    const { transactionId, studentId, staffId = 'usr-bur-001', notes } = input;

    // 1. Fetch transaction record
    const txn = await this.db.queryFirst<any>(
      `SELECT * FROM payment_transactions WHERE id = ? OR transaction_reference = ?`,
      [transactionId, transactionId]
    );

    if (!txn) {
      throw new Error(`Reconciliation Error: Transaction '${transactionId}' not found.`);
    }

    if (txn.status === 'RECONCILED') {
      throw new Error(`Reconciliation Error: Transaction '${txn.transaction_reference}' has already been reconciled.`);
    }

    // 2. Fetch student record
    const student = await this.db.queryFirst<any>(
      `SELECT s.*, u.email, u.username, d.name as divisionName, p.name as programmeName 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       LEFT JOIN divisions d ON s.division_id = d.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       WHERE s.id = ? OR s.matric_number = ? OR u.username = ?`,
      [studentId, studentId, studentId]
    );

    if (!student) {
      throw new Error(`Reconciliation Error: Student '${studentId}' does not exist.`);
    }

    const effectiveAmountKobo = input.amountKobo !== undefined ? input.amountKobo : txn.amount_kobo;
    this.validateKoboAmount(effectiveAmountKobo);

    // 3. Locate or resolve matching unpaid invoice
    let invoice: any = null;
    if (input.invoiceId) {
      invoice = await this.db.queryFirst<any>(
        `SELECT * FROM student_invoices WHERE id = ?`,
        [input.invoiceId]
      );
    }

    if (!invoice) {
      // Find oldest unpaid or partially paid invoice for this student
      invoice = await this.db.queryFirst<any>(
        `SELECT * FROM student_invoices 
         WHERE student_id = ? AND status != 'PAID' 
         ORDER BY created_at ASC LIMIT 1`,
        [student.id]
      );
    }

    if (!invoice) {
      // Create provisional fee invoice if no unpaid invoice exists
      const feeSched = await this.db.queryFirst<any>(
        `SELECT fs.* FROM fee_schedules fs 
         JOIN fee_categories fc ON fs.category_id = fc.id 
         WHERE fc.division_id = ? AND fs.level = ? LIMIT 1`,
        [student.division_id, student.current_level]
      );

      const schedId = feeSched?.id || 'sched-nce-100-tui';
      const invNum = `INV-2026-COEKA-${Math.floor(100000 + Math.random() * 900000)}`;
      const invId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      await this.db.execute(
        `INSERT INTO student_invoices (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES (?, ?, ?, ?, ?, 0, 'UNPAID')`,
        [invId, student.id, schedId, invNum, effectiveAmountKobo]
      );

      invoice = await this.db.queryFirst<any>(`SELECT * FROM student_invoices WHERE id = ?`, [invId]);
    }

    // 4. Update Invoice Balance with Integer Kobo Arithmetic
    const previousPaidKobo = Number(invoice.amount_paid_kobo || 0);
    const newPaidKobo = previousPaidKobo + effectiveAmountKobo;
    const amountDueKobo = Number(invoice.amount_due_kobo);
    const newStatus = newPaidKobo >= amountDueKobo ? 'PAID' : 'PARTIALLY_PAID';

    await this.db.execute(
      `UPDATE student_invoices 
       SET amount_paid_kobo = ?, status = ?
       WHERE id = ?`,
      [newPaidKobo, newStatus, invoice.id]
    );

    // 5. Update Payment Transaction to RECONCILED
    const now = Math.floor(Date.now() / 1000);
    const reconciliationNotes = notes || `Payment verified and matched to invoice ${invoice.invoice_number} by Bursar`;

    await this.db.execute(
      `UPDATE payment_transactions 
       SET student_id = ?, invoice_id = ?, status = 'RECONCILED',
           reconciled_by_staff_id = ?, reconciled_at = ?, reconciliation_notes = ?
       WHERE id = ?`,
      [student.id, invoice.id, staffId, now, reconciliationNotes, txn.id]
    );

    // 6. Issue Official Cryptographic Receipt
    const receipt = await this.issueOfficialReceipt(txn.id, staffId);

    // 7. Resolve any pending debt alerts for this invoice if completely cleared
    if (newStatus === 'PAID') {
      await this.db.execute(
        `UPDATE debt_alerts 
         SET is_resolved = 1, resolved_at = strftime('%s', 'now') 
         WHERE invoice_id = ?`,
        [invoice.id]
      );
    }

    // 8. Cryptographic Audit Trail
    await this.auditService.logAdminAction({
      actorUserId: staffId,
      action: 'RECONCILE_PAYMENT',
      entityName: 'payment_transactions',
      entityId: txn.id,
      oldValue: { status: txn.status, invoiceId: txn.invoice_id },
      newValue: {
        status: 'RECONCILED',
        studentId: student.id,
        invoiceId: invoice.id,
        creditedKobo: effectiveAmountKobo,
        receiptNumber: receipt.receiptNumber,
      },
    });

    const updatedTxn = await this.db.queryFirst<any>(`SELECT * FROM payment_transactions WHERE id = ?`, [txn.id]);
    const updatedInv = await this.db.queryFirst<any>(`SELECT * FROM student_invoices WHERE id = ?`, [invoice.id]);

    return {
      success: true,
      message: `Transaction ${txn.transaction_reference} successfully reconciled to ${student.first_name} ${student.last_name} (${student.matric_number})`,
      transaction: updatedTxn,
      invoice: {
        ...updatedInv,
        formattedPaid: LedgerEngine.koboToNaira(updatedInv.amount_paid_kobo),
        formattedDue: LedgerEngine.koboToNaira(updatedInv.amount_due_kobo),
      },
      receipt,
    };
  }

  /**
   * Generate an official tamper-proof signed receipt for a reconciled transaction
   */
  async issueOfficialReceipt(transactionId: string, staffId: string = 'usr-bur-001'): Promise<any> {
    await this.ensureSeedInvoicesAndTransactions();

    // Check if receipt already issued for this transaction
    const existing = await this.db.queryFirst<any>(
      `SELECT r.*, s.matric_number as matricNumber, s.first_name || ' ' || s.last_name as studentName,
              d.name as divisionName, inv.invoice_number as invoiceNumber, pt.transaction_reference as transactionRef,
              pt.payment_channel as channel
       FROM payment_receipts r
       JOIN students s ON r.student_id = s.id
       JOIN student_invoices inv ON r.invoice_id = inv.id
       JOIN payment_transactions pt ON r.transaction_id = pt.id
       LEFT JOIN divisions d ON s.division_id = d.id
       WHERE r.transaction_id = ?`,
      [transactionId]
    );

    if (existing) {
      return {
        ...existing,
        formattedAmountPaid: LedgerEngine.koboToNaira(existing.amount_paid_kobo),
        formattedBalanceRemaining: LedgerEngine.koboToNaira(existing.balance_remaining_kobo),
        verificationUrl: `https://portal.coekatsinaala.edu.ng/verify/receipt/${existing.receipt_number}`,
      };
    }

    // Retrieve transaction, student, and invoice
    const txn = await this.db.queryFirst<any>(
      `SELECT * FROM payment_transactions WHERE id = ? OR transaction_reference = ?`,
      [transactionId, transactionId]
    );

    if (!txn) {
      throw new Error(`Receipt Generation Error: Transaction '${transactionId}' not found.`);
    }

    if (!txn.student_id || !txn.invoice_id) {
      throw new Error(`Receipt Generation Error: Transaction must be assigned to a student and invoice before issuing a receipt.`);
    }

    const student = await this.db.queryFirst<any>(
      `SELECT s.*, d.name as divisionName FROM students s LEFT JOIN divisions d ON s.division_id = d.id WHERE s.id = ?`,
      [txn.student_id]
    );

    const invoice = await this.db.queryFirst<any>(
      `SELECT * FROM student_invoices WHERE id = ?`,
      [txn.invoice_id]
    );

    const issuedAt = Math.floor(Date.now() / 1000);
    const receiptNumber = `COEKA/REC/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
    const balanceRemainingKobo = Math.max(0, Number(invoice.amount_due_kobo) - Number(invoice.amount_paid_kobo));

    // Cryptographic signature hash
    const rawSignaturePayload = `${receiptNumber}:${student.id}:${txn.amount_kobo}:${balanceRemainingKobo}:${issuedAt}`;
    const verificationHash = await SignatureService.generateVerificationHash(rawSignaturePayload);
    const qrCodeUrl = `https://portal.coekatsinaala.edu.ng/verify/receipt/${receiptNumber}?sig=${verificationHash.substring(0, 16)}`;

    const receiptId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await this.db.execute(
      `INSERT INTO payment_receipts 
       (id, receipt_number, transaction_id, invoice_id, student_id, amount_paid_kobo, balance_remaining_kobo, issued_at, issued_by_staff_id, verification_hash, qr_code_url, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        receiptId,
        receiptNumber,
        txn.id,
        invoice.id,
        student.id,
        txn.amount_kobo,
        balanceRemainingKobo,
        issuedAt,
        staffId,
        verificationHash,
        qrCodeUrl,
        JSON.stringify({
          payerName: txn.payer_name,
          paymentChannel: txn.payment_channel,
          bankReference: txn.bank_reference,
          invoiceNumber: invoice.invoice_number,
        }),
      ]
    );

    return {
      id: receiptId,
      receiptNumber,
      transactionId: txn.id,
      transactionReference: txn.transaction_reference,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      matricNumber: student.matric_number,
      divisionName: student.divisionName || 'NCE',
      amountPaidKobo: txn.amount_kobo,
      balanceRemainingKobo,
      formattedAmountPaid: LedgerEngine.koboToNaira(txn.amount_kobo),
      formattedBalanceRemaining: LedgerEngine.koboToNaira(balanceRemainingKobo),
      paymentChannel: txn.payment_channel,
      issuedAt,
      issuedByStaffId: staffId,
      verificationHash,
      verificationUrl: `https://portal.coekatsinaala.edu.ng/verify/receipt/${receiptNumber}`,
      qrCodeUrl,
    };
  }

  /**
   * Aggregate institutional revenue statistics by division, level, and payment channel
   */
  async getRevenueReport(filters?: {
    divisionId?: string;
    sessionId?: string;
  }): Promise<{
    summary: {
      totalExpectedKobo: number;
      totalCollectedKobo: number;
      totalOutstandingKobo: number;
      totalTransactionsCount: number;
      collectionRate: number;
      formattedTotalExpected: string;
      formattedTotalCollected: string;
      formattedTotalOutstanding: string;
    };
    breakdown: any[];
    byChannel: any[];
    generatedAt: number;
  }> {
    await this.ensureSeedInvoicesAndTransactions();

    // 1. Division & Level Breakdown
    const divisionRows = await this.db.query<any>(
      `SELECT 
         d.id as divisionId,
         d.name as divisionName,
         s.current_level as level,
         COUNT(DISTINCT s.id) as studentCount,
         COALESCE(SUM(inv.amount_due_kobo), 0) as expectedKobo,
         COALESCE(SUM(inv.amount_paid_kobo), 0) as collectedKobo
       FROM divisions d
       JOIN students s ON s.division_id = d.id
       LEFT JOIN student_invoices inv ON inv.student_id = s.id
       GROUP BY d.id, s.current_level
       ORDER BY d.name ASC, s.current_level ASC`
    );

    let totalExpectedKobo = 0;
    let totalCollectedKobo = 0;

    const breakdown = divisionRows.map((r) => {
      const exp = Number(r.expectedKobo || 0);
      const col = Number(r.collectedKobo || 0);
      const out = Math.max(0, exp - col);
      totalExpectedKobo += exp;
      totalCollectedKobo += col;
      const rate = exp > 0 ? Number(((col / exp) * 100).toFixed(1)) : 0;

      return {
        divisionId: r.divisionId,
        divisionName: r.divisionName,
        level: r.level || 100,
        studentCount: r.studentCount,
        expectedKobo: exp,
        collectedKobo: col,
        outstandingKobo: out,
        collectionRate: rate,
        formattedExpected: LedgerEngine.koboToNaira(exp),
        formattedCollected: LedgerEngine.koboToNaira(col),
        formattedOutstanding: LedgerEngine.koboToNaira(out),
      };
    });

    const totalOutstandingKobo = Math.max(0, totalExpectedKobo - totalCollectedKobo);
    const overallRate = totalExpectedKobo > 0 ? Number(((totalCollectedKobo / totalExpectedKobo) * 100).toFixed(1)) : 0;

    // 2. Breakdown by Payment Channel
    const channelRows = await this.db.query<any>(
      `SELECT 
         payment_channel as channel,
         COUNT(*) as count,
         COALESCE(SUM(net_amount_kobo), 0) as totalKobo
       FROM payment_transactions
       WHERE status = 'RECONCILED'
       GROUP BY payment_channel`
    );

    const totalTxCount = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM payment_transactions`
    );

    const byChannel = channelRows.map((c) => ({
      channel: c.channel,
      count: c.count,
      totalKobo: Number(c.totalKobo),
      formattedTotal: LedgerEngine.koboToNaira(Number(c.totalKobo)),
    }));

    return {
      summary: {
        totalExpectedKobo,
        totalCollectedKobo,
        totalOutstandingKobo,
        totalTransactionsCount: totalTxCount?.count || 0,
        collectionRate: overallRate,
        formattedTotalExpected: LedgerEngine.koboToNaira(totalExpectedKobo),
        formattedTotalCollected: LedgerEngine.koboToNaira(totalCollectedKobo),
        formattedTotalOutstanding: LedgerEngine.koboToNaira(totalOutstandingKobo),
      },
      breakdown,
      byChannel,
      generatedAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Retrieve list of students with outstanding balances > 0
   */
  async getDebtorList(filters?: {
    divisionId?: string;
    level?: number;
    minDebtKobo?: number;
    search?: string;
  }): Promise<any[]> {
    await this.ensureSeedInvoicesAndTransactions();

    const conditions: string[] = ["inv.status != 'PAID'"];
    const params: any[] = [];

    if (filters?.divisionId) {
      conditions.push('s.division_id = ?');
      params.push(filters.divisionId);
    }
    if (filters?.level) {
      conditions.push('s.current_level = ?');
      params.push(filters.level);
    }
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push('(LOWER(s.matric_number) LIKE ? OR LOWER(s.first_name) LIKE ? OR LOWER(s.middle_name) LIKE ? OR LOWER(s.last_name) LIKE ? OR LOWER(u.email) LIKE ?)');
      params.push(term, term, term, term, term);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const rows = await this.db.query<any>(
      `SELECT 
         s.id as studentId,
         s.matric_number as matricNumber,
         s.first_name || CASE WHEN s.middle_name IS NOT NULL AND s.middle_name != '' THEN ' ' || s.middle_name ELSE '' END || ' ' || s.last_name as fullName,
         s.current_level as level,
         s.division_id as divisionId,
         d.name as divisionName,
         p.name as programmeName,
         u.email,
         u.phone_number as phoneNumber,
         COALESCE(SUM(inv.amount_due_kobo), 0) as totalBilledKobo,
         COALESCE(SUM(inv.amount_paid_kobo), 0) as totalPaidKobo,
         COALESCE(SUM(inv.amount_due_kobo - inv.amount_paid_kobo), 0) as outstandingDebtKobo,
         COUNT(inv.id) as unpaidInvoicesCount,
         GROUP_CONCAT(inv.invoice_number, ', ') as invoiceNumbers,
         MAX(inv.created_at) as latestInvoiceDate
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN divisions d ON s.division_id = d.id
       JOIN programmes p ON s.programme_id = p.id
       JOIN student_invoices inv ON inv.student_id = s.id
       ${whereClause}
       GROUP BY s.id
       HAVING outstandingDebtKobo > 0
       ORDER BY outstandingDebtKobo DESC`,
      params
    );

    // Check active debt alerts
    const alerts = await this.db.query<any>(
      `SELECT student_id, severity FROM debt_alerts WHERE is_resolved = 0`
    );
    const alertMap = new Map<string, string>(alerts.map(a => [a.student_id, a.severity]));

    let debtors = rows.map((r) => {
      const debtKobo = Number(r.outstandingDebtKobo);
      const activeSeverity = alertMap.get(r.studentId);

      return {
        studentId: r.studentId,
        matricNumber: r.matricNumber,
        fullName: r.fullName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        divisionId: r.divisionId,
        divisionName: r.divisionName,
        programmeName: r.programmeName,
        level: r.level,
        totalBilledKobo: Number(r.totalBilledKobo),
        totalPaidKobo: Number(r.totalPaidKobo),
        outstandingDebtKobo: debtKobo,
        formattedDebt: LedgerEngine.koboToNaira(debtKobo),
        formattedBilled: LedgerEngine.koboToNaira(Number(r.totalBilledKobo)),
        formattedPaid: LedgerEngine.koboToNaira(Number(r.totalPaidKobo)),
        unpaidInvoicesCount: r.unpaidInvoicesCount,
        invoiceNumbers: r.invoiceNumbers,
        latestInvoiceDate: r.latestInvoiceDate,
        hasActiveAlert: Boolean(activeSeverity),
        alertSeverity: activeSeverity || 'NONE',
      };
    });

    if (filters?.minDebtKobo !== undefined) {
      debtors = debtors.filter(d => d.outstandingDebtKobo >= filters.minDebtKobo!);
    }

    return debtors;
  }

  /**
   * Dispatch or log an official debt reminder / examination clearance warning
   */
  async sendDebtAlert(data: {
    studentId: string;
    invoiceId?: string;
    severity?: 'NOTICE' | 'WARNING' | 'FINAL_DEMAND' | 'EXAM_BARRED';
    notes?: string;
  }): Promise<any> {
    await this.ensureSeedInvoicesAndTransactions();

    const { studentId, severity = 'WARNING', notes } = data;

    let invoiceId = data.invoiceId;
    if (!invoiceId) {
      const inv = await this.db.queryFirst<any>(
        `SELECT id, (amount_due_kobo - amount_paid_kobo) as debt 
         FROM student_invoices WHERE student_id = ? AND status != 'PAID' LIMIT 1`,
        [studentId]
      );
      if (!inv) {
        throw new Error(`Debt Alert Error: Student ${studentId} has no active unpaid invoice.`);
      }
      invoiceId = inv.id;
    }

    const invoice = await this.db.queryFirst<any>(
      `SELECT * FROM student_invoices WHERE id = ?`,
      [invoiceId]
    );

    const outstandingKobo = Math.max(0, Number(invoice.amount_due_kobo) - Number(invoice.amount_paid_kobo));
    const alertId = `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await this.db.execute(
      `INSERT INTO debt_alerts (id, student_id, invoice_id, outstanding_amount_kobo, severity, channel, notes)
       VALUES (?, ?, ?, ?, ?, 'PORTAL', ?)`,
      [alertId, studentId, invoiceId, outstandingKobo, severity, notes || `Official ${severity} dispatched for invoice ${invoice.invoice_number}`]
    );

    return {
      id: alertId,
      studentId,
      invoiceId,
      outstandingAmountKobo: outstandingKobo,
      formattedDebt: LedgerEngine.koboToNaira(outstandingKobo),
      severity,
      sentAt: Math.floor(Date.now() / 1000),
      isResolved: false,
    };
  }
}
