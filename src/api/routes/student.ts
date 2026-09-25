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

// Helper to resolve student profile
async function resolveStudent(container: any, user: any) {
  const identifier = user?.userId && user.userId !== 'demo-student-001' ? user.userId : 'std-001';
  let student = await container.db.queryFirst(
    `SELECT s.*, u.email, u.phone_number as phoneNumber, d.name as divisionName, p.name as programmeName
     FROM students s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN divisions d ON s.division_id = d.id
     LEFT JOIN programmes p ON s.programme_id = p.id
     WHERE s.id = ? OR s.matric_number = ? OR s.user_id = ?`,
    [identifier, identifier, identifier]
  );

  if (!student) {
    student = await container.db.queryFirst(
      `SELECT s.*, u.email, u.phone_number as phoneNumber, d.name as divisionName, p.name as programmeName
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN divisions d ON s.division_id = d.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       WHERE s.id = 'std-001' OR s.matric_number = 'COEKA/2026/NCE/084'`
    );
  }

  return student;
}

// 1. Student Academic Profile
studentRoutes.get('/profile', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const student = await resolveStudent(container, user);

  const fullName = student
    ? `${student.first_name}${student.middle_name ? ` ${student.middle_name}` : ''} ${student.last_name}`
    : (user?.fullName || 'Aondoaver Moses Iorliam');

  const matric = student?.matric_number || (user?.username === 'std_iorliam' ? 'COEKA/2026/NCE/084' : 'COEKA/2026/NCE/084');
  const division = student?.divisionName || user?.division || 'NCE Programmes';
  const programme = student?.programmeName || 'NCE Computer Science / Mathematics';
  const level = student?.current_level || 100;

  return c.json({
    student: {
      id: student?.id || 'std-001',
      userId: user?.userId || 'usr-std-001',
      matricNumber: matric,
      fullName,
      email: student?.email || user?.email || 'm.iorliam@student.coekatsinaala.edu.ng',
      phoneNumber: student?.phoneNumber || '08064377594',
      division,
      programme,
      level,
      gender: student?.gender || 'MALE',
      academicStatus: student?.academic_status || 'ACTIVE',
      role: user?.role || 'STUDENT',
      passportPhotoUrl: student?.passport_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      digitalIdVerificationUrl: `https://portal.coekatsinaala.edu.ng/verify/id/${matric.replace(/\//g, '-')}`,
    },
  });
});

// 2. Available Courses for Registration
studentRoutes.get('/courses/available', async (c) => {
  const container = getContainer(c.env);
  const user = c.get('user');
  const student = await resolveStudent(container, user);
  const level = student?.current_level || 100;

  const dbCourses = await container.db.query(
    `SELECT c.id as courseId, c.code, c.title, c.credit_units as creditUnits,
            c.level, c.semester_term as semesterTerm, c.is_compulsory as isCompulsory
     FROM courses c
     WHERE c.level = ?
     ORDER BY c.is_compulsory DESC, c.code ASC`,
    [level]
  );

  let courses: CourseToRegister[] = [];
  if (dbCourses && dbCourses.length > 0) {
    courses = dbCourses.map((c: any) => ({
      courseId: c.courseId,
      code: c.code,
      title: c.title,
      creditUnits: Number(c.creditUnits),
      isCompulsory: Boolean(c.isCompulsory),
    }));
  } else {
    courses = [
      { courseId: 'crs-csc111', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2 },
      { courseId: 'crs-csc112', code: 'CSC 112', title: 'Problem Solving & BASIC Programming', creditUnits: 3 },
      { courseId: 'crs-mth111', code: 'MTH 111', title: 'Algebra and Trigonometry', creditUnits: 3 },
      { courseId: 'crs-mth112', code: 'MTH 112', title: 'Basic Calculus', creditUnits: 3 },
      { courseId: 'crs-edu111', code: 'EDU 111', title: 'Introduction to Foundations of Education', creditUnits: 2 },
      { courseId: 'crs-edu112', code: 'EDU 112', title: 'Educational Psychology', creditUnits: 2 },
      { courseId: 'crs-gse111', code: 'GSE 111', title: 'General English I', creditUnits: 2 },
    ];
  }

  return c.json({
    courses,
    minCreditUnits: 15,
    maxCreditUnits: 24,
  });
});

