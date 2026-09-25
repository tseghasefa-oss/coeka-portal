import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { getContainer } from '../src/infrastructure/container';
import { BulkUploadService } from '../src/services/admissions/bulkUploadService';
import { PrerequisiteChecker } from '../src/services/academic/prerequisiteChecker';
import { PromotionService } from '../src/services/academic/promotionService';
import { SessionBillingService } from '../src/services/finance/sessionBillingService';

describe('Module 5: Student Lifecycle & Onboarding Verification Suite', () => {
  let container: ReturnType<typeof getContainer>;
  let bulkUploadService: BulkUploadService;
  let prerequisiteChecker: PrerequisiteChecker;
  let promotionService: PromotionService;
  let sessionBillingService: SessionBillingService;

  beforeEach(async () => {
    container = getContainer();
    bulkUploadService = new BulkUploadService(container.db, container.cache);
    prerequisiteChecker = new PrerequisiteChecker(container.db);
    promotionService = new PromotionService(container.db);
    sessionBillingService = new SessionBillingService(container.db, container.cache);

    // Seed courses for prerequisite testing
    await container.db.execute(
      `INSERT OR IGNORE INTO courses (id, programme_id, code, title, credit_units, level, semester_term, is_compulsory)
       VALUES ('crs-csc111', 'prog-nce-csc-mth', 'CSC 111', 'Introduction to Computer Systems', 3, 100, 1, 1)`
    );
    await container.db.execute(
      `INSERT OR IGNORE INTO courses (id, programme_id, code, title, credit_units, level, semester_term, is_compulsory, prerequisite_course_id)
       VALUES ('crs-csc201', 'prog-nce-csc-mth', 'CSC 201', 'Object-Oriented Programming', 3, 200, 1, 1, 'crs-csc111')`
    );
  });

  // =========================================================================
  // 1. Bulk CSV Admissions & Account Provisioning
  // =========================================================================
  describe('Bulk Admissions Service (CSV Parsing & Provisioning)', () => {
    it('correctly parses raw CSV data into structured applicant records', () => {
      const csv = `firstName,lastName,phone,email,programmeCode,divisionCode,jambRegNumber
Doofan,Akiga,08031234567,doofan.akiga@example.com,prog-nce-csc-mth,NCE,20261011AB
Terna,Iorliam,08098765432,terna.iorliam@example.com,prog-bed-edu-mgt,DEGREE,20261022CD`;

      const applicants = BulkUploadService.parseCSV(csv);
      expect(applicants.length).toBe(2);
      expect(applicants[0].firstName).toBe('Doofan');
      expect(applicants[0].lastName).toBe('Akiga');
      expect(applicants[0].divisionCode).toBe('NCE');
      expect(applicants[1].divisionCode).toBe('DEGREE');
    });

    it('provisions student accounts, matriculation numbers, and acceptance fee invoices in database', async () => {
      const applicants = [
        {
          firstName: 'Aondoaver',
          lastName: 'Mnguember',
          phone: '08198761234',
          email: 'aondoaver.mng@coekatsinaala.edu.ng',
          programmeCode: 'prog-nce-csc-mth',
          divisionCode: 'NCE',
          jambRegNumber: '20261055JAMB',
        },
      ];

      const result = await bulkUploadService.processBulkAdmissions(applicants, 2026);

      expect(result.createdCount).toBe(1);
      expect(result.createdStudents[0].matricNumber).toContain('COEKA/2026/NCE/');
      expect(result.createdStudents[0].acceptanceFeeKobo).toBe(1500000); // ₦15,000.00 in Kobo

      // Verify row exists in students table
      const studentRow = await container.db.queryFirst<any>(
        'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = ?',
        ['aondoaver.mng@coekatsinaala.edu.ng']
      );
      expect(studentRow).not.toBeNull();
      expect(studentRow.academic_status).toBe('ACTIVE');
      expect(studentRow.current_level).toBe(100);

      // Verify user credentials created
      const userRow = await container.db.queryFirst<any>(
        'SELECT * FROM users WHERE email = ?',
        ['aondoaver.mng@coekatsinaala.edu.ng']
      );
      expect(userRow).not.toBeNull();
      expect(userRow.user_type).toBe('STUDENT');

      // Verify acceptance fee invoice exists
      const invoiceRow = await container.db.queryFirst<any>(
        'SELECT * FROM student_invoices WHERE student_id = ?',
        [studentRow.id]
      );
      expect(invoiceRow).not.toBeNull();
      expect(invoiceRow.fee_schedule_id).toBe('sched-nce-accept');
      expect(invoiceRow.amount_due_kobo).toBe(1500000);
      expect(invoiceRow.status).toBe('UNPAID');
    });
  });

  // =========================================================================
  // 2. Prerequisite Checker & Carry-over Flagging
  // =========================================================================
  describe('PrerequisiteChecker & Carry-over Detection', () => {
    it('detects carry-over courses for students with failing marks (Grade F / <40)', async () => {
      // Seed a failed course in grade_entries
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries (id, student_id, course_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-fail-1', 'std-001', 'crs-csc111', 'sess-2026-2027', 10, 5, 20, 35, 'F', 0, 'PUBLISHED')`
      );

      const carryOvers = await prerequisiteChecker.identifyCarryOvers('std-001');
      expect(carryOvers.length).toBeGreaterThan(0);
      const failed = carryOvers.find((c) => c.courseId === 'crs-csc111');
      expect(failed).toBeDefined();
      expect(failed?.letterGrade).toBe('F');
    });

    it('blocks registration for advanced course if prerequisite course was failed or not taken', async () => {
      // Attempt to register CSC 201 which requires CSC 111 (which was failed above)
      const eligibility = await prerequisiteChecker.checkPrerequisiteEligibility(
        'std-001',
        'crs-csc201',
        'crs-csc111'
      );

      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reason).toContain('Failed prerequisite');
    });
  });

  // =========================================================================
  // 3. Year-End Student Progression (PromotionService)
  // =========================================================================
  describe('PromotionService (Level 100 -> Level 200, CGPA Cut-off, Probation)', () => {
    it('promotes student from 100L to 200L if CGPA >= 1.00', async () => {
      // Seed student with 100L and passing grades
      await container.db.execute(
        `INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type, is_active)
         VALUES ('usr-promo-1', 'tersoo_aka', 'tersoo@coekatsinaala.edu.ng', '08199990001', 'hash', 'STUDENT', 1)`
      );

      await container.db.execute(
        `INSERT OR IGNORE INTO students (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
         VALUES ('std-promo-1', 'usr-promo-1', 'div-nce', 'prog-nce-csc-mth', 100, 'COEKA/2026/NCE/991', 2026, 'Tersoo', 'Aka', 'MALE', '2004-01-01', 'Benue', 'Katsina-Ala', 'Campus', 'https://photo.url', 'SIG', 'ACTIVE')`
      );

      // Add passing grade: 5.00 Grade Point (Grade A)
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries (id, student_id, course_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-pass-1', 'std-promo-1', 'crs-csc111', 'sess-2026-2027', 20, 15, 45, 80, 'A', 5, 'PUBLISHED')`
      );

      const evaluation = await promotionService.evaluateStudentPromotion('std-promo-1');

      expect(evaluation.status).toBe('PROMOTED');
      expect(evaluation.previousLevel).toBe(100);
      expect(evaluation.newLevel).toBe(200);
      expect(evaluation.cgpa).toBeGreaterThanOrEqual(1.0);
    });

    it('places student on Academic Probation if CGPA is below 1.00 cut-off', async () => {
      await container.db.execute(
        `INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type, is_active)
         VALUES ('usr-promo-low', 'mngunengen', 'uzer@coekatsinaala.edu.ng', '08199990002', 'hash', 'STUDENT', 1)`
      );

      await container.db.execute(
        `INSERT OR IGNORE INTO students (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
         VALUES ('std-promo-low', 'usr-promo-low', 'div-nce', 'prog-nce-csc-mth', 100, 'COEKA/2026/NCE/992', 2026, 'Mngunengen', 'Uzer', 'FEMALE', '2004-01-01', 'Benue', 'Katsina-Ala', 'Campus', 'https://photo.url', 'SIG', 'ACTIVE')`
      );

      // Add failing grades resulting in 0 CGPA
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries (id, student_id, course_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-low-1', 'std-promo-low', 'crs-csc111', 'sess-2026-2027', 5, 5, 20, 30, 'F', 0, 'PUBLISHED')`
      );

      const evaluation = await promotionService.evaluateStudentPromotion('std-promo-low');

      expect(evaluation.status).toBe('PROBATION');
      expect(evaluation.newLevel).toBe(100); // Remains in level 100
      expect(evaluation.cgpa).toBeLessThan(1.0);
    });

    it('batch promotes all eligible students across division', async () => {
      const batchResult = await promotionService.promoteAllEligibleStudents({ fromLevel: 100 });

      expect(batchResult.totalEvaluated).toBeGreaterThan(0);
      expect(batchResult.promotedCount).toBeGreaterThanOrEqual(1);

      // Verify DB update
      const updatedStudent = await container.db.queryFirst<any>(
        'SELECT current_level, academic_status FROM students WHERE id = ?',
        ['std-promo-1']
      );
      expect(updatedStudent.current_level).toBe(200);
      expect(updatedStudent.academic_status).toBe('ACTIVE');
    });
  });

  // =========================================================================
  // 4. Financial Reset: Apply New Session Fee Matrix
  // =========================================================================
  describe('SessionBillingService (New Session Fee Matrix & Tariff Reset)', () => {
    it('applies statutory fee matrix and creates new session invoices with strict Kobo integer', async () => {
      const result = await sessionBillingService.applySessionFeeMatrix({
        newSession: '2027/2028',
      });

      expect(result.session).toBe('2027/2028');
      expect(result.totalInvoicesCreated).toBeGreaterThan(0);
      expect(result.totalBilledKobo).toBeGreaterThan(0);
      expect(result.formattedTotalBilled).toContain('₦');

      // Verify invoice in database
      const firstInv = result.invoicesSummary[0];
      const invRow = await container.db.queryFirst<any>(
        'SELECT * FROM student_invoices WHERE id = ?',
        [`inv-20272028-${firstInv.studentId}`]
      );
      expect(invRow).not.toBeNull();
      expect(invRow.amount_due_kobo).toBe(firstInv.amountKobo);
      expect(invRow.status).toBe('UNPAID');
    });
  });

  // =========================================================================
  // 5. Complete End-to-End Lifecycle Verification (Prompt 5 Target Flow)
  // Upload CSV -> Student Logins -> Completes Bio-data -> Pays Acceptance Fee -> Registers Courses
  // =========================================================================
  describe('Full End-to-End Student Lifecycle Flow', () => {
    it('executes full pipeline: CSV Provision -> Biodata -> Passport -> Acceptance Fee -> Course Registration', async () => {
      // Step A: Admin uploads CSV batch
      const testApplicantEmail = 'lifecycle.student2@coekatsinaala.edu.ng';
      const csvPayload = `firstName,lastName,phone,email,programmeCode,divisionCode,jambRegNumber
Sefat,Tsegha,08091122334,${testApplicantEmail},prog-nce-csc-mth,NCE,20261199JAMB`;

      const uploadRes = await app.request('/api/admissions/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvPayload, admissionYear: 2026 }),
      });

      expect(uploadRes.status).toBe(200);
      const uploadJson = await uploadRes.json<any>();
      expect(uploadJson.success).toBe(true);
      expect(uploadJson.summary.createdCount).toBe(1);

      const provisionedMatric = uploadJson.summary.createdStudents[0].matricNumber;
      const provisionedStudentId = uploadJson.summary.createdStudents[0].studentId;
      expect(provisionedMatric).toBeDefined();

      // Step B: Student checks onboarding status (initially PROVISIONAL)
      const initialStatusRes = await app.request(
        `/api/admissions/onboard/status/${provisionedStudentId}`
      );
      expect(initialStatusRes.status).toBe(200);
      const initialStatus = await initialStatusRes.json<any>();
      expect(initialStatus.checklist.accountCreated).toBe(true);
      expect(initialStatus.checklist.biodataSubmitted).toBe(false);
      expect(initialStatus.checklist.acceptanceFeeSettled).toBe(false);

      // Step C: Student enters Bio-Data
      const biodataRes = await app.request('/api/admissions/onboard/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: provisionedStudentId,
          dateOfBirth: '2004-03-22',
          gender: 'MALE',
          stateOfOrigin: 'Benue',
          lgaOfOrigin: 'Katsina-Ala',
          bloodGroup: 'O+',
          contactAddress: 'No 5 College Crescent, Katsina-Ala',
        }),
      });
      expect(biodataRes.status).toBe(200);

      // Step D: Student uploads biometric passport photo (Cloudflare R2 Object Storage)
      const passportRes = await app.request('/api/admissions/onboard/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: provisionedStudentId,
          imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
          filename: 'passport_sefat.jpg',
        }),
      });
      expect(passportRes.status).toBe(200);
      const passportJson = await passportRes.json<any>();
      expect(passportJson.photoUrl).toBeDefined();

      // Step E: Student pays Acceptance Fee
      const payAcceptanceRes = await app.request('/api/admissions/onboard/pay-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: provisionedStudentId,
          gateway: 'VPAY',
        }),
      });
      expect(payAcceptanceRes.status).toBe(200);
      const payJson = await payAcceptanceRes.json<any>();
      expect(payJson.success).toBe(true);
      expect(payJson.courseRegistrationUnlocked).toBe(true);

      // Step F: Verify Onboarding Checklist is now fully complete & ACTIVE
      const finalStatusRes = await app.request(
        `/api/admissions/onboard/status/${provisionedStudentId}`
      );
      const finalStatus = await finalStatusRes.json<any>();
      expect(finalStatus.academicStatus).toBe('ACTIVE');
      expect(finalStatus.checklist.biodataSubmitted).toBe(true);
      expect(finalStatus.checklist.passportUploaded).toBe(true);
      expect(finalStatus.checklist.acceptanceFeeSettled).toBe(true);
      expect(finalStatus.isFullyOnboarded).toBe(true);

      // Step G: Student registers courses now that acceptance fee is settled
      const regRes = await app.request('/api/student/courses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({
          selectedCourses: [
            { courseId: 'crs-csc111', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 3 },
            { courseId: 'crs-csc112', code: 'CSC 112', title: 'Introduction to Basic Programming', creditUnits: 3 },
            { courseId: 'crs-mth111', code: 'MTH 111', title: 'Algebra & Trigonometry', creditUnits: 3 },
            { courseId: 'crs-edu111', code: 'EDU 111', title: 'Introduction to Teaching Profession', creditUnits: 3 },
            { courseId: 'crs-gse111', code: 'GSE 111', title: 'General English I', creditUnits: 3 },
          ],
          hasPaidSchoolFees: true,
          semesterId: 'sem-2026-1',
        }),
      });

      expect(regRes.status).toBe(200);
      const regJson = await regRes.json<any>();
      expect(regJson.message).toContain('completed successfully');
      expect(regJson.registeredCourses.length).toBe(5);
    });
  });

  // =========================================================================
  // 6. Admin Endpoints: Stats, Batch Promotion, Billing Reset
  // =========================================================================
  describe('Admin Endpoints for Admissions & Lifecycle', () => {
    it('GET /api/admin/admissions/stats returns telemetry overview', async () => {
      const res = await app.request('/api/admin/admissions/stats', {
        headers: {
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const stats = await res.json<any>();
      expect(stats.totalAdmitted).toBeDefined();
      expect(stats.completionPercentage).toBeDefined();
      expect(Array.isArray(stats.students)).toBe(true);
    });

    it('POST /api/admin/session/promote batch-progresses students via REST', async () => {
      const res = await app.request('/api/admin/session/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          fromLevel: 100,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json<any>();
      expect(json.success).toBe(true);
      expect(json.result.promotions).toBeDefined();
    });

    it('POST /api/admin/session/billing-reset applies new session fee matrix via REST', async () => {
      const res = await app.request('/api/admin/session/billing-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          newSession: '2027/2028',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json<any>();
      expect(json.success).toBe(true);
      expect(json.result.session).toBe('2027/2028');
      expect(json.result.totalInvoicesCreated).toBeGreaterThan(0);
    });
  });
});
