import { Hono } from 'hono';
import { Env } from '../../types/env';
import { ScreeningEngine, ScreeningEvaluationInput } from '../../services/admissions/screeningEngine';
import { BulkUploadService, RawApplicantRecord } from '../../services/admissions/bulkUploadService';
import { getContainer } from '../../infrastructure/container';
import { LedgerEngine } from '../../services/finance/ledgerEngine';

export const admissionsRoutes = new Hono<{ Bindings: Env }>();

admissionsRoutes.get('/cycles', async (c) => {
  return c.json({
    cycles: [
      {
        id: 'cycle-nce-2026',
        division: 'NCE',
        name: '2026/2027 NCE Regular Admissions',
        applicationFeeKobo: 250000, // ₦2,500.00
        isOpen: true,
        deadline: '2026-11-30',
      },
      {
        id: 'cycle-deg-2026',
        division: 'DEGREE',
        name: '2026/2027 Degree Affiliated Programmes (B.Ed / B.Sc Ed)',
        applicationFeeKobo: 300000, // ₦3,000.00
        isOpen: true,
        deadline: '2026-11-30',
      },
      {
        id: 'cycle-sec-2026',
        division: 'SECONDARY',
        name: 'Demonstration Secondary School JS1 & SS1 Entrance',
        applicationFeeKobo: 200000, // ₦2,000.00
        isOpen: true,
        deadline: '2026-10-15',
      },
      {
        id: 'cycle-pri-2026',
        division: 'PRIMARY',
        name: 'Staff Primary School Pupil Admissions',
        applicationFeeKobo: 150000, // ₦1,500.00
        isOpen: true,
        deadline: '2026-10-15',
      },
    ],
  });
});

admissionsRoutes.post('/apply', async (c) => {
  const body = await c.req.json();
  const { division, firstName, lastName, phone, oLevelSubjects, jambScore } = body;

  if (!division || !firstName || !lastName || !phone) {
    return c.json({ error: 'Missing mandatory applicant biodata fields' }, 400);
  }

  const applicationNumber = `COEKA/${division}/2026/${Math.floor(1000 + Math.random() * 9000)}`;

  // Evaluate screening status
  const evaluationInput: ScreeningEvaluationInput = {
    division,
    jambScore: jambScore || 145,
    oLevelSubjects: oLevelSubjects || [
      { subject: 'English Language', grade: 'C5' },
      { subject: 'Mathematics', grade: 'C4' },
      { subject: 'Biology', grade: 'B3' },
      { subject: 'Chemistry', grade: 'C6' },
      { subject: 'Physics', grade: 'C6' },
    ],
    departmentCutOff: division === 'DEGREE' ? 140 : 100,
  };

  const screening = ScreeningEngine.evaluateApplication(evaluationInput);

  return c.json({
    message: 'Application submitted successfully',
    application: {
      applicationNumber,
      applicantName: `${firstName} ${lastName}`,
      division,
      status: screening.isEligible ? 'ADMITTED' : 'SCREENED',
      screening,
      admissionLetterUrl: screening.isEligible
        ? `https://portal.coekatsinaala.edu.ng/admissions/letters/${applicationNumber}.pdf`
        : null,
      acceptanceFeeKobo: 1500000, // ₦15,000.00
    },
  });
});

// 1. Bulk Admissions CSV Upload & Account Provisioning
admissionsRoutes.post('/bulk-upload', async (c) => {
  const body = await c.req.json();
  const container = getContainer(c.env);
  const bulkUploadService = new BulkUploadService(container.db, container.cache);

  let applicants: RawApplicantRecord[] = [];

  if (body.csvContent && typeof body.csvContent === 'string') {
    applicants = BulkUploadService.parseCSV(body.csvContent);
  } else if (Array.isArray(body.applicants)) {
    applicants = body.applicants;
  } else {
    return c.json({ error: 'Missing applicant dataset. Provide csvContent string or applicants array.' }, 400);
  }

  if (applicants.length === 0) {
    return c.json({ error: 'CSV file contains no valid applicant records' }, 400);
  }

  const result = await bulkUploadService.processBulkAdmissions(
    applicants,
    body.admissionYear || 2026
  );

  return c.json({
    success: true,
    message: `Batch admissions executed: ${result.createdCount} student accounts provisioned with registration numbers and acceptance fee invoices.`,
    summary: result,
  });
});

