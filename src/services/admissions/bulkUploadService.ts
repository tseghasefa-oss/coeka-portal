import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { ICacheProvider } from '../../infrastructure/interfaces/ICacheProvider';
import { LedgerEngine } from '../finance/ledgerEngine';

export interface RawApplicantRecord {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  division?: 'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY' | string;
  divisionCode?: string;
  programmeId?: string;
  programmeCode?: string;
  programmeName?: string;
  jambRegNumber?: string;
  stateOfOrigin?: string;
  lgaOfOrigin?: string;
  gender?: 'MALE' | 'FEMALE';
}

export interface AdmittedStudentResult {
  userId: string;
  studentId: string;
  matricNumber: string;
  fullName: string;
  email: string;
  division: string;
  divisionCode: string;
  programme: string;
  level: number;
  acceptanceFeeInvoiceId: string;
  acceptanceFeeKobo: number;
  formattedAcceptanceFee: string;
  status: 'ACTIVE';
}

export interface BulkUploadSummary {
  totalProcessed: number;
  createdCount: number;
  failedCount: number;
  students: AdmittedStudentResult[];
  createdStudents: AdmittedStudentResult[];
  errors: Array<{ row: number; error: string }>;
}

export class BulkUploadService {
  constructor(
    private db: IDatabaseProvider,
    private cache?: ICacheProvider
  ) {}

  /**
   * Parse CSV string into structured applicant records
   */
  static parseCSV(csvContent: string): RawApplicantRecord[] {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const records: RawApplicantRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 3) continue;

      const record: any = {};
      headers.forEach((header, index) => {
        const val = cols[index] || '';
        const lower = header.toLowerCase();
        if (lower.includes('first')) record.firstName = val;
        else if (lower.includes('last')) record.lastName = val;
        else if (lower.includes('middle')) record.middleName = val;
        else if (lower.includes('email')) record.email = val;
        else if (lower.includes('phone')) record.phoneNumber = val;
        else if (lower.includes('div')) record.division = val.toUpperCase();
        else if (lower.includes('prog')) record.programmeCode = val;
        else if (lower.includes('jamb') || lower.includes('reg')) record.jambRegNumber = val;
        else if (lower.includes('state')) record.stateOfOrigin = val;
        else if (lower.includes('lga')) record.lgaOfOrigin = val;
        else if (lower.includes('gender')) record.gender = val.toUpperCase() as any;
      });

