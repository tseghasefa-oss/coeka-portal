import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole } from '../middleware/rbac';
import { FinanceAdminService } from '../../services/admin/financeAdminService';

export const bursarRoutes = new Hono<{ Bindings: Env }>();

// Restrict all Bursar operations to Bursar, Bursary staff, Super Admin, and Admin roles
bursarRoutes.use('*', requireAuth, requireRole(['BURSAR', 'BURSARY', 'SUPER_ADMIN', 'ADMIN']));

/**
 * GET /api/bursar/revenue
 * Aggregates institutional revenue totals, collection rates, and breakdowns by division/level and channel.
 */
bursarRoutes.get('/revenue', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);

  const divisionId = c.req.query('divisionId');
  const sessionId = c.req.query('sessionId');

  try {
    const report = await service.getRevenueReport({ divisionId, sessionId });
    return c.json({ report });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to aggregate revenue report' }, 500);
  }
});

/**
 * GET /api/bursar/debtors
 * Retrieves filtered list of students with outstanding fee balances > 0 Kobo.
 */
bursarRoutes.get('/debtors', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);

  const divisionId = c.req.query('divisionId');
  const levelStr = c.req.query('level');
  const level = levelStr ? parseInt(levelStr, 10) : undefined;
  const minDebtStr = c.req.query('minDebtKobo');
  const minDebtKobo = minDebtStr ? parseInt(minDebtStr, 10) : undefined;
  const search = c.req.query('search') || undefined;

  try {
    const debtors = await service.getDebtorList({ divisionId, level, minDebtKobo, search });
    const totalDebtKobo = debtors.reduce((acc, d) => acc + (d.outstandingDebtKobo || 0), 0);
    return c.json({
      debtors,
      totalCount: debtors.length,
      totalDebtKobo,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to retrieve debtor list' }, 500);
  }
});

/**
 * GET /api/bursar/transactions
 * Lists all bank transfers, POS payments, and online gateway transactions.
 */
bursarRoutes.get('/transactions', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);

  const status = c.req.query('status');
  const paymentChannel = c.req.query('channel');
  const studentId = c.req.query('studentId');
  const search = c.req.query('search');

  try {
    const transactions = await service.listPaymentTransactions({
      status: status || undefined,
      paymentChannel: paymentChannel || undefined,
      studentId: studentId || undefined,
      search: search || undefined,
    });
    return c.json({ transactions });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to retrieve transactions' }, 500);
  }
});

/**
 * POST /api/bursar/reconcile
 * Matches a manual bank transfer or POS transaction to a student's matriculation number/invoice.
 * Updates D1 balance with integer Kobo arithmetic and issues signed tamper-proof receipt.
 */
bursarRoutes.post('/reconcile', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { transactionId, studentId, amountKobo, invoiceId, notes } = body;

    if (!transactionId || !studentId) {
      return c.json({
        error: 'Validation Error: Both transactionId and studentId (ID or matric number) are required for payment reconciliation.',
      }, 400);
    }

    const staffId = user?.userId || 'usr-bur-001';
    const result = await service.reconcilePayment({
      transactionId,
      studentId,
      amountKobo: amountKobo !== undefined ? Number(amountKobo) : undefined,
      invoiceId,
      staffId,
      notes,
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Reconciliation failed' }, 400);
  }
});

/**
 * POST /api/bursar/receipts/issue
 * Explicitly generates an official cryptographic fee receipt for a reconciled transaction.
 */
bursarRoutes.post('/receipts/issue', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return c.json({ error: 'Validation Error: transactionId is required' }, 400);
    }

    const staffId = user?.userId || 'usr-bur-001';
    const receipt = await service.issueOfficialReceipt(transactionId, staffId);
    return c.json({ receipt }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to issue receipt' }, 400);
  }
});

/**
 * GET /api/bursar/receipts/:transactionId
 * Fetches the issued official receipt by transaction ID.
 */
bursarRoutes.get('/receipts/:transactionId', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);
  const transactionId = c.req.param('transactionId');

  try {
    const receipt = await service.issueOfficialReceipt(transactionId);
    return c.json({ receipt });
  } catch (error: any) {
    return c.json({ error: error.message || 'Receipt not found' }, 404);
  }
});

/**
 * POST /api/bursar/debtors/alert
 * Dispatches an institutional debt alert or examination clearance block.
 */
bursarRoutes.post('/debtors/alert', async (c) => {
  const container = getContainer(c.env);
  const service = new FinanceAdminService(container.db);

  try {
    const body = await c.req.json();
    const { studentId, invoiceId, severity, notes } = body;

    if (!studentId) {
      return c.json({ error: 'Validation Error: studentId is required' }, 400);
    }

    const alert = await service.sendDebtAlert({
      studentId,
      invoiceId,
      severity: severity || 'WARNING',
      notes,
    });

    return c.json({
      message: `Debt alert (${severity || 'WARNING'}) successfully logged and dispatched to student.`,
      alert,
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to dispatch debt alert' }, 400);
  }
});
