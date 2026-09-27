import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { SignatureService } from '../finance/signatureService';
import { ExamOfficerService, FinalCgpaAuditResult } from '../academic/examService';

export interface CertificateRecord {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  certificateNumber: string;
  qualificationAwarded: string;
  programmeName: string;
  division: 'NCE' | 'DEGREE';
  honorsClassification: string;
  finalCgpa: number;
  confermentDate: string;
  issuedBy?: string;
  issuedAt: number;
  qrVerificationHash: string;
  digitalSignature: string;
  status: 'VALID' | 'REVOKED' | 'REISSUED';
  revocationReason?: string;
  verificationUrl: string;
  createdAt: number;
}

export interface VerificationResult {
  isValid: boolean;
  status: 'VALID' | 'REVOKED' | 'NOT_FOUND';
  certificateNumber?: string;
  studentName?: string;
  matricNumber?: string;
  programmeName?: string;
  departmentName?: string;
  qualificationAwarded?: string;
  division?: string;
  honorsClassification?: string;
  finalCgpa?: number;
  confermentDate?: string;
  issuedAt?: number;
  qrVerificationHash?: string;
  digitalSignature?: string;
  revocationReason?: string | null;
  institution: string;
  message: string;
}

export interface TranscriptRequestRecord {
  id: string;
  studentId: string;
  matricNumber?: string;
  studentName?: string;
  recipientName: string;
  recipientAddress: string;
  recipientEmail?: string;
  deliveryMethod: 'ELECTRONIC' | 'COURIER' | 'IN_PERSON';
  feeAmountKobo: number;
  paymentReference?: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SENT' | 'REJECTED';
  processedBy?: string;
  trackingNumber?: string;
  dispatchNotes?: string;
  requestedAt: number;
  processedAt?: number;
  dispatchedAt?: number;
  updatedAt: number;
}

export interface StudentArchiveRecord {
  id: string;
  studentId: string;
  matricNumber?: string;
  studentName?: string;
  graduationYear: number;
  qualificationAwarded: string;
  honorsClassification: string;
  finalCgpa: number;
  certificateNumber?: string;
  archiveStatus: 'ALUMNI' | 'WITHDRAWN' | 'DECEASED';
  archivedBy?: string;
  archivedAt: number;
  dossierSummary: any;
}

export interface RegistrarStats {
  totalCertificatesIssued: number;
  validCertificatesCount: number;
  pendingTranscriptsCount: number;
  completedTranscriptsCount: number;
  totalAlumniArchived: number;
  eligibleGraduatingCandidatesCount: number;
  recentCertificates: CertificateRecord[];
  recentTranscripts: TranscriptRequestRecord[];
}

export interface CandidateWithClearance extends FinalCgpaAuditResult {
  hasCertificate: boolean;
  certificateNumber?: string;
  certificateId?: string;
  isArchived: boolean;
}

export class RegistrarService {
  private examService: ExamOfficerService;

  constructor(private db: IDatabaseProvider) {
    this.examService = new ExamOfficerService(db);
  }

  /**
   * Helper to resolve a valid user ID for foreign key columns (issued_by, processed_by, archived_by)
   */
  private async resolveValidUserId(userId?: string): Promise<string | null> {
    if (!userId) return null;
    const existing = await this.db.queryFirst<any>(
      `SELECT id FROM users WHERE id = ?`,
      [userId]
    );
    if (existing) return existing.id;

    // Fallback to first admin or staff user
    const fallback = await this.db.queryFirst<any>(
      `SELECT id FROM users WHERE user_type IN ('ADMIN', 'STAFF') LIMIT 1`
    );
    return fallback?.id || null;
  }

