import { Hono } from 'hono';
import { Env } from '../../types/env';
import { LedgerEngine } from '../../services/finance/ledgerEngine';
import { VirtualAccountService } from '../../services/finance/virtualAccountService';
import { PaymentFailoverRouter } from '../../services/finance/paymentFailoverRouter';
import { SignatureService } from '../../services/finance/signatureService';

export const financeRoutes = new Hono<{ Bindings: Env }>();

// 1. Get Student Invoices
financeRoutes.get('/invoices', async (c) => {
  const sampleInvoices = [
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

  return c.json({
    invoices: sampleInvoices.map(inv => ({
      ...inv,
      formattedDue: LedgerEngine.koboToNaira(inv.amountDueKobo),
      formattedPaid: LedgerEngine.koboToNaira(inv.amountPaidKobo),
    })),
  });
});

// 2. Get Dedicated Virtual Bank Account for Instant Transfer
financeRoutes.get('/virtual-account', async (c) => {
  const studentId = 'std-sample-001';
  const virtualAccount = await VirtualAccountService.createDedicatedAccount({
    studentId,
    matricNumber: 'COEKA/2026/NCE/084',
    studentName: 'Aondoaver Moses Iorliam',
    phoneNumber: '08064377594',
  }, 'VPAY');

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
