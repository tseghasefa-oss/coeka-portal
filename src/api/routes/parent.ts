import { Hono } from 'hono';
import { Env } from '../../types/env';
import { requireAuth, requireRole } from '../middleware/rbac';
import { getContainer } from '../../infrastructure/container';
import { ParentService, MultiChildPaymentItem } from '../../services/parent/parentService';

export const parentRoutes = new Hono<{ Bindings: Env }>();

// Only parents can access parent dashboard endpoints
parentRoutes.use('*', requireAuth, requireRole(['PARENT']));

// 1. Parent Wards Telemetry
parentRoutes.get('/wards', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const parentService = new ParentService(container.db, container.cache, container.queue);

  const identifier = user?.userId && user.userId !== 'demo-parent-001' ? user.userId : 'prt-001';
  const data = await parentService.getParentWithWards(identifier);

  return c.json(data);
});

// 2. Ward Academic Performance Dossier (Grades, Attendance, Progress)
parentRoutes.get('/wards/:id/performance', async (c) => {
  const childId = c.req.param('id');
  const user = c.get('user');
  const container = getContainer(c.env);
  const parentService = new ParentService(container.db, container.cache, container.queue);

  const identifier = user?.userId && user.userId !== 'demo-parent-001' ? user.userId : 'prt-001';

  // Strict RBAC: Verify that the parent owns this ward
  const isAuthorized = await parentService.verifyWardOwnership(identifier, childId);
  if (!isAuthorized && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return c.json({
      error: 'Forbidden: You do not have guardian authorization to access records for this ward.',
      childId,
    }, 403);
  }

  const performance = await parentService.getChildPerformance(childId);
  return c.json({
    success: true,
    performance,
  });
});

// 3. Ward Financial Invoices & Dedicated Bank Account
parentRoutes.get('/wards/:id/invoices', async (c) => {
  const childId = c.req.param('id');
  const user = c.get('user');
  const container = getContainer(c.env);
  const parentService = new ParentService(container.db, container.cache, container.queue);

  const identifier = user?.userId && user.userId !== 'demo-parent-001' ? user.userId : 'prt-001';

  // Strict RBAC
  const isAuthorized = await parentService.verifyWardOwnership(identifier, childId);
  if (!isAuthorized && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return c.json({
      error: 'Forbidden: You do not have guardian authorization to view invoices for this ward.',
      childId,
    }, 403);
  }

  const invoiceData = await parentService.getChildInvoices(childId);
  return c.json({
    success: true,
    ...invoiceData,
  });
});

// 4. Ward Terminal Report Card (Secondary & Primary)
parentRoutes.get('/wards/:id/report-card', async (c) => {
  const wardId = c.req.param('id');
  const user = c.get('user');
  const container = getContainer(c.env);
  const parentService = new ParentService(container.db, container.cache, container.queue);

  const identifier = user?.userId && user.userId !== 'demo-parent-001' ? user.userId : 'prt-001';
  const isAuthorized = await parentService.verifyWardOwnership(identifier, wardId);
  if (!isAuthorized && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return c.json({
      error: 'Forbidden: You do not have guardian authorization to access this report card.',
      wardId,
    }, 403);
  }

  if (wardId === 'std-002' || wardId === 'COEKA/DSS/2024/042') {
    return c.json({
      division: 'SECONDARY',
      school: 'COEKA Demonstration Secondary School',
      studentName: 'Ngodoo Blessing Tsegha',
      class: 'SS2 Science Track',
      term: 'Third Term • 2025/2026',
      subjects: [
        { subject: 'English Language', ca1: 18, ca2: 17, exam: 48, total: 83, grade: 'A1', remark: 'Excellent' },
        { subject: 'Mathematics', ca1: 16, ca2: 18, exam: 46, total: 80, grade: 'A1', remark: 'Excellent' },
        { subject: 'Biology', ca1: 15, ca2: 16, exam: 44, total: 75, grade: 'A1', remark: 'Distinction' },
        { subject: 'Chemistry', ca1: 14, ca2: 15, exam: 42, total: 71, grade: 'B2', remark: 'Very Good' },
        { subject: 'Physics', ca1: 15, ca2: 15, exam: 40, total: 70, grade: 'B2', remark: 'Very Good' },
      ],
      psychomotor: {
        punctuality: 5,
        neatness: 5,
        leadership: 4,
        attentiveness: 5,
      },
      classTeacherRemark: 'An exceptionally brilliant and disciplined student. Keep it up!',
      principalSign: 'VERIFIED',
    });
  }

  return c.json({
    message: 'Report card loaded',
    wardId,
  });
});

// 5. Consolidated Multi-Child Fee Payment Checkout
parentRoutes.post('/pay', async (c) => {
  const body = await c.req.json();
  const user = c.get('user');
  const container = getContainer(c.env);
  const parentService = new ParentService(container.db, container.cache, container.queue);

  const identifier = user?.userId && user.userId !== 'demo-parent-001' ? user.userId : 'prt-001';

  // Normalize single child vs multi-child payment payload
  let paymentItems: MultiChildPaymentItem[] = [];

  if (Array.isArray(body.items) && body.items.length > 0) {
    paymentItems = body.items;
  } else if (body.childId && body.amountKobo) {
    paymentItems = [
      {
        childId: body.childId,
        childName: body.childName || 'Ward',
        invoiceId: body.invoiceId || `inv-${body.childId}`,
        feeTitle: body.feeTitle || 'Institutional Tuition & Levies',
        amountKobo: Number(body.amountKobo),
      },
    ];
  } else {
    // Default demo cart item if no specific items provided
    paymentItems = [
      {
        childId: 'std-001',
        childName: 'Aondoaver Moses Iorliam',
        invoiceId: 'inv-001',
        feeTitle: '2026/2027 NCE Tuition & Consolidated Institutional Fees',
        amountKobo: 4500000,
      },
    ];
  }

  // Strict RBAC: Verify parent ownership of all requested children
  for (const item of paymentItems) {
    const isOwned = await parentService.verifyWardOwnership(identifier, item.childId);
    if (!isOwned && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
      return c.json({
        error: `Forbidden: You do not have guardian authorization to settle fees for child '${item.childId}'.`,
        unauthorizedChildId: item.childId,
      }, 403);
    }
  }

  try {
    const result = await parentService.payConsolidated({
      parentId: identifier,
      parentName: user?.fullName || 'Mr. Joshua T. Tsegha',
      parentEmail: (user as any)?.email || 'j.tsegha@gmail.com',
      items: paymentItems,
      gateway: body.gateway || 'PAYSTACK',
      config: {
        paystackSecret: c.env?.PAYSTACK_SECRET_KEY,
        remitaMerchantId: c.env?.REMITA_MERCHANT_ID,
        vpayApiKey: c.env?.VPAY_API_KEY,
      },
    });

    return c.json({
      success: true,
      message: 'Consolidated payment session initialized successfully.',
      payment: result,
    });
  } catch (err: any) {
    return c.json({
      error: err.message || 'Payment initialization failed',
    }, 400);
  }
});