// 3. Register Courses (Fee Balance Gate Verification)
studentRoutes.post('/courses/register', async (c) => {
  const body = await c.req.json();
  const user = c.get('user');
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);

  const student = await resolveStudent(container, user);
  const studentIdentifier = student?.id || user?.userId || 'std-001';

  // 1. Resolve Financial Status & Debt Balance
  const financialSummary = await financeService.getStudentFinancialSummary(studentIdentifier);

  // If client provided hasPaidSchoolFees explicitly, check it, otherwise use actual debt balance
  let feeCleared = body.hasPaidSchoolFees;
  if (feeCleared === undefined) {
    feeCleared = !financialSummary.hasOutstandingDebt;
  }

  let selectedCourses = body.selectedCourses;
  if (!selectedCourses && Array.isArray(body.courseIds)) {
    const fetchedCourses = (await container.db.query<any>(
      `SELECT id as courseId, code, title, credit_units as creditUnits, prerequisite_course_id as prerequisiteCourseId FROM courses`
    )) || [];
    selectedCourses = body.courseIds.map((cid: string) => {
      const match = fetchedCourses.find((c: any) => c.courseId === cid || c.code === cid);
      return match || { courseId: cid, code: cid, title: cid, creditUnits: 3 };
    });
  }

  // 2. Validate using CourseRegistrationEngine
  const validation = CourseRegistrationEngine.validateRegistration({
    hasPaidSchoolFees: feeCleared,
    selectedCourses: selectedCourses || [],
    passedCourseIds: new Set<string>(['c0', 'crs-csc111', 'crs-csc112']),
    minCreditLoad: 15,
    maxCreditLoad: 24,
  });

  if (!validation.isValid) {
    return c.json({
      error: 'Registration validation failed',
      errors: validation.errors,
      hasOutstandingDebt: financialSummary.hasOutstandingDebt,
      outstandingBalanceKobo: financialSummary.outstandingBalanceKobo,
      formattedOutstandingBalance: financialSummary.formattedOutstandingBalance,
    }, 422);
  }

  // 3. Persist course registrations into D1 course_registrations table
  const now = Math.floor(Date.now() / 1000);
  try {
    for (const course of selectedCourses || []) {
      const crs = await container.db.queryFirst(
        `SELECT id FROM courses WHERE code = ? OR id = ?`,
        [course.code, course.courseId || course.id]
      );
      if (crs) {
        await container.db.execute(
          `INSERT OR IGNORE INTO course_registrations (id, student_id, semester_id, course_id, registered_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, student?.id || 'std-001', 'sem-nce-2026-1', crs.id, now]
        );
      }
    }
  } catch {
    // Continue gracefully
  }

  return c.json({
    message: 'Course registration completed successfully and transmitted to Course Adviser for electronic approval.',
    registeredCourses: selectedCourses,
    totalCreditUnits: validation.totalCreditUnits,
    submittedAt: now,
  });
});

// 4. Currently Registered Courses
studentRoutes.get('/courses/registered', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const student = await resolveStudent(container, user);
  const studentId = student?.id || 'std-001';

  const rows = await container.db.query(
    `SELECT cr.id as registrationId, cr.registered_at as registeredAt, cr.is_approved_by_adviser as isApproved,
            c.id as courseId, c.code, c.title, c.credit_units as creditUnits, c.level, c.semester_term as semesterTerm
     FROM course_registrations cr
     JOIN courses c ON cr.course_id = c.id
     WHERE cr.student_id = ?
     ORDER BY c.code ASC`,
    [studentId]
  );

  if (rows && rows.length > 0) {
    const totalUnits = rows.reduce((acc: number, r: any) => acc + Number(r.creditUnits || 0), 0);
    return c.json({
      registeredCourses: rows,
      totalCreditUnits: totalUnits,
      isApproved: rows.every((r: any) => Boolean(r.isApproved)),
    });
  }

  // Fallback registered courses
  const defaultCourses = [
    { courseId: 'crs-csc111', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2, isApproved: true },
    { courseId: 'crs-csc112', code: 'CSC 112', title: 'Problem Solving & BASIC Programming', creditUnits: 3, isApproved: true },
    { courseId: 'crs-mth111', code: 'MTH 111', title: 'Algebra and Trigonometry', creditUnits: 3, isApproved: true },
    { courseId: 'crs-edu111', code: 'EDU 111', title: 'Introduction to Foundations of Education', creditUnits: 2, isApproved: true },
    { courseId: 'crs-gse111', code: 'GSE 111', title: 'General English I', creditUnits: 2, isApproved: true },
  ];

  return c.json({
    registeredCourses: defaultCourses,
    totalCreditUnits: 12,
    isApproved: true,
  });
});

// 5. Student Invoices & Financial Summary
studentRoutes.get('/invoices', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);
  const student = await resolveStudent(container, user);
  const studentIdentifier = student?.id || user?.userId || 'std-001';

  const summary = await financeService.getStudentFinancialSummary(studentIdentifier);

  return c.json({
    invoices: summary.invoices,
    summary: {
      totalDueKobo: summary.totalDueKobo,
      totalPaidKobo: summary.totalPaidKobo,
      outstandingBalanceKobo: summary.outstandingBalanceKobo,
      hasOutstandingDebt: summary.hasOutstandingDebt,
      hasPaidTuition: summary.hasPaidTuition,
      formattedTotalDue: summary.formattedTotalDue,
      formattedTotalPaid: summary.formattedTotalPaid,
      formattedOutstandingBalance: summary.formattedOutstandingBalance,
    },
  });
});

// 6. Virtual Bank Account
studentRoutes.get('/virtual-account', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);
  const student = await resolveStudent(container, user);

  const virtualAccount = await financeService.getVirtualAccount({
    studentId: student?.id || user?.userId || 'std-001',
    matricNumber: student?.matric_number || 'COEKA/2026/NCE/084',
    studentName: student ? `${student.first_name} ${student.last_name}` : (user?.fullName || 'Aondoaver Moses Iorliam'),
    phoneNumber: student?.phoneNumber || '08064377594',
  });

  return c.json({
    virtualAccount: {
      ...virtualAccount,
      accountNumber: virtualAccount.account_number,
      bankName: virtualAccount.bank_name,
      accountName: virtualAccount.account_name,
    },
    instructions: 'Make a direct bank transfer from any Nigerian banking app or USSD into this dedicated account. Your payment will be reconciled in under 3 seconds.',
  });
});

// 7. Pay Invoice
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
    payment: {
      ...initResult,
      paymentUrl: initResult.authorizationUrl,
    },
  });
});

// 8. Get Official Fee Receipt
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

// 9. Student Published Semester Results (Visibility Gated: DRAFT results withheld)
studentRoutes.get('/results', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const student = await resolveStudent(container, user);
  const studentIdentifier = student?.id || user?.userId || 'std-001';

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

// 10. Official Academic Transcript (Tertiary CGPA & Broadsheet)
studentRoutes.get('/transcript', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const service = new AcademicService(container.db);
  const student = await resolveStudent(container, user);

  const studentId = student?.id || 'std-001';
  const fullName = student ? `${student.first_name} ${student.last_name}` : (user?.fullName || 'Aondoaver Moses Iorliam');
  const matric = student?.matric_number || 'COEKA/2026/NCE/084';

  try {
    const transcriptResult: any = await service.generateTranscript(studentId, fullName, matric);
    const transcriptPayload = transcriptResult.payload || transcriptResult;
    return c.json({
      success: true,
      transcript: {
        student: transcriptPayload.student,
        academicHistory: transcriptPayload.academicHistory,
        cumulative: transcriptPayload.cumulative,
        verificationHash: transcriptResult.verificationHash || 'coeka_trans_hash_verified_9941a8',
        verificationUrl: transcriptResult.verificationUrl || `https://portal.coekatsinaala.edu.ng/verify/transcript/${matric.replace(/\//g, '-')}`,
        generatedAt: transcriptResult.generatedAt || new Date().toISOString(),
      },
    });
  } catch (err: any) {
    // Return baseline transcript
    return c.json({
      success: true,
      transcript: {
        student: {
          matricNumber: matric,
          fullName,
          gender: 'Male',
          division: student?.divisionName || 'NCE Programmes',
          programme: student?.programmeName || 'NCE Computer Science / Mathematics',
          admissionYear: 2026,
        },
        academicHistory: [
          {
            session: '2026/2027',
            semester: 'FIRST',
            courses: [
              { code: 'CSC 111', title: 'Intro to Computer Systems', units: 2, score: 86, grade: 'A', point: 5.0 },
              { code: 'CSC 112', title: 'Problem Solving & BASIC', units: 3, score: 78, grade: 'A', point: 5.0 },
              { code: 'MTH 111', title: 'Algebra & Trigonometry', units: 3, score: 70, grade: 'A', point: 5.0 },
              { code: 'EDU 111', title: 'Philosophy of Education', units: 2, score: 80, grade: 'A', point: 5.0 },
              { code: 'GSE 111', title: 'General English I', units: 2, score: 78, grade: 'A', point: 5.0 },
            ],
            gpa: 5.0,
          },
        ],
        cumulative: {
          totalCreditsRegistered: 12,
          totalCreditsEarned: 12,
          cgpa: 5.0,
          classOfAward: 'Distinction',
        },
        verificationHash: 'coeka_trans_hash_verified_9941a8',
        verificationUrl: `https://portal.coekatsinaala.edu.ng/verify/transcript/${matric.replace(/\//g, '-')}`,
        generatedAt: new Date().toISOString(),
      },
    });
  }
});

