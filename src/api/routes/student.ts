import { Hono } from 'hono';
import { Env } from '../../types/env';
import { requireAuth, requireRole } from '../middleware/rbac';
import { getContainer } from '../../infrastructure/container';
import { FinanceService } from '../../services/finance/financeService';
import { LedgerEngine } from '../../services/finance/ledgerEngine';
import { PaymentFailoverRouter } from '../../services/finance/paymentFailoverRouter';
import { SignatureService } from '../../services/finance/signatureService';
import { CourseRegistrationEngine, CourseToRegister } from '../../services/students/courseRegistrationEngine';
import { AcademicService } from '../../services/academic/academicService';

export const studentRoutes = new Hono<{ Bindings: Env }>();

// Only enrolled students can access student dashboard endpoints
studentRoutes.use('*', requireAuth, requireRole(['STUDENT']));

// 1. Student Academic Profile
studentRoutes.get('/profile', async (c) => {
  const user = c.get('user');
  return c.json({
    student: {
      userId: user?.userId || 'usr-std-001',
      matricNumber: user?.username === 'std_iorliam' ? 'COEKA/2026/NCE/084' : `COEKA/2026/${user?.username?.toUpperCase() || 'NCE/084'}`,
      fullName: user?.fullName || 'Aondoaver Moses Iorliam',
      division: user?.division || 'NCE',
      programme: 'NCE Computer Science / Mathematics',
      level: 100,
      gender: 'MALE',
      academicStatus: 'ACTIVE',
      role: user?.role || 'STUDENT',
      passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      digitalIdVerificationUrl: 'https://portal.coekatsinaala.edu.ng/verify/id/COEKA-2026-NCE-084',
    },
  });
});

// 2. Available Courses for Registration
studentRoutes.get('/courses/available', async (c) => {
  const courses: CourseToRegister[] = [
    { courseId: 'c1', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2 },
    { courseId: 'c2', code: 'CSC 112', title: 'Problem Solving & BASIC Programming', creditUnits: 3 },
    { courseId: 'c3', code: 'MTH 111', title: 'Algebra and Trigonometry', creditUnits: 3 },
    { courseId: 'c4', code: 'MTH 112', title: 'Basic Calculus', creditUnits: 3 },
    { courseId: 'c5', code: 'EDU 111', title: 'Introduction to Foundations of Education', creditUnits: 2 },
    { courseId: 'c6', code: 'EDU 112', title: 'Educational Psychology', creditUnits: 2 },
    { courseId: 'c7', code: 'GSE 111', title: 'General English I', creditUnits: 2 },
  ];

  return c.json({
    courses,
    minCreditUnits: 15,
    maxCreditUnits: 24,
  });
});

// 3. Register Courses
studentRoutes.post('/courses/register', async (c) => {
  const body = await c.req.json();
  const { selectedCourses, hasPaidSchoolFees } = body;

  const validation = CourseRegistrationEngine.validateRegistration({
    hasPaidSchoolFees: hasPaidSchoolFees ?? true,
    selectedCourses: selectedCourses || [],
    passedCourseIds: new Set<string>(['c0']),
    minCreditLoad: 15,
    maxCreditLoad: 24,
  });

  if (!validation.isValid) {
    return c.json({
      error: 'Registration validation failed',
      errors: validation.errors,
    }, 422);
  }

  return c.json({
    message: 'Course registration completed successfully',
    registeredCourses: selectedCourses,
    totalCreditUnits: (selectedCourses || []).reduce((sum: number, c: any) => sum + (c.creditUnits || 0), 0),
  });
});

// 4. Student Invoices
studentRoutes.get('/invoices', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);
  const invoices = await financeService.getInvoices(user?.userId || 'std-sample-001');

  return c.json({ invoices });
});

// 5. Virtual Bank Account
studentRoutes.get('/virtual-account', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);
  const virtualAccount = await financeService.getVirtualAccount({
    studentId: user?.userId || 'std-sample-001',
    matricNumber: user?.username === 'std_iorliam' ? 'COEKA/2026/NCE/084' : 'COEKA/2026/NCE/084',
    studentName: user?.fullName || 'Aondoaver Moses Iorliam',
    phoneNumber: '08064377594',
  });

  return c.json({
    virtualAccount,
    instructions: 'Make a direct bank transfer from any Nigerian banking app or USSD into this dedicated account. Your payment will be reconciled in under 3 seconds.',
  });
});

// 6. Pay Invoice
studentRoutes.post('/invoices/:id/pay', async (c) => {
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

// 7. Get Official Fee Receipt
studentRoutes.get('/invoices/:id/receipt', async (c) => {
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

// 8. Student Published Semester Results (Visibility Gated: DRAFT results withheld)
studentRoutes.get('/results', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const studentIdentifier = user?.userId || 'std-001';

  const publishedResults = await service.getStudentPublishedResults(studentIdentifier);

  return c.json({
    studentId: studentIdentifier,
    hasPublishedResults: publishedResults.length > 0,
    resultsCount: publishedResults.length,
    results: publishedResults,
    message: publishedResults.length > 0
      ? 'Official published semester grades.'
      : 'No published results available yet. Results in DRAFT status are withheld until formal release by course lecturers.',
  });
});

