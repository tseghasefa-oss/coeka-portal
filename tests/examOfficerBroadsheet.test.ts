import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api';
import { getContainer } from '../src/infrastructure/container';
import { ExamOfficerService } from '../src/services/academic/examService';
import { AcademicService } from '../src/services/academic/academicService';

describe('Module 9: Examination Officer & Broadsheet Hub Suite', () => {
  const container = getContainer();
  const examService = new ExamOfficerService(container.db);
  const academicService = new AcademicService(container.db);

  beforeEach(async () => {
    await academicService.ensureSeedAcademicData();
  });

  describe('1. Broadsheet Compilation & Published Results Isolation (compileBroadsheet)', () => {
    it('CRITICAL RULE: Broadsheet strictly only factors PUBLISHED results; DRAFT results are excluded from GPA/CGPA', async () => {
      const studentId = 'std-test-broadsheet-01';
      const matric = 'COEKA/2026/TEST/001';

      // 1. Create test student
      await container.db.execute(
        `INSERT OR REPLACE INTO students 
         (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
         VALUES 
         (?, 'usr-std-001', 'div-nce', 'prog-nce-csc-mth', 100, ?, 2026, 'Tersoo', 'Aondo', 'MALE', '2005-01-01', 'Benue', 'Katsina-Ala', 'Campus', 'https://photo.url', 'sig', 'ACTIVE')`,
        [studentId, matric]
      );

      // 2. Insert one PUBLISHED grade (CSC 111, 2 units, Score 80 = A, 5.0 points)
      // Quality points = 2 * 5.0 = 10.0
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES 
         ('ge-pub-01', 'crs-csc111', ?, 'sess-2026-2027', 15, 15, 50, 80, 'A', 5.0, 'PUBLISHED')`,
        [studentId]
      );

      // 3. Insert one DRAFT grade (MTH 111, 3 units, Score 30 = F, 0.0 points)
      // If this draft were erroneously factored in, GPA would drop to 10.0 / 5 = 2.00
      // Because it MUST be excluded, TCR should be 2, TQP should be 10.0, and GPA should be 5.00!
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES 
         ('ge-draft-01', 'crs-mth111', ?, 'sess-2026-2027', 10, 5, 15, 30, 'F', 0.0, 'DRAFT')`,
        [studentId]
      );

      const broadsheet = await examService.compileBroadsheet('dept-csc', 100, 'sess-2026-2027');

      expect(broadsheet).toBeDefined();
      expect(broadsheet.departmentName).toContain('Computer Science');
      expect(broadsheet.level).toBe(100);

      // Find our test student in the compiled broadsheet
      const studentRow = broadsheet.students.find((s) => s.studentId === studentId);
      expect(studentRow).toBeDefined();

      // Verify that published result is active
      expect(studentRow!.courses['CSC 111']).toBeDefined();
      expect(studentRow!.courses['CSC 111'].status).toBe('PUBLISHED');
      expect(studentRow!.courses['CSC 111'].letterGrade).toBe('A');

      // Verify that draft result is flagged as PENDING_APPROVAL and excluded from GPA
      expect(studentRow!.courses['MTH 111']).toBeDefined();
      expect(studentRow!.courses['MTH 111'].status).toBe('PENDING_APPROVAL');

      // VERIFICATION OF CORE RULE: TCR = 2, TCE = 2, GPA = 5.00
      expect(studentRow!.totalCreditsRegistered).toBe(2);
      expect(studentRow!.totalCreditsEarned).toBe(2);
      expect(studentRow!.totalQualityPoints).toBe(10.0);
      expect(studentRow!.gpa).toBe(5.0);

      // Verify unpublished draft warnings are flagged at broadsheet level
      expect(broadsheet.summary.unpublishedDraftsCount).toBeGreaterThanOrEqual(1);
    });

    it('persists broadsheet snapshot to database and updates academic_statuses table', async () => {
      const broadsheet = await examService.compileBroadsheet('dept-csc', 100);

      const savedSnapshot = await container.db.queryFirst<any>(
        `SELECT * FROM broadsheets WHERE id = ?`,
        [broadsheet.id]
      );

      expect(savedSnapshot).toBeDefined();
      expect(savedSnapshot.level).toBe(100);
      expect(savedSnapshot.snapshot_json).toContain('CSC 111');

      // Verify academic_statuses has records for students
      const statuses = await container.db.query<any>(
        `SELECT * FROM academic_statuses WHERE level = 100`
      );
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  describe('2. Final CGPA Calculation & Honors Classification (calculateFinalCGPA)', () => {
    it('computes accurate NCE classification and detects graduation eligibility', async () => {
      const studentId = 'std-final-nce-01';

      // Seed student in final year NCE (Level 300)
      await container.db.execute(
        `INSERT OR REPLACE INTO students 
         (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
         VALUES 
         (?, 'usr-std-002', 'div-nce', 'prog-nce-csc-mth', 300, 'COEKA/2023/NCE/088', 2023, 'Kuma', 'Doo', 'FEMALE', '2004-05-12', 'Benue', 'Vandeikya', 'Hostel', 'https://photo.url', 'sig', 'ACTIVE')`,
        [studentId]
      );

      // Seed high published grades (Distinction: CGPA >= 4.50)
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES 
         ('ge-fin-1', 'crs-csc111', ?, 'sess-2026-2027', 18, 18, 52, 88, 'A', 5.0, 'PUBLISHED'),
         ('ge-fin-2', 'crs-csc112', ?, 'sess-2026-2027', 15, 15, 45, 75, 'A', 5.0, 'PUBLISHED')`,
        [studentId, studentId]
      );

      // Seed library clearance
      await container.db.execute(
        `INSERT OR REPLACE INTO library_clearances (id, student_id, status) VALUES ('lib-clr-01', ?, 'CLEARED')`,
        [studentId]
      );

      const audit = await examService.calculateFinalCGPA(studentId);

      expect(audit.studentId).toBe(studentId);
      expect(audit.division).toBe('NCE');
      expect(audit.finalCgpa).toBe(5.0);
      expect(audit.honorsClassification).toBe('Distinction');
      expect(audit.outstandingFailedCourses.length).toBe(0);
      expect(audit.libraryClearance.isCleared).toBe(true);
      expect(audit.overallGraduationStatus).toBe('QUALIFIED');
      expect(audit.isEligibleForGraduation).toBe(true);
    });

    it('blocks graduation if student has outstanding financial debt or library clearance is missing', async () => {
      const studentId = 'std-final-debt-01';

      await container.db.execute(
        `INSERT OR REPLACE INTO students 
         (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
         VALUES 
         (?, 'usr-std-003', 'div-nce', 'prog-nce-csc-mth', 300, 'COEKA/2023/NCE/099', 2023, 'Sesugh', 'Gbande', 'MALE', '2003-08-14', 'Benue', 'Gboko', 'Hostel', 'https://photo.url', 'sig', 'ACTIVE')`,
        [studentId]
      );

      // Passed courses
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES 
         ('ge-fin-debt-1', 'crs-csc111', ?, 'sess-2026-2027', 15, 15, 45, 75, 'A', 5.0, 'PUBLISHED')`,
        [studentId]
      );

      // Create an unpaid student invoice (Debt: ₦25,000.00 = 2500000 kobo)
      await container.db.execute(
        `INSERT OR REPLACE INTO student_invoices 
         (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES 
         ('inv-debt-01', ?, 'sched-nce-100-tui', 'INV-DEBT-001', 2500000, 0, 'UNPAID')`,
        [studentId]
      );

      const audit = await examService.calculateFinalCGPA(studentId);

      expect(audit.finalCgpa).toBe(5.0);
      expect(audit.financialClearance.isCleared).toBe(false);
      expect(audit.financialClearance.outstandingDebtKobo).toBe(2500000);
      expect(audit.overallGraduationStatus).toBe('CLEARANCE_BLOCKED');
      expect(audit.isEligibleForGraduation).toBe(false);
    });
  });

  describe('3. Academic Probation & Formal Warnings (flagProbationStudents & sendProbationWarning)', () => {
    it('flags students with CGPA < 1.50 and dispatches formal warning', async () => {
      const studentId = 'std-prob-01';

      await container.db.execute(
        `INSERT OR REPLACE INTO students 
         (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
         VALUES 
         (?, 'usr-std-001', 'div-nce', 'prog-nce-csc-mth', 100, 'COEKA/2026/NCE/077', 2026, 'Fanen', 'Anongo', 'MALE', '2005-02-02', 'Benue', 'Kwande', 'Campus', 'https://photo.url', 'sig', 'ACTIVE')`,
        [studentId]
      );

      // Create academic status with CGPA = 0.85 (Probation)
      await container.db.execute(
        `INSERT OR REPLACE INTO academic_statuses 
         (id, student_id, session_id, level, gpa, cgpa, total_credits_registered, total_credits_passed, status, carry_over_courses_json, warning_sent)
         VALUES 
         ('ast-test-prob', ?, 'sess-2026-2027', 100, 0.85, 0.85, 12, 4, 'PROBATION', '["CSC 111", "MTH 111"]', 0)`,
        [studentId]
      );

      const probationList = await examService.flagProbationStudents('dept-csc');
      const flagged = probationList.find((p) => p.studentId === studentId);

      expect(flagged).toBeDefined();
      expect(flagged!.cgpa).toBe(0.85);
      expect(flagged!.status).toBe('PROBATION');
      expect(flagged!.warningSent).toBe(false);

      // Dispatch warning
      const warnResult = await examService.sendProbationWarning(studentId, 'usr-admin-001');
      expect(warnResult.success).toBe(true);

      // Verify updated status in DB
      const updatedStatus = await container.db.queryFirst<any>(
        `SELECT * FROM academic_statuses WHERE id = 'ast-test-prob'`
      );
      expect(updatedStatus.warning_sent).toBe(1);
      expect(updatedStatus.warning_sent_at).toBeGreaterThan(0);

      // Verify queued SMS/Email notification
      const queuedNotifs = await container.db.query<any>(
        `SELECT * FROM notification_queue WHERE template_code = 'ACADEMIC_PROBATION_WARNING'`
      );
      expect(queuedNotifs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Broadsheet Certification & Senate Roster (certifyBroadsheet & generateGraduationList)', () => {
    it('locks broadsheet status as CERTIFIED and logs cryptographic audit record', async () => {
      const broadsheet = await examService.compileBroadsheet('dept-csc', 100);

      const certResult = await examService.certifyBroadsheet(broadsheet.id, 'usr-admin-001');
      expect(certResult.success).toBe(true);

      const certifiedRecord = await container.db.queryFirst<any>(
        `SELECT * FROM broadsheets WHERE id = ?`,
        [broadsheet.id]
      );
      expect(certifiedRecord.status).toBe('CERTIFIED');
      expect(certifiedRecord.certified_by).toBe('usr-admin-001');
      expect(certifiedRecord.certified_at).toBeGreaterThan(0);

      // Verify audit log
      const audit = await container.db.queryFirst<any>(
        `SELECT * FROM audit_logs WHERE action = 'CERTIFY_BROADSHEET' AND entity_id = ?`,
        [broadsheet.id]
      );
      expect(audit).toBeDefined();
    });

    it('generates senate graduation list auditing final-year candidates', async () => {
      // Ensure at least one final year student exists
      await container.db.execute(
        `INSERT OR REPLACE INTO students 
         (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
         VALUES 
         ('std-final-roster-01', 'usr-std-001', 'div-nce', 'prog-nce-csc-mth', 300, 'COEKA/2023/NCE/050', 2023, 'Terna', 'Audu', 'MALE', '2004-01-01', 'Benue', 'Makurdi', 'Campus', 'https://photo.url', 'sig', 'ACTIVE')`
      );

      const list = await examService.generateGraduationList('dept-csc');
      expect(list.totalCandidates).toBeGreaterThanOrEqual(1);
      expect(list.candidates[0].honorsClassification).toBeDefined();
    });
  });

  describe('5. HTTP API & Strict RBAC Protection', () => {
    it('GET /api/exam-officer/stats returns 200 for EXAM_OFFICER persona', async () => {
      const res = await app.request('/api/exam-officer/stats', {
        headers: {
          'X-Demo-Role': 'EXAM_OFFICER',
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.stats).toHaveProperty('totalBroadsheets');
    });

    it('GET /api/exam-officer/broadsheet returns 200 with master grid for EXAM_OFFICER', async () => {
      const res = await app.request('/api/exam-officer/broadsheet?departmentId=dept-csc&level=100', {
        headers: {
          'X-Demo-Role': 'EXAM_OFFICER',
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.courses).toBeDefined();
      expect(data.students).toBeDefined();
      expect(data.summary).toBeDefined();
    });

    it('STRICT RBAC: Blocks unauthorized access (STUDENT role returns 403 Forbidden)', async () => {
      const res = await app.request('/api/exam-officer/broadsheet', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Forbidden');
    });

    it('STRICT RBAC: Blocks unauthenticated request (returns 401 Unauthorized)', async () => {
      const res = await app.request('/api/exam-officer/broadsheet');
      expect(res.status).toBe(401);
    });
  });
});