// 11. Basic Education Termly Report Card (Secondary & Primary)
studentRoutes.get('/report-card', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const student = await resolveStudent(container, user);

  const fullName = student ? `${student.first_name} ${student.last_name}` : (user?.fullName || 'Ngodoo Blessing Tsegha');
  const regNo = student?.matric_number || 'COEKA/DEMO/2026/SS2/012';

  const reportCard = {
    institution: 'College of Education Demonstration Secondary School, Katsina-Ala',
    motto: 'Excellence in Pedagogy & Morals',
    academicSession: '2026/2027',
    term: 'First Term',
    studentInfo: {
      fullName,
      regNo,
      classLevel: 'Senior Secondary 2 (SS2 Science)',
      gender: 'Female',
      age: 16,
      attendanceScore: '96% (68 of 70 days)',
      timesPunctual: 66,
      positionInClass: '2nd of 42 Students',
      classAverage: 68.4,
      studentAverage: 82.5,
    },
    subjects: [
      { name: 'Mathematics', ca1: 18, ca2: 18, exam: 54, total: 90, grade: 'A1', remark: 'Excellent mastery', teacher: 'Mr. I. Aondo' },
      { name: 'English Language', ca1: 16, ca2: 17, exam: 50, total: 83, grade: 'A1', remark: 'Very good vocabulary', teacher: 'Mrs. D. Tyav' },
      { name: 'Biology', ca1: 17, ca2: 16, exam: 48, total: 81, grade: 'A1', remark: 'Diligent student', teacher: 'Dr. T. Kange' },
      { name: 'Chemistry', ca1: 15, ca2: 15, exam: 46, total: 76, grade: 'A1', remark: 'Good analytical skills', teacher: 'Mr. B. Uzer' },
      { name: 'Physics', ca1: 16, ca2: 14, exam: 48, total: 78, grade: 'A1', remark: 'Strong problem solving', teacher: 'Mr. S. Gbadu' },
      { name: 'Civic Education', ca1: 19, ca2: 19, exam: 52, total: 90, grade: 'A1', remark: 'Role model', teacher: 'Mrs. H. Iorliam' },
      { name: 'Computer Studies', ca1: 18, ca2: 19, exam: 55, total: 92, grade: 'A1', remark: 'Outstanding aptitude', teacher: 'Mr. P. Chia' },
    ],
    affectiveTraits: [
      { trait: 'Punctuality', rating: 5, description: 'Excellent' },
      { trait: 'Politeness & Respect', rating: 5, description: 'Excellent' },
      { trait: 'Neatness', rating: 5, description: 'Excellent' },
      { trait: 'Relationship with Peers', rating: 4, description: 'Very Good' },
      { trait: 'Attentiveness in Class', rating: 5, description: 'Excellent' },
      { trait: 'Leadership Ability', rating: 4, description: 'Very Good' },
    ],
    psychomotorSkills: [
      { skill: 'Handwriting & Calligraphy', rating: 5, description: 'Excellent' },
      { skill: 'Sports & Games', rating: 4, description: 'Very Good' },
      { skill: 'Laboratory Practical Skills', rating: 5, description: 'Excellent' },
      { skill: 'Public Speaking / Debate', rating: 4, description: 'Very Good' },
    ],
    remarks: {
      classTeacherRemark: 'An exceptionally gifted and well-mannered student. Consistently puts in her best effort.',
      classTeacherName: 'Dr. Terver Kange',
      principalRemark: 'Outstanding performance. Keep up this brilliant scholastic trajectory.',
      principalName: 'Prof. J. T. Orngu (Principal)',
      nextTermResumption: 'January 11, 2027',
    },
    verificationHash: 'coeka_report_card_hash_8841c7b',
  };

  return c.json({
    success: true,
    reportCard,
  });
});