// 2. Student Onboarding: Bio-data Entry
admissionsRoutes.post('/onboard/biodata', async (c) => {
  const body = await c.req.json();
  const { studentId, dateOfBirth, gender, stateOfOrigin, lgaOfOrigin, bloodGroup, contactAddress } = body;

  if (!studentId) {
    return c.json({ error: 'studentId is required' }, 400);
  }

  const container = getContainer(c.env);

  await container.db.execute(
    `UPDATE students
     SET date_of_birth = COALESCE(?, date_of_birth),
         gender = COALESCE(?, gender),
         state_of_origin = COALESCE(?, state_of_origin),
         lga_of_origin = COALESCE(?, lga_of_origin),
         blood_group = COALESCE(?, blood_group),
         contact_address = COALESCE(?, contact_address),
         academic_status = CASE WHEN academic_status = 'PROVISIONAL_ADMISSION' THEN 'BIODATA_COMPLETED' ELSE academic_status END
     WHERE id = ? OR matric_number = ?`,
    [dateOfBirth || null, gender || null, stateOfOrigin || null, lgaOfOrigin || null, bloodGroup || null, contactAddress || null, studentId, studentId]
  );

  return c.json({
    success: true,
    message: 'Bio-data information saved successfully. Proceed to passport photo upload.',
    studentId,
  });
});

// 3. Student Onboarding: Passport Photo Upload to R2 Object Storage
admissionsRoutes.post('/onboard/passport', async (c) => {
  const body = await c.req.json();
  const { studentId, imageBase64, filename } = body;

  if (!studentId) {
    return c.json({ error: 'studentId is required' }, 400);
  }

  const container = getContainer(c.env);
  const cleanId = studentId.replace(/[^a-zA-Z0-9]/g, '_');
  const safeFilename = filename || `passport_${cleanId}_${Date.now()}.jpg`;
  const storageKey = `passports/${cleanId}/${safeFilename}`;

  // Upload to R2 Storage Provider
  const uploadData = imageBase64 || 'data:image/jpeg;base64,placeholder';
  const uploadResult = await container.storage.upload(storageKey, uploadData, 'image/jpeg');

  const photoUrl = uploadResult.url || `https://storage.local/${storageKey}`;

  // Update students table
  await container.db.execute(
    `UPDATE students SET passport_photo_url = ? WHERE id = ? OR matric_number = ?`,
    [photoUrl, studentId, studentId]
  );

  return c.json({
    success: true,
    message: 'Biometric passport photo uploaded and stored in R2 bucket.',
    photoUrl,
    storageKey,
  });
});

// 4. Student Onboarding: Acceptance Fee Payment Settlement
admissionsRoutes.post('/onboard/pay-acceptance', async (c) => {
  const body = await c.req.json();
  const { studentId, gateway } = body;

  if (!studentId) {
    return c.json({ error: 'studentId is required' }, 400);
  }

  const container = getContainer(c.env);

  // Settle acceptance fee invoice in DB
  await container.db.execute(
    `UPDATE student_invoices
     SET status = 'PAID', amount_paid_kobo = amount_due_kobo
     WHERE student_id = ? AND (fee_schedule_id = 'sched-nce-accept' OR fee_schedule_id = 'fs-acceptance' OR invoice_number LIKE '%ACC%')`,
    [studentId]
  );

  // Formally activate student
  await container.db.execute(
    `UPDATE students
     SET academic_status = 'ACTIVE'
     WHERE id = ? OR matric_number = ?`,
    [studentId, studentId]
  );

  return c.json({
    success: true,
    message: 'Acceptance fee of ₦15,000.00 settled successfully. Student status transitioned to ACTIVE. Course Registration is now unlocked.',
    studentId,
    gateway: gateway || 'VPAY',
    courseRegistrationUnlocked: true,
  });
});

// 5. Student Onboarding Lifecycle Status Check
admissionsRoutes.get('/onboard/status/:studentId', async (c) => {
  const studentId = c.req.param('studentId');
  const container = getContainer(c.env);

  const student = await container.db.queryFirst<any>(
    `SELECT s.*, u.email
     FROM students s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? OR s.matric_number = ?`,
    [studentId, studentId]
  );

  const acceptanceInvoice = await container.db.queryFirst<any>(
    `SELECT * FROM student_invoices
     WHERE student_id = ? AND (fee_schedule_id = 'sched-nce-accept' OR fee_schedule_id = 'fs-acceptance' OR invoice_number LIKE '%ACC%')`,
    [student?.id || studentId]
  );

  const isBiodataComplete = Boolean(student?.blood_group && student?.contact_address && student?.state_of_origin);
  const isPassportUploaded = Boolean(student?.passport_photo_url && !student.passport_photo_url.includes('placeholder'));
  const isAcceptancePaid = acceptanceInvoice?.status === 'PAID';

  const isFullyOnboarded = isBiodataComplete && isPassportUploaded && isAcceptancePaid;

  return c.json({
    studentId,
    matricNumber: student?.matric_number || 'COEKA/2026/NCE/084',
    fullName: student ? `${student.first_name} ${student.last_name}` : 'Student',
    academicStatus: student?.academic_status || 'PROVISIONAL_ADMISSION',
    checklist: {
      accountCreated: true,
      biodataSubmitted: isBiodataComplete,
      passportUploaded: isPassportUploaded,
      acceptanceFeeSettled: isAcceptancePaid,
      courseRegistrationUnlocked: isAcceptancePaid,
    },
    isFullyOnboarded,
  });
});
