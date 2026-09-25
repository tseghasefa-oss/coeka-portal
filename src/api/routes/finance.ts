import { Hono } from 'hono';
import { Env } from '../../types/env';
import { LedgerEngine } from '../../services/finance/ledgerEngine';
import { PaymentFailoverRouter } from '../../services/finance/paymentFailoverRouter';
import { SignatureService } from '../../services/finance/signatureService';
import { FinanceService } from '../../services/finance/financeService';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole } from '../middleware/rbac';

export const financeRoutes = new Hono<{ Bindings: Env }>();

// Only Bursar and Super Admin can access institutional finance operations
financeRoutes.use('*', requireAuth, requireRole(['BURSAR', 'SUPER_ADMIN']));

// 0. Bursary Summary & Financial Health
financeRoutes.get('/summary', async (c) => {
  return c.json({
    summary: {
      totalCollectedKobo: 34500000000,
      totalCollectedFormatted: '₦345,000,000.00',
      outstandingLeviesKobo: 12500000000,
      outstandingLeviesFormatted: '₦125,000,000.00',
      activeSession: '2026/2027',
      reconciledInvoicesCount: 4210,
      pendingInvoicesCount: 840,
    },
  });
});

// 0b. Gateway Reconciliation & Settlements
financeRoutes.get('/reconciliation', async (c) => {
  return c.json({
    reconciliation: [
      { gateway: 'PAYSTACK', totalSettledKobo: 18000000000, totalSettledFormatted: '₦180,000,000.00', feeCount: 2200, status: 'RECONCILED' },
      { gateway: 'VPAY', totalSettledKobo: 12000000000, totalSettledFormatted: '₦120,000,000.00', feeCount: 1510, status: 'RECONCILED' },
      { gateway: 'REMITA', totalSettledKobo: 4500000000, totalSettledFormatted: '₦45,000,000.00', feeCount: 500, status: 'RECONCILED' },
    ],
  });
});

// 1. Get Student Invoices
financeRoutes.get('/invoices', async (c) => {
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);
  const invoices = await financeService.getInvoices('std-sample-001');

  return c.json({ invoices });
});

// 2. Get Dedicated Virtual Bank Account for Instant Transfer
financeRoutes.get('/virtual-account', async (c) => {
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);
  const virtualAccount = await financeService.getVirtualAccount({
    studentId: 'std-sample-001',
    matricNumber: 'COEKA/2026/NCE/084',
    studentName: 'Aondoaver Moses Iorliam',
    phoneNumber: '08064377594',
  });

  return c.json({
    virtualAccount,
    instructions: 'Make a direct bank transfer from any Nigerian banking app or USSD into this dedicated account. Your payment will be reconciled and credited to your portal invoice in under 3 seconds.',
  });
});

// 3. Initialize Online Payment (Paystack / Remita / Interswitch)
financeRoutes.post('/invoices/:id/pay', async (c) => {
  const invoiceId = c.req.param('id');
  const body = await c.req.json();
  const gateway = body.gateway || 'PAYSTACK';

  const amountKobo = 4500000;
  const surcharge = LedgerEngine.calculateTotalPayableKobo(amountKobo, gateway, false);

  const initResult = await PaymentFailoverRouter.initializePayment({
    invoiceId,
    invoiceNumber: `INV-${invoiceId}`,
    studentName: 'Aondoaver Moses Iorliam',
    email: 'student@coekatsinaala.edu.ng',
    amountKobo: surcharge.totalPayableKobo,
    description: 'COEKA 2026/2027 Session Fee Payment',
    preferredGateway: gateway,
    callbackUrl: 'https://portal.coekatsinaala.edu.ng/finance/callback',
  }, {
    paystackSecret: c.env?.PAYSTACK_SECRET_KEY,
    remitaMerchantId: c.env?.REMITA_MERCHANT_ID,
    vpayApiKey: c.env?.VPAY_API_KEY,
  });

  return c.json({
    message: 'Payment initialized',
    surcharge: {
      feeAmountFormatted: LedgerEngine.koboToNaira(surcharge.feeAmountKobo),
      gatewayChargeFormatted: LedgerEngine.koboToNaira(surcharge.gatewayChargeKobo),
      totalPayableFormatted: LedgerEngine.koboToNaira(surcharge.totalPayableKobo),
    },
    payment: initResult,
  });
});

// 4. Generate Official Fee Receipt
financeRoutes.get('/invoices/:id/receipt', async (c) => {
  const invoiceId = c.req.param('id');
  const receiptPayload = {
    receiptNumber: `REC-COEKA-${Date.now().toString().slice(-6)}`,
    invoiceNumber: `INV-2026-COEKA-${invoiceId}`,
    matricNumber: 'COEKA/2026/NCE/084',
    studentName: 'Aondoaver Moses Iorliam',
    programme: 'NCE Computer Science / Mathematics',
    amountPaidKobo: 4500000,
    amountPaidFormatted: LedgerEngine.koboToNaira(4500000),
    paymentChannel: 'VPay Virtual Account Auto-Transfer',
    dateIssued: new Date().toISOString(),
  };

  const verificationHash = await SignatureService.generateVerificationHash(JSON.stringify(receiptPayload));

  return c.json({
    receipt: receiptPayload,
    verification: {
      hash: verificationHash,
      verificationUrl: `https://portal.coekatsinaala.edu.ng/verify/receipt/${verificationHash}`,
    },
  });
});