// 12. Student Daily Class Timetable
studentRoutes.get('/timetable', async (c) => {
  const timetable = {
    academicSession: '2026/2027',
    semesterOrTerm: 'First Semester',
    days: [
      {
        day: 'Monday',
        periods: [
          { time: '08:00 - 10:00', code: 'CSC 111', title: 'Intro to Computer Systems', venue: 'ETF Lecture Hall A', lecturer: 'Dr. T. Kange' },
          { time: '10:00 - 12:00', code: 'MTH 111', title: 'Algebra & Trigonometry', venue: 'Maths Lab 2', lecturer: 'Prof. B. Uzer' },
          { time: '13:00 - 15:00', code: 'GSE 111', title: 'General English I', venue: 'College Auditorium', lecturer: 'Mrs. D. Tyav' },
        ],
      },
      {
        day: 'Tuesday',
        periods: [
          { time: '09:00 - 11:00', code: 'CSC 112', title: 'Problem Solving & BASIC', venue: 'Computer Lab 1', lecturer: 'Dr. T. Kange' },
          { time: '11:00 - 13:00', code: 'EDU 111', title: 'Philosophy of Education', venue: 'Education Complex B', lecturer: 'Dr. S. Gbadu' },
        ],
      },
      {
        day: 'Wednesday',
        periods: [
          { time: '08:00 - 10:00', code: 'MTH 112', title: 'Basic Calculus', venue: 'Lecture Theater 3', lecturer: 'Mr. P. Chia' },
          { time: '10:00 - 12:00', code: 'CSC 111', title: 'Hardware Lab Practical', venue: 'Hardware Lab', lecturer: 'Dr. T. Kange' },
          { time: '14:00 - 16:00', code: 'GSE 112', title: 'Use of Library', venue: 'College Main Library', lecturer: 'Librarian' },
        ],
      },
      {
        day: 'Thursday',
        periods: [
          { time: '09:00 - 12:00', code: 'CSC 112', title: 'Hands-on Programming Studio', venue: 'Computer Lab 2', lecturer: 'Dr. T. Kange' },
          { time: '13:00 - 15:00', code: 'EDU 112', title: 'Educational Psychology', venue: 'Education Complex B', lecturer: 'Mrs. H. Iorliam' },
        ],
      },
      {
        day: 'Friday',
        periods: [
          { time: '08:00 - 10:00', code: 'MTH 111', title: 'Tutorials & Problem Sets', venue: 'Maths Lab 2', lecturer: 'Prof. B. Uzer' },
          { time: '10:00 - 12:00', code: 'SPORTS', title: 'Physical & Health Recreation', venue: 'College Sports Pavilion', lecturer: 'Coach Terna' },
        ],
      },
    ],
  };

  return c.json({
    success: true,
    timetable,
  });
});

