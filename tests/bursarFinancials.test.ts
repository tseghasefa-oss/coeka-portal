import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer, resetDefaultMemoryContainer, getContainer } from '../src/infrastructure/container';
import { FinanceAdminService } from '../src/services/admin/financeAdminService';
import { LedgerEngine } from '../src/services/finance/ledgerEngine';
import { SignatureService } from '../src/services/finance/signatureService';

describe('Module 1: The Financial Engine (Bursar Dashboard & Reconciliation)', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
  });

  describe('1. Integer Kobo Precision & Monetary Integrity', () => {
    it('enforces strictly integer Kobo amounts and rejects floating-point amounts', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      // Attempting to set fee or reconcile with floating-point kobo should throw
      await expect(
        service.setFeePrice({
          categoryId: 'cat-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountKobo: 50000.75, // Fractional Kobo
        })
      ).rejects.toThrow(/strictly integers in Kobo/);
    });

    it('rejects negative monetary amounts in Kobo', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      await expect(
        service.setFeePrice({
          categoryId: 'cat-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountKobo: -1000,
        })
      ).rejects.toThrow(/cannot be negative/);
    });
  });

  describe('2. Verification Scenario: Reconcile NGN 50,000 Bank Transfer to Student', () => {
    it('reconciles a mock NGN 50,000 bank transfer to student "COEKA/2026/NCE/084", dropping balance from NGN 150,000 to NGN 100,000 in D1', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      // Ensure seed invoices and transactions
      await service.ensureSeedInvoicesAndTransactions();

      // Setup exact initial state for verification:
      // Student: COEKA/2026/NCE/084 (std-sample-001)
      // Invoice with NGN 150,000 (15,000,000 Kobo) due, 0 paid
      const invoiceId = 'inv-test-verify-150k';
      const studentId = 'std-001'; // Matric: COEKA/2026/NCE/084
      const amountDueKobo = 15000000; // ₦150,000.00
      const initialPaidKobo = 0; // ₦0.00

      await container.db.execute(
        `INSERT OR REPLACE INTO student_invoices 
         (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status, created_at)
         VALUES (?, ?, 'sched-nce-100-tui', 'INV-2026-COEKA-VERIFY-150K', ?, ?, 'UNPAID', strftime('%s', 'now'))`,
        [invoiceId, studentId, amountDueKobo, initialPaidKobo]
      );

      // Verify initial balance is NGN 150,000
      const initialInvoice = await container.db.queryFirst<any>(
        `SELECT * FROM student_invoices WHERE id = ?`,
        [invoiceId]
      );
      expect(initialInvoice).toBeDefined();
      expect(initialInvoice.amount_due_kobo).toBe(15000000);
      expect(initialInvoice.amount_paid_kobo).toBe(0);
      const initialBalanceKobo = initialInvoice.amount_due_kobo - initialInvoice.amount_paid_kobo;
      expect(initialBalanceKobo).toBe(15000000); // ₦150,000.00
      expect(LedgerEngine.koboToNaira(initialBalanceKobo)).toContain('150,000.00');

      // Create incoming mock bank transfer of NGN 50,000 (5,000,000 Kobo)
      const txnId = 'txn-bank-mock-50k';
      const transferAmountKobo = 5000000; // ₦50,000.00
      await container.db.execute(
        `INSERT OR REPLACE INTO payment_transactions
         (id, transaction_reference, bank_reference, payment_channel, amount_kobo, net_amount_kobo, status, payer_name, created_at)
         VALUES (?, 'TXN-BANK-COEKA-50K-VERIFY', 'FBN-VOUCHER-987654', 'BANK_TRANSFER', ?, ?, 'PENDING', 'CHIEF MOSES IORLIAM', strftime('%s', 'now'))`,
        [txnId, transferAmountKobo, transferAmountKobo]
      );

      // Execute Reconciliation: Match transaction to student matriculation number
      const reconciliationResult = await service.reconcilePayment({
        transactionId: txnId,
        studentId: 'COEKA/2026/NCE/084',
        invoiceId: invoiceId,
        amountKobo: transferAmountKobo,
        staffId: 'usr-bur-001',
        notes: 'Verified against First Bank teller voucher #987654',
      });

      expect(reconciliationResult.success).toBe(true);
      expect(reconciliationResult.message).toContain('COEKA/2026/NCE/084');

      // VERIFY D1 DATABASE BALANCE:
      // Invoice amount_paid_kobo must now be 5,000,000 Kobo (NGN 50,000)
      // Remaining debt balance must now be 10,000,000 Kobo (NGN 100,000)
      const updatedInvoice = await container.db.queryFirst<any>(
        `SELECT * FROM student_invoices WHERE id = ?`,
        [invoiceId]
      );
      expect(updatedInvoice.amount_paid_kobo).toBe(5000000);
      const remainingBalanceKobo = updatedInvoice.amount_due_kobo - updatedInvoice.amount_paid_kobo;
      expect(remainingBalanceKobo).toBe(10000000); // ₦100,000.00 drops from ₦150,000 to ₦100,000
      expect(LedgerEngine.koboToNaira(remainingBalanceKobo)).toContain('100,000.00');
      expect(updatedInvoice.status).toBe('PARTIALLY_PAID');

      // Verify transaction updated to RECONCILED in D1
      const updatedTxn = await container.db.queryFirst<any>(
        `SELECT * FROM payment_transactions WHERE id = ?`,
        [txnId]
      );
      expect(updatedTxn.status).toBe('RECONCILED');
      expect(updatedTxn.student_id).toBe(studentId);
      expect(updatedTxn.invoice_id).toBe(invoiceId);
      expect(updatedTxn.reconciled_by_staff_id).toBe('usr-bur-001');

      // Verify signed official receipt was issued with cryptographic verification hash
      expect(reconciliationResult.receipt).toBeDefined();
      expect(reconciliationResult.receipt.receiptNumber).toMatch(/^COEKA\/REC\/2026\/\d+/);
      expect(reconciliationResult.receipt.formattedAmountPaid).toContain('50,000.00');
      expect(reconciliationResult.receipt.formattedBalanceRemaining).toContain('100,000.00');
      expect(reconciliationResult.receipt.verificationHash).toBeDefined();
      expect(reconciliationResult.receipt.verificationHash.length).toBe(64); // SHA-256

      // Verify tamper-proof hash matches payload
      const receiptInDb = await container.db.queryFirst<any>(
        `SELECT * FROM payment_receipts WHERE transaction_id = ?`,
        [txnId]
      );
      expect(receiptInDb).toBeDefined();
      expect(receiptInDb.verification_hash).toBe(reconciliationResult.receipt.verificationHash);
    });
  });

  describe('3. Revenue Report Aggregation by Division & Level', () => {
    it('accurately computes total expected, collected, outstanding debt, and collection rate %', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      const report = await service.getRevenueReport();

      expect(report.summary).toBeDefined();
      expect(report.summary.totalExpectedKobo).toBeGreaterThan(0);
      expect(report.summary.totalCollectedKobo).toBeGreaterThan(0);
      expect(report.summary.totalOutstandingKobo).toBe(
        report.summary.totalExpectedKobo - report.summary.totalCollectedKobo
      );
      expect(report.summary.collectionRate).toBeGreaterThanOrEqual(0);
      expect(report.summary.collectionRate).toBeLessThanOrEqual(100);

      // Breakdown by division contains NCE, Degree, etc.
      expect(report.breakdown.length).toBeGreaterThan(0);
      const nceBreakdown = report.breakdown.find((b) => b.divisionName.includes('NCE'));
      expect(nceBreakdown).toBeDefined();
      expect(nceBreakdown?.level).toBe(100);

      // Multi-rail channel breakdowns
      expect(report.byChannel.length).toBeGreaterThan(0);
    });
  });

  describe('4. Debtor List Generation & Alerts', () => {
    it('retrieves students with outstanding balances > 0 and supports filtering', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      const debtors = await service.getDebtorList();
      expect(debtors.length).toBeGreaterThan(0);

      // All returned debtors must have outstanding debt
      for (const d of debtors) {
        expect(d.outstandingDebtKobo).toBeGreaterThan(0);
        expect(d.totalBilledKobo).toBeGreaterThan(d.totalPaidKobo);
        expect(d.matricNumber).toBeDefined();
        expect(d.fullName).toBeDefined();
      }

      // Filter by search
      const searched = await service.getDebtorList({ search: 'Moses' });
      expect(searched.length).toBeGreaterThan(0);
      expect(searched[0].fullName).toContain('Moses');
    });

    it('successfully dispatches and logs official debt clearance alert in D1', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      const alert = await service.sendDebtAlert({
        studentId: 'std-001',
        severity: 'EXAM_BARRED',
        notes: 'Outstanding fee balance; hall pass barred until reconciliation.',
      });

      expect(alert.id).toBeDefined();
      expect(alert.severity).toBe('EXAM_BARRED');
      expect(alert.isResolved).toBe(false);

      // Confirm logged in debt_alerts table
      const inDb = await container.db.queryFirst<any>(
        `SELECT * FROM debt_alerts WHERE id = ?`,
        [alert.id]
      );
      expect(inDb).toBeDefined();
      expect(inDb.severity).toBe('EXAM_BARRED');
    });
  });

  describe('5. Bursar API Routes & Security Protection', () => {
    it('allows BURSAR role to access /api/bursar/revenue', async () => {
      const res = await app.request('/api/bursar/revenue', {
        headers: {
          'X-Demo-Role': 'BURSAR',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.report).toBeDefined();
      expect(json.report.summary.formattedTotalCollected).toBeDefined();
    });

    it('allows SUPER_ADMIN role to access /api/bursar/debtors', async () => {
      const res = await app.request('/api/bursar/debtors', {
        headers: {
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.debtors).toBeDefined();
      expect(json.totalCount).toBeGreaterThan(0);
    });

    it('denies unauthenticated requests from accessing /api/bursar/* with 401', async () => {
      const res = await app.request('/api/bursar/revenue');
      expect(res.status).toBe(401);
    });

    it('denies STUDENT role from accessing /api/bursar/revenue with 403 Forbidden', async () => {
      const res = await app.request('/api/bursar/revenue', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('allows BURSAR to reconcile payment via POST /api/bursar/reconcile', async () => {
      // First ensure seed
      const container = getContainer();
      const service = new FinanceAdminService(container.db);
      await service.ensureSeedInvoicesAndTransactions();

      const txn = await container.db.queryFirst<any>(
        `SELECT * FROM payment_transactions WHERE status = 'PENDING' LIMIT 1`
      );
      expect(txn).toBeDefined();

      const res = await app.request('/api/bursar/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'BURSAR',
        },
        body: JSON.stringify({
          transactionId: txn.id,
          studentId: 'COEKA/2026/NCE/084',
          notes: 'Reconciled via Bursary API route',
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.receipt).toBeDefined();
      expect(json.receipt.receiptNumber).toBeDefined();
    });
  });
});
