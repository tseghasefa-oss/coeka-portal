import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api';
import { getContainer } from '../src/infrastructure/container';
import { RegistrarService } from '../src/services/registrar/registrarService';
import { AcademicService } from '../src/services/academic/academicService';

describe('Module 10: Registrar & Certificate Issuance Hub Suite', () => {
  const container = getContainer();
  const registrarService = new RegistrarService(container.db);
  const academicService = new AcademicService(container.db);

  // Helper to create test student with matching users entry to satisfy foreign key & unique constraints
  async function createTestStudent(
    studentId: string,
    matric: string,
    firstName: string,
    lastName: string,
    level: number = 300,
    divisionId: string = 'div-nce',
    progId: string = 'prog-nce-csc-mth'
  ) {
    const userId = `usr-${studentId}`;
    await container.db.execute(
      `INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type)
       VALUES (?, ?, ?, ?, 'hash', 'STUDENT')`,
      [
        userId,
        `usr_${studentId}`,
        `${studentId}@coeka.edu.ng`,
        `080${Math.floor(10000000 + Math.random() * 89999999)}`,
      ]
    );

    await container.db.execute(
      `INSERT OR REPLACE INTO students 
       (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, contact_address, passport_photo_url, qr_code_signature, academic_status)
       VALUES 
       (?, ?, ?, ?, ?, ?, 2023, ?, ?, 'MALE', '2004-01-01', 'Benue', 'Katsina-Ala', 'Campus', 'https://photo.url', 'sig', 'ACTIVE')`,
      [studentId, userId, divisionId, progId, level, matric, firstName, lastName]
    );
  }

  beforeEach(async () => {
    await academicService.ensureSeedAcademicData();
  });

  describe('1. Clearance Gates & Certificate Issuance Integrity (issueCertificate)', () => {
    it('GATE 1: Strictly BLOCKS certificate issuance if student has unpaid Bursary debt', async () => {
      const studentId = 'std-test-debt-01';
      const matric = 'COEKA/2026/REG/001';

      await createTestStudent(studentId, matric, 'John', 'Ochoche');

      // Grant Library clearance
      await container.db.execute(
        `INSERT OR REPLACE INTO library_clearances 
         (id, student_id, status, cleared_by_user_id, cleared_at)
         VALUES ('lib-cl-debt-01', ?, 'CLEARED', 'usr-admin-001', strftime('%s', 'now'))`,
        [studentId]
      );

      // Add passing grade
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-debt-01', 'crs-csc111', ?, 'sess-2026-2027', 15, 15, 50, 80, 'A', 5.0, 'PUBLISHED')`,
        [studentId]
      );

      // UNPAID Bursary invoice (₦45,000 debt)
      await container.db.execute(
        `INSERT OR REPLACE INTO student_invoices
         (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES ('inv-debt-01', ?, 'sched-nce-100-tui', 'INV-DEBT-01', 4500000, 0, 'UNPAID')`,
        [studentId]
      );

      await expect(
        registrarService.issueCertificate(studentId, 'usr-admin-001')
      ).rejects.toThrow(/Certificate issuance blocked by Bursary/i);
    });

    it('GATE 2: Strictly BLOCKS certificate issuance if Library clearance is not CLEARED', async () => {
      const studentId = 'std-test-lib-01';
      const matric = 'COEKA/2026/REG/002';

      await createTestStudent(studentId, matric, 'Grace', 'Iorfa');

      // Mark Bursary as fully paid (₦0 debt)
      await container.db.execute(
        `INSERT OR REPLACE INTO student_invoices
         (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES ('inv-lib-01', ?, 'sched-nce-100-tui', 'INV-LIB-01', 4500000, 4500000, 'PAID')`,
        [studentId]
      );

      // Add passing grade
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-lib-01', 'crs-csc111', ?, 'sess-2026-2027', 15, 15, 50, 80, 'A', 5.0, 'PUBLISHED')`,
        [studentId]
      );

      // Mark Library clearance as PENDING
      await container.db.execute(
        `INSERT OR REPLACE INTO library_clearances 
         (id, student_id, status)
         VALUES ('lib-cl-pend-01', ?, 'PENDING')`,
        [studentId]
      );

      await expect(
        registrarService.issueCertificate(studentId, 'usr-admin-001')
      ).rejects.toThrow(/Certificate issuance blocked by Library/i);
    });

    it('GATE 3: Strictly BLOCKS certificate issuance if student has uncleared carry-overs or CGPA < 1.50', async () => {
      const studentId = 'std-test-acad-01';
      const matric = 'COEKA/2026/REG/003';

      await createTestStudent(studentId, matric, 'Kalu', 'Egbe');

      // Both financial and library are cleared
      await container.db.execute(
        `INSERT OR REPLACE INTO student_invoices
         (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES ('inv-acad-01', ?, 'sched-nce-100-tui', 'INV-ACAD-01', 4500000, 4500000, 'PAID')`,
        [studentId]
      );

      await container.db.execute(
        `INSERT OR REPLACE INTO library_clearances 
         (id, student_id, status, cleared_by_user_id, cleared_at)
         VALUES ('lib-cl-acad-01', ?, 'CLEARED', 'usr-admin-001', strftime('%s', 'now'))`,
        [studentId]
      );

      // Student has uncleared F in MTH 111 (Score 25)
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-acad-01', 'crs-mth111', ?, 'sess-2026-2027', 5, 5, 15, 25, 'F', 0.0, 'PUBLISHED')`,
        [studentId]
      );

      await expect(
        registrarService.issueCertificate(studentId, 'usr-admin-001')
      ).rejects.toThrow(/Certificate issuance blocked by Academic Board/i);
    });

    it('SUCCESS: Generates official tamper-proof certificate with cryptographic SHA-256 hash when all gates pass', async () => {
      const studentId = 'std-test-success-01';
      const matric = 'COEKA/2026/REG/004';

      await createTestStudent(studentId, matric, 'Doofan', 'Nyiev');

      // 1. Full financial clearance
      await container.db.execute(
        `INSERT OR REPLACE INTO student_invoices
         (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
         VALUES ('inv-succ-01', ?, 'sched-nce-100-tui', 'INV-SUCC-01', 4500000, 4500000, 'PAID')`,
        [studentId]
      );

      // 2. Full library clearance
      await container.db.execute(
        `INSERT OR REPLACE INTO library_clearances 
         (id, student_id, status, cleared_by_user_id, cleared_at)
         VALUES ('lib-cl-succ-01', ?, 'CLEARED', 'usr-admin-001', strftime('%s', 'now'))`,
        [studentId]
      );

      // 3. Passing grades (CSC 111: A, 5.0)
      await container.db.execute(
        `INSERT OR REPLACE INTO grade_entries 
         (id, course_id, student_id, session_id, ca1_score, ca2_score, exam_score, total_score, letter_grade, grade_point, status)
         VALUES ('ge-succ-01', 'crs-csc111', ?, 'sess-2026-2027', 15, 20, 50, 85, 'A', 5.0, 'PUBLISHED')`,
        [studentId]
      );

      const certificate = await registrarService.issueCertificate(studentId, 'usr-admin-001', {
        confermentDate: '2026-11-20',
      });

      expect(certificate).toBeDefined();
      expect(certificate.certificateNumber).toMatch(/^COEKA\/NCE\/\d{4}\/\d{5}$/);
      expect(certificate.studentName).toBe('Doofan Nyiev');
      expect(certificate.matricNumber).toBe(matric);
      expect(certificate.finalCgpa).toBe(5.0);
      expect(certificate.honorsClassification).toBe('Distinction');
      expect(certificate.status).toBe('VALID');
      expect(certificate.qrVerificationHash).toBeDefined();
      expect(certificate.qrVerificationHash.length).toBe(64); // SHA-256 length
      expect(certificate.digitalSignature).toBeDefined();
      expect(certificate.verificationUrl).toContain(certificate.qrVerificationHash);

      // Verify certificate is in database
      const dbCert = await container.db.queryFirst<any>(
        `SELECT * FROM certificates WHERE id = ?`,
        [certificate.id]
      );
      expect(dbCert).toBeDefined();
      expect(dbCert.status).toBe('VALID');

      // Verify academic_statuses is marked as GRADUATED
      const statusRow = await container.db.queryFirst<any>(
        `SELECT status FROM academic_statuses WHERE student_id = ?`,
        [studentId]
      );
      expect(statusRow?.status).toBe('GRADUATED');

      // Idempotency: re-calling returns existing valid certificate
      const secondCall = await registrarService.issueCertificate(studentId);
      expect(secondCall.id).toBe(certificate.id);
      expect(secondCall.certificateNumber).toBe(certificate.certificateNumber);
    });
  });

  describe('2. Public-Facing Employer Credential Verification (verifyStudentIdentity)', () => {
    it('allows public verification by certificateNumber and returns valid credential data', async () => {
      const cert = await container.db.queryFirst<any>(
        `SELECT * FROM certificates WHERE status = 'VALID' LIMIT 1`
      );
      expect(cert).toBeDefined();

      const verification = await registrarService.verifyStudentIdentity(cert.certificate_number);

      expect(verification.isValid).toBe(true);
      expect(verification.status).toBe('VALID');
      expect(verification.certificateNumber).toBe(cert.certificate_number);
      expect(verification.studentName).toBeDefined();
      expect(verification.matricNumber).toBeDefined();
      expect(verification.institution).toContain('College');
      expect(verification.message).toContain('Authentic COEKA Academic Credential Verified');
    });

    it('allows public verification by QR verification SHA-256 hash', async () => {
      const cert = await container.db.queryFirst<any>(
        `SELECT * FROM certificates WHERE status = 'VALID' LIMIT 1`
      );

      const verification = await registrarService.verifyStudentIdentity(cert.qr_verification_hash);

      expect(verification.isValid).toBe(true);
      expect(verification.certificateNumber).toBe(cert.certificate_number);
      expect(verification.qrVerificationHash).toBe(cert.qr_verification_hash);
    });

    it('returns NOT_FOUND for unknown or non-existent certificate numbers', async () => {
      const verification = await registrarService.verifyStudentIdentity('COEKA/FAKE/99999');

      expect(verification.isValid).toBe(false);
      expect(verification.status).toBe('NOT_FOUND');
      expect(verification.message).toContain('No authentic COEKA academic certificate found');
    });
  });

  describe('3. Transcript Request Fulfillment Pipeline', () => {
    it('manages transcript requests from PAID -> PROCESSING -> SENT with courier tracking', async () => {
      const studentId = 'std-test-trans-01';
      await createTestStudent(studentId, 'COEKA/2026/TRQ/001', 'Abednego', 'Agbo');

      // Student creates a transcript request
      const req = await registrarService.createTranscriptRequest({
        studentId,
        recipientName: 'Ahmadu Bello University (School of Postgraduate Studies)',
        recipientAddress: 'Zaria, Kaduna State, Nigeria',
        recipientEmail: 'pgschool@abu.edu.ng',
        deliveryMethod: 'COURIER',
        feeAmountKobo: 1500000,
      });

      expect(req.id).toBeDefined();
      expect(req.status).toBe('PAID');
      expect(req.deliveryMethod).toBe('COURIER');

      // Move from PAID -> PROCESSING
      const processingReq = await registrarService.processTranscriptRequest(
        req.id,
        'PROCESSING',
        undefined,
        'usr-admin-001'
      );
      expect(processingReq.status).toBe('PROCESSING');
      expect(processingReq.processedAt).toBeDefined();

      // Move from PROCESSING -> SENT with tracking number
      const sentReq = await registrarService.processTranscriptRequest(
        req.id,
        'SENT',
        {
          trackingNumber: 'DHL-NGR-8840192',
          dispatchNotes: 'Dispatched via DHL Express. Sealed with Registrar security stamp.',
        },
        'usr-admin-001'
      );

      expect(sentReq.status).toBe('SENT');
      expect(sentReq.trackingNumber).toBe('DHL-NGR-8840192');
      expect(sentReq.dispatchedAt).toBeDefined();
      expect(sentReq.dispatchNotes).toContain('DHL Express');

      // Verify request listed in listTranscriptRequests
      const allSent = await registrarService.listTranscriptRequests('SENT');
      expect(allSent.some((r) => r.id === req.id)).toBe(true);
    });
  });

  describe('4. Student File Finalization & Alumni Archives (finalizeStudentFile)', () => {
    it('archives student record into student_archives with complete dossier snapshot', async () => {
      const cert = await container.db.queryFirst<any>(
        `SELECT student_id, certificate_number FROM certificates WHERE status = 'VALID' LIMIT 1`
      );
      expect(cert).toBeDefined();

      const archive = await registrarService.finalizeStudentFile(cert.student_id, 'usr-admin-001');

      expect(archive).toBeDefined();
      expect(archive.studentId).toBe(cert.student_id);
      expect(archive.archiveStatus).toBe('ALUMNI');
      expect(archive.certificateNumber).toBe(cert.certificate_number);
      expect(archive.dossierSummary).toBeDefined();
      expect(archive.dossierSummary.fullName).toBeDefined();
      expect(archive.dossierSummary.financialClearance.isCleared).toBe(true);

      // Verify searchStudentArchive finds this alumni record
      const results = await registrarService.searchStudentArchive(archive.studentName);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].studentId).toBe(cert.student_id);
    });
  });

  describe('5. Registrar API Endpoints & RBAC Security', () => {
    it('PUBLIC: /api/registrar/verify/:identifier accessible without authentication headers', async () => {
      const cert = await container.db.queryFirst<any>(
        `SELECT certificate_number FROM certificates WHERE status = 'VALID' LIMIT 1`
      );

      const res = await app.request(`/api/registrar/verify/${cert.certificate_number}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.isValid).toBe(true);
      expect(data.status).toBe('VALID');
      expect(data.certificateNumber).toBe(cert.certificate_number);
    });

    it('RBAC GUARD: rejects unauthenticated requests to protected registrar routes', async () => {
      const res = await app.request('/api/registrar/stats', {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });

    it('RBAC GUARD: rejects unauthorized student persona from registrar administrative routes', async () => {
      const res = await app.request('/api/registrar/stats', {
        method: 'GET',
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(res.status).toBe(403);
    });

    it('RBAC SUCCESS: grants REGISTRAR persona access to /api/registrar/stats and returns metrics', async () => {
      const res = await app.request('/api/registrar/stats', {
        method: 'GET',
        headers: {
          'X-Demo-Role': 'REGISTRAR',
        },
      });

      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats.totalCertificatesIssued).toBeGreaterThanOrEqual(1);
      expect(data.stats.totalAlumniArchived).toBeGreaterThanOrEqual(1);
    });
  });
});