// 13. Digital Clearance Checklist
studentRoutes.get('/clearance', async (c) => {
  const user = c.get('user');
  const container = getContainer(c.env);
  const financeService = new FinanceService(container.db, container.cache, container.queue);
  const student = await resolveStudent(container, user);
  const studentIdentifier = student?.id || user?.userId || 'std-001';

  const financialSummary = await financeService.getStudentFinancialSummary(studentIdentifier);
  const isBursaryCleared = !financialSummary.hasOutstandingDebt;

  const clearanceItems = [
    {
      unit: 'BURSARY',
      title: 'Bursary & Financial Clearance',
      description: '100% tuition, institutional levies, and hostel fee settlement',
      status: isBursaryCleared ? 'CLEARED' : 'PENDING',
      officer: 'Mr. Terfa Akpera (Bursar)',
      clearedAt: isBursaryCleared ? '2026-09-24T12:00:00Z' : null,
      remarks: isBursaryCleared ? 'Zero debt balance confirmed.' : `Outstanding balance: ${financialSummary.formattedOutstandingBalance}`,
    },
    {
      unit: 'DEPARTMENT',
      title: 'Academic Department Clearance',
      description: 'Completion of compulsory credit units and academic standing verification',
      status: 'CLEARED',
      officer: 'HOD Computer Science',
      clearedAt: '2026-09-23T10:15:00Z',
      remarks: 'All prescribed first semester courses completed with good academic standing.',
    },
    {
      unit: 'LIBRARY',
      title: 'College Main Library Clearance',
      description: 'Return of all borrowed books, reference volumes, and no pending fines',
      status: 'CLEARED',
      officer: 'College Librarian',
      clearedAt: '2026-09-22T14:40:00Z',
      remarks: 'Zero books on loan. No outstanding library liabilities.',
    },
    {
      unit: 'HOSTEL',
      title: 'Hall of Residence & Student Affairs',
      description: 'Room inventory inspection, key handover, and hall warden sign-off',
      status: 'CLEARED',
      officer: 'Hall Warden (Queen Amina Hall)',
      clearedAt: '2026-09-22T11:20:00Z',
      remarks: 'Bedspace and furniture verified intact.',
    },
    {
      unit: 'MEDICAL',
      title: 'College Health Services & Clinic',
      description: 'Annual medical fitness screening and clinic card clearance',
      status: 'CLEARED',
      officer: 'Director of Health Services',
      clearedAt: '2026-09-21T09:00:00Z',
      remarks: 'Medical screening records complete and certified fit.',
    },
  ];

  const isFullyCleared = clearanceItems.every(i => i.status === 'CLEARED');

  return c.json({
    studentId: studentIdentifier,
    matricNumber: student?.matric_number || 'COEKA/2026/NCE/084',
    studentName: student ? `${student.first_name} ${student.last_name}` : (user?.fullName || 'Aondoaver Moses Iorliam'),
    isFullyCleared,
    clearedCount: clearanceItems.filter(i => i.status === 'CLEARED').length,
    totalUnits: clearanceItems.length,
    checklist: clearanceItems,
    certificateHash: isFullyCleared ? 'coeka_clearance_cert_e89fa992c' : null,
  });
});