  /**
   * 1. Issue Official Tamper-Proof Academic Certificate
   * Strictly gated by Bursary (₦0 debt), Library ('CLEARED'), and Academic standards (passed all core, CGPA >= 1.50).
   */
  async issueCertificate(
    studentId: string,
    registrarUserId?: string,
    options?: { confermentDate?: string; qualification?: string }
  ): Promise<CertificateRecord> {
    // Audit the student's graduation qualification and clearance standing
    const audit = await this.examService.calculateFinalCGPA(studentId);

    // GATE 1: Financial Clearance Check
    if (!audit.financialClearance.isCleared || audit.financialClearance.outstandingDebtKobo > 0) {
      const debtNaira = (audit.financialClearance.outstandingDebtKobo / 100).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
      });
      throw new Error(
        `Certificate issuance blocked by Bursary: Student has an outstanding debt of ₦${debtNaira}. Full financial clearance is required.`
      );
    }

    // GATE 2: Library Clearance Check
    if (!audit.libraryClearance.isCleared || audit.libraryClearance.status !== 'CLEARED') {
      throw new Error(
        `Certificate issuance blocked by Library: Clearance status is '${audit.libraryClearance.status}'. Student must return all books and obtain Librarian clearance.`
      );
    }

    // GATE 3: Academic Deficiency Check
    if (!audit.isEligibleForGraduation || audit.finalCgpa < 1.50 || audit.outstandingFailedCourses.length > 0) {
      const failedList = audit.outstandingFailedCourses.map(c => c.courseCode).join(', ');
      throw new Error(
        `Certificate issuance blocked by Academic Board: Student has academic deficits (${
          audit.outstandingFailedCourses.length > 0 ? `Unpassed core courses: ${failedList}` : 'CGPA below 1.50'
        }). Final CGPA: ${audit.finalCgpa}.`
      );
    }

    // Check if certificate already exists and is VALID
    const existingCert = await this.db.queryFirst<any>(
      `SELECT * FROM certificates WHERE student_id = ? AND status = 'VALID'`,
      [audit.studentId]
    );

    if (existingCert) {
      return {
        id: existingCert.id,
        studentId: existingCert.student_id,
        matricNumber: audit.matricNumber,
        studentName: audit.studentName,
        certificateNumber: existingCert.certificate_number,
        qualificationAwarded: existingCert.qualification_awarded,
        programmeName: existingCert.programme_name,
        division: existingCert.division,
        honorsClassification: existingCert.honors_classification,
        finalCgpa: Number(existingCert.final_cgpa),
        confermentDate: existingCert.conferment_date,
        issuedBy: existingCert.issued_by,
        issuedAt: existingCert.issued_at,
        qrVerificationHash: existingCert.qr_verification_hash,
        digitalSignature: existingCert.digital_signature,
        status: existingCert.status,
        revocationReason: existingCert.revocation_reason,
        verificationUrl: `/verify/${existingCert.qr_verification_hash}`,
        createdAt: existingCert.created_at,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const confermentDate = options?.confermentDate || new Date().toISOString().split('T')[0];
    const confermentYear = confermentDate.split('-')[0] || new Date().getFullYear().toString();

    // Determine serial sequence for this division
    const seqRow = await this.db.queryFirst<any>(
      `SELECT COUNT(*) as total FROM certificates WHERE division = ?`,
      [audit.division]
    );
    const nextSeq = (Number(seqRow?.total || 0) + 1).toString().padStart(5, '0');
    const divisionCode = audit.division === 'DEGREE' ? 'DEG' : 'NCE';
    const certificateNumber = `COEKA/${divisionCode}/${confermentYear}/${nextSeq}`;

    // Generate cryptographic QR verification hash and digital signature
    const salt = 'COEKA_REGISTRAR_SECURE_SALT_2026';
    const rawPayload = `${audit.studentId}:${audit.matricNumber}:${certificateNumber}:${audit.finalCgpa}:${confermentDate}:${salt}`;
    const qrVerificationHash = await SignatureService.generateVerificationHash(rawPayload);
    const digitalSignature = await SignatureService.generateVerificationHash(`SIG:${qrVerificationHash}:${certificateNumber}:${confermentDate}`);

    // Determine qualification name
    let qualificationAwarded = options?.qualification;
    if (!qualificationAwarded) {
      if (audit.division === 'DEGREE') {
        qualificationAwarded = `Bachelor of Science in Education (${audit.programmeName})`;
      } else {
        qualificationAwarded = `Nigeria Certificate in Education (${audit.programmeName})`;
      }
    }

    const certId = `cert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const effectiveIssuedBy = await this.resolveValidUserId(registrarUserId);

    await this.db.execute(
      `INSERT INTO certificates 
       (id, student_id, certificate_number, qualification_awarded, programme_name, division, 
        honors_classification, final_cgpa, conferment_date, issued_by, issued_at, 
        qr_verification_hash, digital_signature, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALID', ?, ?)`,
      [
        certId,
        audit.studentId,
        certificateNumber,
        qualificationAwarded,
        audit.programmeName,
        audit.division,
        audit.honorsClassification,
        audit.finalCgpa,
        confermentDate,
        effectiveIssuedBy,
        now,
        qrVerificationHash,
        digitalSignature,
        now,
        now,
      ]
    );

    // Upsert Academic Status to GRADUATED
    const existingStatus = await this.db.queryFirst<any>(
      `SELECT id FROM academic_statuses WHERE student_id = ?`,
      [audit.studentId]
    );

    if (existingStatus) {
      await this.db.execute(
        `UPDATE academic_statuses 
         SET status = 'GRADUATED', remarks = 'Degree/Certificate conferred. Certified by Registrar.', updated_at = ?
         WHERE id = ?`,
        [now, existingStatus.id]
      );
    } else {
      const statusId = `ast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const session = await this.db.queryFirst<any>(
        `SELECT id FROM academic_sessions WHERE is_current = 1 LIMIT 1`
      );
      await this.db.execute(
        `INSERT INTO academic_statuses 
         (id, student_id, session_id, level, gpa, cgpa, total_credits_registered, total_credits_passed, status, remarks, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'GRADUATED', 'Degree/Certificate conferred. Certified by Registrar.', ?)`,
        [
          statusId,
          audit.studentId,
          session?.id || 'sess-2026-2027',
          audit.level,
          audit.finalCgpa,
          audit.finalCgpa,
          audit.totalCreditsRegistered,
          audit.totalCreditsEarned,
          now,
        ]
      );
    }

    return {
      id: certId,
      studentId: audit.studentId,
      matricNumber: audit.matricNumber,
      studentName: audit.studentName,
      certificateNumber,
      qualificationAwarded,
      programmeName: audit.programmeName,
      division: audit.division,
      honorsClassification: audit.honorsClassification,
      finalCgpa: audit.finalCgpa,
      confermentDate,
      issuedBy: effectiveIssuedBy || undefined,
      issuedAt: now,
      qrVerificationHash,
      digitalSignature,
      status: 'VALID',
      verificationUrl: `/verify/${qrVerificationHash}`,
      createdAt: now,
    };
  }

  /**
   * 2. Public-Facing Student Credential & Certificate Verification
   * Employers, NYSC, and academic institutions verify certificate validity without authentication.
   */
  async verifyStudentIdentity(identifier: string): Promise<VerificationResult> {
    if (!identifier || identifier.trim().length === 0) {
      return {
        isValid: false,
        status: 'NOT_FOUND',
        institution: 'Colleges of Education Katsina-Ala (COEKA)',
        message: 'No identification credential was provided for verification.',
      };
    }

    const clean = identifier.trim();

    // Query certificates joining student, programme, and department
    const cert = await this.db.queryFirst<any>(
      `SELECT c.*, s.matric_number, s.first_name, s.last_name, 
              p.name as programme_title, d.name as department_title
       FROM certificates c
       JOIN students s ON c.student_id = s.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE c.certificate_number = ? 
          OR c.qr_verification_hash = ?
          OR s.matric_number = ?
          OR c.student_id = ?
       LIMIT 1`,
      [clean, clean, clean, clean]
    );

    if (!cert) {
      // Check if student exists but has not been issued a certificate
      const student = await this.db.queryFirst<any>(
        `SELECT id, matric_number, first_name, last_name FROM students WHERE matric_number = ? OR id = ?`,
        [clean, clean]
      );

      if (student) {
        return {
          isValid: false,
          status: 'NOT_FOUND',
          matricNumber: student.matric_number,
          studentName: `${student.first_name} ${student.last_name}`,
          institution: 'Colleges of Education Katsina-Ala (COEKA)',
          message: `Record found for student ${student.matric_number}, but no official certificate has been issued by the Registrar.`,
        };
      }

      return {
        isValid: false,
        status: 'NOT_FOUND',
        institution: 'Colleges of Education Katsina-Ala (COEKA)',
        message: `No authentic COEKA academic certificate found matching identifier '${clean}'.`,
      };
    }

    const isValid = cert.status === 'VALID';
    const status = cert.status as 'VALID' | 'REVOKED';

    let message = 'Authentic COEKA Academic Credential Verified.';
    if (status === 'REVOKED') {
      message = `ATTENTION: This certificate was REVOKED by the Academic Senate. Reason: ${cert.revocation_reason || 'Academic disciplinary action'}.`;
    }

    return {
      isValid,
      status,
      certificateNumber: cert.certificate_number,
      studentName: `${cert.first_name} ${cert.last_name}`.trim(),
      matricNumber: cert.matric_number,
      programmeName: cert.programme_name || cert.programme_title,
      departmentName: cert.department_title,
      qualificationAwarded: cert.qualification_awarded,
      division: cert.division,
      honorsClassification: cert.honors_classification,
      finalCgpa: Number(cert.final_cgpa),
      confermentDate: cert.conferment_date,
      issuedAt: cert.issued_at,
      qrVerificationHash: cert.qr_verification_hash,
      digitalSignature: cert.digital_signature,
      revocationReason: cert.revocation_reason || null,
      institution: 'Colleges of Education Katsina-Ala (COEKA)',
      message,
    };
  }

  /**
   * 3. Process Transcript Request Lifecycle
   * PENDING_PAYMENT -> PAID -> PROCESSING -> SENT
   */
  async processTranscriptRequest(
    requestId: string,
    newStatus: 'PROCESSING' | 'SENT' | 'REJECTED' | 'PAID',
    trackingInfo?: { trackingNumber?: string; dispatchNotes?: string },
    registrarUserId?: string
  ): Promise<TranscriptRequestRecord> {
    const existing = await this.db.queryFirst<any>(
      `SELECT tr.*, s.matric_number, s.first_name, s.last_name
       FROM transcript_requests tr
       JOIN students s ON tr.student_id = s.id
       WHERE tr.id = ?`,
      [requestId]
    );

    if (!existing) {
      throw new Error(`Transcript request not found: ${requestId}`);
    }

    const now = Math.floor(Date.now() / 1000);
    const effectiveStaffId = await this.resolveValidUserId(registrarUserId);

    let processedAt = existing.processed_at;
    let dispatchedAt = existing.dispatched_at;
    let trackingNumber = existing.tracking_number;
    let dispatchNotes = existing.dispatch_notes;

    if (newStatus === 'PROCESSING') {
      processedAt = now;
    } else if (newStatus === 'SENT') {
      dispatchedAt = now;
      if (trackingInfo?.trackingNumber) trackingNumber = trackingInfo.trackingNumber;
      if (trackingInfo?.dispatchNotes) dispatchNotes = trackingInfo.dispatchNotes;
    }

    await this.db.execute(
      `UPDATE transcript_requests
       SET status = ?, processed_by = ?, processed_at = ?, dispatched_at = ?, 
           tracking_number = ?, dispatch_notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        newStatus,
        effectiveStaffId || existing.processed_by,
        processedAt,
        dispatchedAt,
        trackingNumber,
        dispatchNotes,
        now,
        requestId,
      ]
    );

    return {
      id: existing.id,
      studentId: existing.student_id,
      matricNumber: existing.matric_number,
      studentName: `${existing.first_name} ${existing.last_name}`.trim(),
      recipientName: existing.recipient_name,
      recipientAddress: existing.recipient_address,
      recipientEmail: existing.recipient_email,
      deliveryMethod: existing.delivery_method,
      feeAmountKobo: Number(existing.fee_amount_kobo),
      paymentReference: existing.payment_reference,
      status: newStatus,
      processedBy: effectiveStaffId || existing.processed_by,
      trackingNumber,
      dispatchNotes,
      requestedAt: existing.requested_at,
      processedAt,
      dispatchedAt,
      updatedAt: now,
    };
  }

  /**
   * Create a new transcript request
   */
  async createTranscriptRequest(data: {
    studentId: string;
    recipientName: string;
    recipientAddress: string;
    recipientEmail?: string;
    deliveryMethod?: 'ELECTRONIC' | 'COURIER' | 'IN_PERSON';
    feeAmountKobo?: number;
    paymentReference?: string;
    status?: 'PENDING_PAYMENT' | 'PAID';
  }): Promise<TranscriptRequestRecord> {
    const student = await this.db.queryFirst<any>(
      `SELECT id, matric_number, first_name, last_name FROM students WHERE id = ? OR matric_number = ?`,
      [data.studentId, data.studentId]
    );

    if (!student) {
      throw new Error(`Student not found: ${data.studentId}`);
    }

    const id = `trq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = Math.floor(Date.now() / 1000);
    const deliveryMethod = data.deliveryMethod || 'ELECTRONIC';
    const feeAmountKobo = data.feeAmountKobo ?? (deliveryMethod === 'COURIER' ? 1500000 : 500000);
    const status = data.status || 'PAID';

    await this.db.execute(
      `INSERT INTO transcript_requests
       (id, student_id, recipient_name, recipient_address, recipient_email, delivery_method, fee_amount_kobo, payment_reference, status, requested_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        student.id,
        data.recipientName,
        data.recipientAddress,
        data.recipientEmail || null,
        deliveryMethod,
        feeAmountKobo,
        data.paymentReference || `TX-TRQ-${Date.now()}`,
        status,
        now,
        now,
      ]
    );

    return {
      id,
      studentId: student.id,
      matricNumber: student.matric_number,
      studentName: `${student.first_name} ${student.last_name}`.trim(),
      recipientName: data.recipientName,
      recipientAddress: data.recipientAddress,
      recipientEmail: data.recipientEmail,
      deliveryMethod,
      feeAmountKobo,
      paymentReference: data.paymentReference,
      status,
      requestedAt: now,
      updatedAt: now,
    };
  }

  /**
   * 4. Finalize Student File & Archive as Alumni
   */
  async finalizeStudentFile(
    studentId: string,
    registrarUserId?: string
  ): Promise<StudentArchiveRecord> {
    const student = await this.db.queryFirst<any>(
      `SELECT s.*, p.name as programme_name, d.name as department_name, div.name as division_name
       FROM students s
       JOIN programmes p ON s.programme_id = p.id
       JOIN departments d ON p.department_id = d.id
       JOIN divisions div ON s.division_id = div.id
       WHERE s.id = ? OR s.matric_number = ?`,
      [studentId, studentId]
    );

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const audit = await this.examService.calculateFinalCGPA(student.id);

    // Fetch existing certificate if any
    const cert = await this.db.queryFirst<any>(
      `SELECT * FROM certificates WHERE student_id = ? AND status = 'VALID'`,
      [student.id]
    );

    const now = Math.floor(Date.now() / 1000);
    const graduationYear = cert?.conferment_date
      ? parseInt(cert.conferment_date.split('-')[0], 10)
      : new Date().getFullYear();

    const qualificationAwarded =
      cert?.qualification_awarded ||
      (audit.division === 'DEGREE'
        ? `Bachelor of Science in Education (${audit.programmeName})`
        : `Nigeria Certificate in Education (${audit.programmeName})`);

    const dossierSummary = {
      studentId: student.id,
      matricNumber: student.matric_number,
      fullName: `${student.first_name} ${student.last_name}`,
      division: audit.division,
      department: student.department_name,
      programme: student.programme_name,
      finalCgpa: audit.finalCgpa,
      honorsClassification: audit.honorsClassification,
      certificateNumber: cert?.certificate_number || null,
      confermentDate: cert?.conferment_date || null,
      financialClearance: audit.financialClearance,
      libraryClearance: audit.libraryClearance,
      archivedAt: now,
    };

    const effectiveArchivedBy = await this.resolveValidUserId(registrarUserId);

    // Upsert student_archives
    const existingArchive = await this.db.queryFirst<any>(
      `SELECT id FROM student_archives WHERE student_id = ?`,
      [student.id]
    );

    let archiveId = existingArchive?.id;
    if (existingArchive) {
      await this.db.execute(
        `UPDATE student_archives
         SET graduation_year = ?, qualification_awarded = ?, honors_classification = ?, 
             final_cgpa = ?, certificate_number = ?, archive_status = 'ALUMNI', 
             archived_by = ?, archived_at = ?, dossier_summary_json = ?, updated_at = ?
         WHERE id = ?`,
        [
          graduationYear,
          qualificationAwarded,
          audit.honorsClassification,
          audit.finalCgpa,
          cert?.certificate_number || null,
          effectiveArchivedBy,
          now,
          JSON.stringify(dossierSummary),
          now,
          archiveId,
        ]
      );
    } else {
      archiveId = `arc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await this.db.execute(
        `INSERT INTO student_archives
         (id, student_id, graduation_year, qualification_awarded, honors_classification, 
          final_cgpa, certificate_number, archive_status, archived_by, archived_at, dossier_summary_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ALUMNI', ?, ?, ?, ?)`,
        [
          archiveId,
          student.id,
          graduationYear,
          qualificationAwarded,
          audit.honorsClassification,
          audit.finalCgpa,
          cert?.certificate_number || null,
          effectiveArchivedBy,
          now,
          JSON.stringify(dossierSummary),
          now,
        ]
      );
    }

    return {
      id: archiveId,
      studentId: student.id,
      matricNumber: student.matric_number,
      studentName: `${student.first_name} ${student.last_name}`,
      graduationYear,
      qualificationAwarded,
      honorsClassification: audit.honorsClassification,
      finalCgpa: audit.finalCgpa,
      certificateNumber: cert?.certificate_number || undefined,
      archiveStatus: 'ALUMNI',
      archivedBy: effectiveArchivedBy || undefined,
      archivedAt: now,
      dossierSummary,
    };
  }

  /**
   * 5. Get Graduating Candidates with Clearance Breakdown
   * Used by CertificateIssuer.tsx to see who can be certified vs who is blocked.
   */
  async getGraduationCandidates(division?: string): Promise<CandidateWithClearance[]> {
    // Graduating levels: 300 for NCE, 400 for DEGREE
    let query = `
      SELECT s.id 
      FROM students s
      JOIN divisions div ON s.division_id = div.id
      WHERE (
        (div.name = 'NCE' AND s.current_level >= 300) OR
        (div.name = 'DEGREE' AND s.current_level >= 400)
      )
    `;
    const params: any[] = [];
    if (division) {
      query += ` AND div.name = ?`;
      params.push(division);
    }
    query += ` ORDER BY s.matric_number ASC`;

    const studentRows = await this.db.query<any>(query, params);
    const candidates: CandidateWithClearance[] = [];

    for (const row of studentRows) {
      try {
        const audit = await this.examService.calculateFinalCGPA(row.id);
        const cert = await this.db.queryFirst<any>(
          `SELECT id, certificate_number FROM certificates WHERE student_id = ? AND status = 'VALID'`,
          [row.id]
        );
        const archive = await this.db.queryFirst<any>(
          `SELECT id FROM student_archives WHERE student_id = ?`,
          [row.id]
        );

        candidates.push({
          ...audit,
          hasCertificate: !!cert,
          certificateNumber: cert?.certificate_number,
          certificateId: cert?.id,
          isArchived: !!archive,
        });
      } catch {
        // Skip students with malformed academic records
      }
    }

    return candidates;
  }

  /**
   * 6. Overview KPI Statistics for Registrar Dashboard
   */
  async getRegistrarStats(): Promise<RegistrarStats> {
    const certCountRow = await this.db.queryFirst<any>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'VALID' THEN 1 ELSE 0 END) as valid_total FROM certificates`
    );
    const totalCertificatesIssued = Number(certCountRow?.total || 0);
    const validCertificatesCount = Number(certCountRow?.valid_total || 0);

    const transPendingRow = await this.db.queryFirst<any>(
      `SELECT COUNT(*) as total FROM transcript_requests WHERE status IN ('PAID', 'PROCESSING')`
    );
    const pendingTranscriptsCount = Number(transPendingRow?.total || 0);

    const transCompletedRow = await this.db.queryFirst<any>(
      `SELECT COUNT(*) as total FROM transcript_requests WHERE status = 'SENT'`
    );
    const completedTranscriptsCount = Number(transCompletedRow?.total || 0);

    const alumniCountRow = await this.db.queryFirst<any>(
      `SELECT COUNT(*) as total FROM student_archives WHERE archive_status = 'ALUMNI'`
    );
    const totalAlumniArchived = Number(alumniCountRow?.total || 0);

    // Candidates count
    const candidates = await this.getGraduationCandidates();
    const eligibleGraduatingCandidatesCount = candidates.filter(
      c => c.isEligibleForGraduation && !c.hasCertificate
    ).length;

    // Recent 5 certificates
    const recentCertRows = await this.db.query<any>(
      `SELECT c.*, s.matric_number, s.first_name, s.last_name
       FROM certificates c
       JOIN students s ON c.student_id = s.id
       ORDER BY c.issued_at DESC
       LIMIT 5`
    );

    const recentCertificates: CertificateRecord[] = recentCertRows.map(c => ({
      id: c.id,
      studentId: c.student_id,
      matricNumber: c.matric_number,
      studentName: `${c.first_name} ${c.last_name}`.trim(),
      certificateNumber: c.certificate_number,
      qualificationAwarded: c.qualification_awarded,
      programmeName: c.programme_name,
      division: c.division,
      honorsClassification: c.honors_classification,
      finalCgpa: Number(c.final_cgpa),
      confermentDate: c.conferment_date,
      issuedBy: c.issued_by,
      issuedAt: c.issued_at,
      qrVerificationHash: c.qr_verification_hash,
      digitalSignature: c.digital_signature,
      status: c.status,
      verificationUrl: `/verify/${c.qr_verification_hash}`,
      createdAt: c.created_at,
    }));

    // Recent 5 transcript requests
    const recentTransRows = await this.db.query<any>(
      `SELECT tr.*, s.matric_number, s.first_name, s.last_name
       FROM transcript_requests tr
       JOIN students s ON tr.student_id = s.id
       ORDER BY tr.requested_at DESC
       LIMIT 5`
    );

    const recentTranscripts: TranscriptRequestRecord[] = recentTransRows.map(t => ({
      id: t.id,
      studentId: t.student_id,
      matricNumber: t.matric_number,
      studentName: `${t.first_name} ${t.last_name}`.trim(),
      recipientName: t.recipient_name,
      recipientAddress: t.recipient_address,
      recipientEmail: t.recipient_email,
      deliveryMethod: t.delivery_method,
      feeAmountKobo: Number(t.fee_amount_kobo),
      paymentReference: t.payment_reference,
      status: t.status,
      processedBy: t.processed_by,
      trackingNumber: t.tracking_number,
      dispatchNotes: t.dispatch_notes,
      requestedAt: t.requested_at,
      processedAt: t.processed_at,
      dispatchedAt: t.dispatched_at,
      updatedAt: t.updated_at,
    }));

    return {
      totalCertificatesIssued,
      validCertificatesCount,
      pendingTranscriptsCount,
      completedTranscriptsCount,
      totalAlumniArchived,
      eligibleGraduatingCandidatesCount,
      recentCertificates,
      recentTranscripts,
    };
  }

  /**
   * 7. List Issued Certificates
   */
  async listCertificates(filter?: {
    division?: string;
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<CertificateRecord[]> {
    let query = `
      SELECT c.*, s.matric_number, s.first_name, s.last_name
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.division) {
      query += ` AND c.division = ?`;
      params.push(filter.division);
    }
    if (filter?.status) {
      query += ` AND c.status = ?`;
      params.push(filter.status);
    }
    if (filter?.search) {
      const term = `%${filter.search}%`;
      query += ` AND (c.certificate_number LIKE ? OR s.matric_number LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY c.issued_at DESC LIMIT ?`;
    params.push(filter?.limit || 50);

    const rows = await this.db.query<any>(query, params);
    return rows.map(c => ({
      id: c.id,
      studentId: c.student_id,
      matricNumber: c.matric_number,
      studentName: `${c.first_name} ${c.last_name}`.trim(),
      certificateNumber: c.certificate_number,
      qualificationAwarded: c.qualification_awarded,
      programmeName: c.programme_name,
      division: c.division,
      honorsClassification: c.honors_classification,
      finalCgpa: Number(c.final_cgpa),
      confermentDate: c.conferment_date,
      issuedBy: c.issued_by,
      issuedAt: c.issued_at,
      qrVerificationHash: c.qr_verification_hash,
      digitalSignature: c.digital_signature,
      status: c.status,
      verificationUrl: `/verify/${c.qr_verification_hash}`,
      createdAt: c.created_at,
    }));
  }

  /**
   * 8. List Transcript Requests
   */
  async listTranscriptRequests(status?: string): Promise<TranscriptRequestRecord[]> {
    let query = `
      SELECT tr.*, s.matric_number, s.first_name, s.last_name
      FROM transcript_requests tr
      JOIN students s ON tr.student_id = s.id
    `;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ` WHERE tr.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY tr.requested_at DESC`;

    const rows = await this.db.query<any>(query, params);
    return rows.map(t => ({
      id: t.id,
      studentId: t.student_id,
      matricNumber: t.matric_number,
      studentName: `${t.first_name} ${t.last_name}`.trim(),
      recipientName: t.recipient_name,
      recipientAddress: t.recipient_address,
      recipientEmail: t.recipient_email,
      deliveryMethod: t.delivery_method,
      feeAmountKobo: Number(t.fee_amount_kobo),
      paymentReference: t.payment_reference,
      status: t.status,
      processedBy: t.processed_by,
      trackingNumber: t.tracking_number,
      dispatchNotes: t.dispatch_notes,
      requestedAt: t.requested_at,
      processedAt: t.processed_at,
      dispatchedAt: t.dispatched_at,
      updatedAt: t.updated_at,
    }));
  }

  /**
   * 9. Search and Query Alumni Student Archives
   */
  async searchStudentArchive(
    query?: string,
    graduationYear?: number,
    division?: string
  ): Promise<StudentArchiveRecord[]> {
    let sql = `
      SELECT sa.*, s.matric_number, s.first_name, s.last_name, div.name as division_name
      FROM student_archives sa
      JOIN students s ON sa.student_id = s.id
      JOIN divisions div ON s.division_id = div.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (graduationYear) {
      sql += ` AND sa.graduation_year = ?`;
      params.push(graduationYear);
    }
    if (division) {
      sql += ` AND div.name = ?`;
      params.push(division);
    }
    if (query && query.trim().length > 0) {
      const term = `%${query.trim()}%`;
      sql += ` AND (s.matric_number LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR (s.first_name || ' ' || s.last_name) LIKE ? OR sa.certificate_number LIKE ? OR sa.qualification_awarded LIKE ?)`;
      params.push(term, term, term, term, term, term);
    }

    sql += ` ORDER BY sa.graduation_year DESC, sa.archived_at DESC LIMIT 100`;

    const rows = await this.db.query<any>(sql, params);
    return rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      matricNumber: r.matric_number,
      studentName: `${r.first_name} ${r.last_name}`.trim(),
      graduationYear: Number(r.graduation_year),
      qualificationAwarded: r.qualification_awarded,
      honorsClassification: r.honors_classification,
      finalCgpa: Number(r.final_cgpa),
      certificateNumber: r.certificate_number || undefined,
      archiveStatus: r.archive_status,
      archivedBy: r.archived_by,
      archivedAt: r.archived_at,
      dossierSummary: r.dossier_summary_json ? JSON.parse(r.dossier_summary_json) : {},
    }));
  }
}