      if (record.firstName && record.lastName) {
        const div = record.division || 'NCE';
        const email = record.email || `${record.firstName.toLowerCase()}.${record.lastName.toLowerCase()}@coekatsinaala.edu.ng`;
        const phone = record.phoneNumber || `080${Math.floor(10000000 + Math.random() * 90000000)}`;
        const prog = record.programmeCode || 'prog-nce-csc-mth';

        records.push({
          firstName: record.firstName,
          lastName: record.lastName,
          middleName: record.middleName || '',
          email,
          phoneNumber: phone,
          phone,
          division: div,
          divisionCode: div,
          programmeCode: prog,
          programmeId: prog,
          programmeName: prog,
          jambRegNumber: record.jambRegNumber || `JAMB-${Date.now()}-${i}`,
          stateOfOrigin: record.stateOfOrigin || 'Benue',
          lgaOfOrigin: record.lgaOfOrigin || 'Katsina-Ala',
          gender: record.gender || 'MALE',
        });
      }
    }

    return records;
  }

  /**
   * Process parsed applicants: create user accounts, generate matric numbers, and issue acceptance fee invoices
   */
  async processBulkAdmissions(
    applicants: RawApplicantRecord[],
    admissionYear: number = 2026
  ): Promise<BulkUploadSummary> {
    const admittedStudents: AdmittedStudentResult[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    // Acceptance Fee per division in Kobo (e.g. NCE = ₦15,000, Degree = ₦20,000)
    const getAcceptanceFeeKobo = (div: string) => {
      switch (div.toUpperCase()) {
        case 'DEGREE':
          return 2000000; // ₦20,000
        case 'SECONDARY':
          return 1000000; // ₦10,000
        case 'PRIMARY':
          return 800000; // ₦8,000
        default:
          return 1500000; // ₦15,000 for NCE
      }
    };

    // Ensure baseline fee schedule exists
    await this.db.execute(
      `INSERT OR IGNORE INTO fee_schedules (id, category_id, session_id, level, amount_kobo, due_date)
       VALUES ('sched-nce-accept', 'fee-nce-accept', 'sess-2026-2027', 100, 1500000, '2026-11-30')`
    );

    for (let index = 0; index < applicants.length; index++) {
      const applicant = applicants[index];

      try {
        const divisionCode = (applicant.divisionCode || applicant.division || 'NCE').toUpperCase();
        
        // Count existing students in this division to guarantee unique matriculation numbers
        const countRow = await this.db.queryFirst<any>(
          `SELECT count(*) as cnt FROM students WHERE matric_number LIKE ?`,
          [`COEKA/${admissionYear}/${divisionCode}/%`]
        );
        let seq = (countRow?.cnt || 0) + 101 + index;
        let matricNumber = `COEKA/${admissionYear}/${divisionCode}/${seq.toString().padStart(3, '0')}`;

        let existingMatric = await this.db.queryFirst<any>(
          `SELECT id FROM students WHERE matric_number = ?`,
          [matricNumber]
        );
        while (existingMatric) {
          seq++;
          matricNumber = `COEKA/${admissionYear}/${divisionCode}/${seq.toString().padStart(3, '0')}`;
          existingMatric = await this.db.queryFirst<any>(
            `SELECT id FROM students WHERE matric_number = ?`,
            [matricNumber]
          );
        }

        const seqStr = seq.toString().padStart(3, '0');
        const userId = `usr-std-batch-${Date.now()}-${seq}`;
        const studentId = `std-batch-${Date.now()}-${seq}`;
        const invoiceId = `inv-acc-${Date.now()}-${seq}`;
        const email = applicant.email || `${applicant.firstName.toLowerCase()}.${applicant.lastName.toLowerCase()}${seq}@coekatsinaala.edu.ng`;
        const phone = applicant.phoneNumber || applicant.phone || `080${Math.floor(10000000 + Math.random() * 90000000)}`;
        const username = email.split('@')[0].toLowerCase() + seq;

        // 1. Resolve or Create User in users table
        let existingUser = await this.db.queryFirst<any>(
          `SELECT id FROM users WHERE email = ? OR phone_number = ?`,
          [email, phone]
        );

        let effectiveUserId = existingUser?.id;
        if (!effectiveUserId) {
          effectiveUserId = userId;
          await this.db.execute(
            `INSERT INTO users (id, username, email, phone_number, password_hash, user_type, is_active)
             VALUES (?, ?, ?, ?, ?, 'STUDENT', 1)`,
            [
              effectiveUserId,
              username,
              email,
              phone,
              'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea',
            ]
          );
        }

        // Map role in user_roles
        await this.db.execute(
          `INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, 'role-student')`,
          [effectiveUserId]
        );

        // 2. Create Student profile in students table (academic_status = 'ACTIVE' complying with DB check constraint)
        const divisionId = divisionCode === 'DEGREE' ? 'div-degree' : divisionCode === 'SECONDARY' ? 'div-secondary' : divisionCode === 'PRIMARY' ? 'div-primary' : 'div-nce';
        const programmeId = applicant.programmeId || applicant.programmeCode || (divisionCode === 'DEGREE' ? 'prog-deg-bed' : 'prog-nce-csc-mth');

        await this.db.execute(
          `INSERT INTO students 
           (id, user_id, division_id, programme_id, current_level, matric_number, admission_year,
            first_name, middle_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin,
            contact_address, passport_photo_url, qr_code_signature, academic_status)
           VALUES (?, ?, ?, ?, 100, ?, ?, ?, ?, ?, ?, '2005-01-01', ?, ?, 'Katsina-Ala, Benue State',
                   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250',
                   ?, 'ACTIVE')`,
          [
            studentId,
            effectiveUserId,
            divisionId,
            programmeId,
            matricNumber,
            admissionYear,
            applicant.firstName,
            applicant.middleName || '',
            applicant.lastName,
            applicant.gender || 'MALE',
            applicant.stateOfOrigin || 'Benue',
            applicant.lgaOfOrigin || 'Katsina-Ala',
            `SIG_QR_${matricNumber.replace(/\//g, '_')}`,
          ]
        );

        // 3. Generate Acceptance Fee Invoice in student_invoices referencing seeded fee_schedule
        const acceptanceFeeKobo = getAcceptanceFeeKobo(divisionCode);
        await this.db.execute(
          `INSERT INTO student_invoices
           (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status)
           VALUES (?, ?, 'sched-nce-accept', ?, ?, 0, 'UNPAID')`,
          [
            invoiceId,
            studentId,
            `INV-${admissionYear}-ACC-${seqStr}`,
            acceptanceFeeKobo,
          ]
        );

        const fullName = `${applicant.firstName}${applicant.middleName ? ` ${applicant.middleName}` : ''} ${applicant.lastName}`;

        admittedStudents.push({
          userId: effectiveUserId,
          studentId,
          matricNumber,
          fullName,
          email,
          division: divisionCode,
          divisionCode,
          programme: applicant.programmeName || applicant.programmeCode || 'General Studies',
          level: 100,
          acceptanceFeeInvoiceId: invoiceId,
          acceptanceFeeKobo,
          formattedAcceptanceFee: LedgerEngine.koboToNaira(acceptanceFeeKobo),
          status: 'ACTIVE',
        });
      } catch (err: any) {
        errors.push({
          row: index + 1,
          error: err.message || 'Failed to create student account',
        });
      }
    }

    return {
      totalProcessed: applicants.length,
      createdCount: admittedStudents.length,
      failedCount: errors.length,
      students: admittedStudents,
      createdStudents: admittedStudents,
      errors,
    };
  }
}
