import { sqliteTable, text, integer, real, primaryKey, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Institutional Structure
export const divisions = sqliteTable('divisions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // 'NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'
  code: text('code').notNull().unique(),
  gradingPolicy: text('grading_policy').notNull(), // 'NCCE_5_POINT', 'NUC_DEGREE_5_POINT', 'SECONDARY_WAEC', 'PRIMARY_BASIC'
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const schoolsFaculties = sqliteTable('schools_faculties', {
  id: text('id').primaryKey(),
  divisionId: text('division_id').notNull().references(() => divisions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  deanStaffId: text('dean_staff_id'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schoolsFaculties.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  hodStaffId: text('hod_staff_id'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const programmes = sqliteTable('programmes', {
  id: text('id').primaryKey(),
  departmentId: text('department_id').notNull().references(() => departments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  durationYears: integer('duration_years').notNull().default(3),
  totalSemesters: integer('total_semesters').notNull().default(6),
  qualificationAwarded: text('qualification_awarded').notNull(),
  isActive: integer('is_active').notNull().default(1),
});

export const academicSessions = sqliteTable('academic_sessions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // '2026/2027'
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrent: integer('is_current').notNull().default(0),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const semestersTerms = sqliteTable('semesters_terms', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => academicSessions.id, { onDelete: 'cascade' }),
  divisionId: text('division_id').notNull().references(() => divisions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  termNumber: integer('term_number').notNull(), // 1, 2, 3
  isCurrent: integer('is_current').notNull().default(0),
  registrationOpen: integer('registration_open').notNull().default(0),
  resultUploadOpen: integer('result_upload_open').notNull().default(0),
});

// 2. Identity, Roles & RBAC
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  phoneNumber: text('phone_number').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  userType: text('user_type').notNull(), // 'APPLICANT', 'STUDENT', 'STAFF', 'PARENT', 'ADMIN'
  isActive: integer('is_active').notNull().default(1),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: integer('two_factor_enabled').notNull().default(0),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  module: text('module').notNull(),
});

export const rolePermissions = sqliteTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] }),
]);

export const userRoles = sqliteTable('user_roles', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
]);

// 3. Admissions
export const admissionsCycles = sqliteTable('admissions_cycles', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => academicSessions.id, { onDelete: 'cascade' }),
  divisionId: text('division_id').notNull().references(() => divisions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  applicationFeeKobo: integer('application_fee_kobo').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isOpen: integer('is_open').notNull().default(1),
});

export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(),
  cycleId: text('cycle_id').notNull().references(() => admissionsCycles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  programmeId: text('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  applicationNumber: text('application_number').notNull().unique(),
  jambRegistrationNumber: text('jamb_registration_number'),
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  gender: text('gender').notNull(), // 'MALE', 'FEMALE'
  dateOfBirth: text('date_of_birth').notNull(),
  stateOfOrigin: text('state_of_origin').notNull(),
  lgaOfOrigin: text('lga_of_origin').notNull(),
  passportPhotoUrl: text('passport_photo_url'),
  oLevelDataJson: text('o_level_data_json'),
  status: text('status').notNull().default('SUBMITTED'),
  admissionLetterUrl: text('admission_letter_url'),
  acceptanceFeePaid: integer('acceptance_fee_paid').notNull().default(0),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

// 4. Student Information Management System (SIMS)
export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  divisionId: text('division_id').notNull().references(() => divisions.id),
  programmeId: text('programme_id').notNull().references(() => programmes.id),
  currentLevel: integer('current_level').notNull(), // 100, 200, 300, 400
  matricNumber: text('matric_number').notNull().unique(),
  admissionYear: integer('admission_year').notNull(),
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  gender: text('gender').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  stateOfOrigin: text('state_of_origin').notNull(),
  lgaOfOrigin: text('lga_of_origin').notNull(),
  bloodGroup: text('blood_group'),
  contactAddress: text('contact_address').notNull(),
  passportPhotoUrl: text('passport_photo_url').notNull(),
  qrCodeSignature: text('qr_code_signature').notNull(),
  academicStatus: text('academic_status').notNull().default('ACTIVE'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  programmeId: text('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  title: text('title').notNull(),
  creditUnits: integer('credit_units').notNull(),
  level: integer('level').notNull(),
  semesterTerm: integer('semester_term').notNull(),
  isCompulsory: integer('is_compulsory').notNull().default(1),
  prerequisiteCourseId: text('prerequisite_course_id'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
}, (t) => [
  unique().on(t.programmeId, t.code),
]);

export const courseRegistrations = sqliteTable('course_registrations', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  semesterId: text('semester_id').notNull().references(() => semestersTerms.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  registeredAt: integer('registered_at').notNull().default(sql`(strftime('%s', 'now'))`),
  isApprovedByAdviser: integer('is_approved_by_adviser').notNull().default(0),
  adviserStaffId: text('adviser_staff_id'),
}, (t) => [
  unique().on(t.studentId, t.semesterId, t.courseId),
]);

// 5. Academic Records & Results
export const studentGrades = sqliteTable('student_grades', {
  id: text('id').primaryKey(),
  registrationId: text('registration_id').notNull().unique().references(() => courseRegistrations.id, { onDelete: 'cascade' }),
  caScore: real('ca_score'),
  examScore: real('exam_score'),
  totalScore: real('total_score'),
  letterGrade: text('letter_grade'),
  gradePoint: real('grade_point'),
  isResit: integer('is_resit').notNull().default(0),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const resultApprovalAudits = sqliteTable('result_approval_audits', {
  id: text('id').primaryKey(),
  semesterId: text('semester_id').notNull().references(() => semestersTerms.id),
  departmentId: text('department_id').notNull().references(() => departments.id),
  level: integer('level').notNull(),
  stage: text('stage').notNull(), // 'LECTURER_SUBMITTED', 'HOD_MODERATED', 'DEAN_VERIFIED', 'SENATE_APPROVED'
  actorStaffId: text('actor_staff_id').notNull(),
  actionTimestamp: integer('action_timestamp').notNull().default(sql`(strftime('%s', 'now'))`),
  digitalSignature: text('digital_signature').notNull(),
  comments: text('comments'),
});

// 6. The Financial Engine & Ledger
export const feeCategories = sqliteTable('fee_categories', {
  id: text('id').primaryKey(),
  divisionId: text('division_id').notNull().references(() => divisions.id),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  isRecurring: integer('is_recurring').notNull().default(1),
});

export const feeSchedules = sqliteTable('fee_schedules', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => feeCategories.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull().references(() => academicSessions.id, { onDelete: 'cascade' }),
  level: integer('level').notNull(),
  amountKobo: integer('amount_kobo').notNull(),
  dueDate: text('due_date'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const studentInvoices = sqliteTable('student_invoices', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  feeScheduleId: text('fee_schedule_id').notNull().references(() => feeSchedules.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  amountDueKobo: integer('amount_due_kobo').notNull(),
  amountPaidKobo: integer('amount_paid_kobo').notNull().default(0),
  status: text('status').notNull().default('UNPAID'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const studentVirtualAccounts = sqliteTable('student_virtual_accounts', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().unique().references(() => students.id, { onDelete: 'cascade' }),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull().unique(),
  accountName: text('account_name').notNull(),
  provider: text('provider').notNull(), // 'VPAY', 'PAYVESSEL'
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => studentInvoices.id),
  reference: text('reference').notNull().unique(),
  gateway: text('gateway').notNull(), // 'REMITA_BSCPP', 'VPAY', 'PAYVESSEL', 'PAYSTACK', 'INTERSWITCH'
  gatewayReference: text('gateway_reference'),
  type: text('type').notNull(), // 'CREDIT', 'DEBIT'
  amountKobo: integer('amount_kobo').notNull(),
  serviceChargeKobo: integer('service_charge_kobo').notNull().default(0),
  settlementStatus: text('settlement_status').notNull().default('PENDING'),
  cryptographicSignature: text('cryptographic_signature').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
  reconciledAt: integer('reconciled_at'),
});

export const paymentTransactions = sqliteTable('payment_transactions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id),
  invoiceId: text('invoice_id').references(() => studentInvoices.id),
  transactionReference: text('transaction_reference').notNull().unique(),
  bankReference: text('bank_reference'),
  paymentChannel: text('payment_channel').notNull(), // 'DIRECT_BANK_TRANSFER', 'REMITA', 'VPAY', 'PAYVESSEL', 'POS', 'CASH_OFFICE'
  amountKobo: integer('amount_kobo').notNull(),
  channelFeeKobo: integer('channel_fee_kobo').notNull().default(0),
  netAmountKobo: integer('net_amount_kobo').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING', 'RECONCILED', 'FLAGGED', 'REJECTED'
  payerName: text('payer_name'),
  payerPhone: text('payer_phone'),
  reconciledByStaffId: text('reconciled_by_staff_id'),
  reconciledAt: integer('reconciled_at'),
  reconciliationNotes: text('reconciliation_notes'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const debtAlerts = sqliteTable('debt_alerts', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').notNull().references(() => studentInvoices.id, { onDelete: 'cascade' }),
  outstandingAmountKobo: integer('outstanding_amount_kobo').notNull(),
  severity: text('severity').notNull().default('WARNING'), // 'NOTICE', 'WARNING', 'FINAL_DEMAND', 'EXAM_BARRED'
  channel: text('channel').notNull().default('PORTAL'), // 'PORTAL', 'SMS', 'EMAIL'
  sentAt: integer('sent_at').notNull().default(sql`(strftime('%s', 'now'))`),
  isResolved: integer('is_resolved').notNull().default(0),
  resolvedAt: integer('resolved_at'),
  notes: text('notes'),
});

export const paymentReceipts = sqliteTable('payment_receipts', {
  id: text('id').primaryKey(),
  receiptNumber: text('receipt_number').notNull().unique(),
  transactionId: text('transaction_id').notNull().unique().references(() => paymentTransactions.id),
  invoiceId: text('invoice_id').notNull().references(() => studentInvoices.id),
  studentId: text('student_id').notNull().references(() => students.id),
  amountPaidKobo: integer('amount_paid_kobo').notNull(),
  balanceRemainingKobo: integer('balance_remaining_kobo').notNull().default(0),
  issuedAt: integer('issued_at').notNull().default(sql`(strftime('%s', 'now'))`),
  issuedByStaffId: text('issued_by_staff_id').notNull(),
  verificationHash: text('verification_hash').notNull().unique(),
  qrCodeUrl: text('qr_code_url'),
  metadataJson: text('metadata_json'),
});

// 7. Hostel Management
export const hostels = sqliteTable('hostels', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  gender: text('gender').notNull(),
  totalCapacity: integer('total_capacity').notNull(),
  isActive: integer('is_active').notNull().default(1),
});

export const hostelRooms = sqliteTable('hostel_rooms', {
  id: text('id').primaryKey(),
  hostelId: text('hostel_id').notNull().references(() => hostels.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  capacity: integer('capacity').notNull(),
  floorNumber: integer('floor_number').notNull().default(0),
}, (t) => [
  unique().on(t.hostelId, t.roomNumber),
]);

export const hostelBedspaces = sqliteTable('hostel_bedspaces', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => hostelRooms.id, { onDelete: 'cascade' }),
  bedLabel: text('bed_label').notNull(),
  isOccupied: integer('is_occupied').notNull().default(0),
  reservedUntil: integer('reserved_until'),
}, (t) => [
  unique().on(t.roomId, t.bedLabel),
]);

export const hostelAllocations = sqliteTable('hostel_allocations', {
  id: text('id').primaryKey(),
  bedspaceId: text('bedspace_id').notNull().references(() => hostelBedspaces.id),
  studentId: text('student_id').notNull().references(() => students.id),
  sessionId: text('session_id').notNull().references(() => academicSessions.id),
  transactionId: text('transaction_id').notNull().unique().references(() => transactions.id),
  allocatedAt: integer('allocated_at').notNull().default(sql`(strftime('%s', 'now'))`),
  status: text('status').notNull().default('ACTIVE'),
});

// 8. Staff Management
export const staffProfiles = sqliteTable('staff_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  staffIdNumber: text('staff_id_number').notNull().unique(),
  departmentId: text('department_id').notNull().references(() => departments.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  cadre: text('cadre').notNull(), // 'ACADEMIC', 'NON_ACADEMIC'
  designation: text('designation').notNull(),
  employmentDate: text('employment_date').notNull(),
  highestQualification: text('highest_qualification').notNull(),
});

export const staffCourseAllocations = sqliteTable('staff_course_allocations', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staffProfiles.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  semesterId: text('semester_id').notNull().references(() => semestersTerms.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('PRIMARY_LECTURER'),
}, (t) => [
  unique().on(t.staffId, t.courseId, t.semesterId),
]);

// 9. Parents
export const parents = sqliteTable('parents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  occupation: text('occupation'),
  residentialAddress: text('residential_address').notNull(),
});

export const parentWards = sqliteTable('parent_wards', {
  parentId: text('parent_id').notNull().references(() => parents.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  relationship: text('relationship').notNull(), // 'FATHER', 'MOTHER', 'GUARDIAN'
}, (t) => [
  primaryKey({ columns: [t.parentId, t.studentId] }),
]);

// 10. Audit & Notifications
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id').notNull(),
  action: text('action').notNull(),
  entityName: text('entity_name').notNull(),
  entityId: text('entity_id').notNull(),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  oldValueJson: text('old_value_json'),
  newValueJson: text('new_value_json'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
  signature: text('signature').notNull(),
});

export const notificationQueue = sqliteTable('notification_queue', {
  id: text('id').primaryKey(),
  channel: text('channel').notNull(), // 'SMS', 'EMAIL'
  recipient: text('recipient').notNull(),
  templateCode: text('template_code').notNull(),
  payloadJson: text('payload_json').notNull(),
  status: text('status').notNull().default('QUEUED'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

// 11. System Configuration & Settings
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  category: text('category').notNull().default('GENERAL'), // 'GENERAL', 'ACADEMIC', 'ADMISSIONS', 'FINANCE'
  updatedBy: text('updated_by'),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

// 12. Lecturer Academic Operations: Attendance & Continuous Assessment Grades
export const ResultStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;
export type ResultStatus = (typeof ResultStatus)[keyof typeof ResultStatus];

export const courseAttendance = sqliteTable('course_attendance', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  lectureDate: text('lecture_date').notNull(), // 'YYYY-MM-DD'
  status: text('status').notNull().default('PRESENT'), // 'PRESENT', 'ABSENT', 'EXCUSED'
  markedByStaffId: text('marked_by_staff_id'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
}, (t) => [
  unique().on(t.courseId, t.studentId, t.lectureDate),
]);

export const gradeEntries = sqliteTable('grade_entries', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => academicSessions.id),
  ca1Score: real('ca1_score').default(0),
  ca2Score: real('ca2_score').default(0),
  examScore: real('exam_score').default(0),
  totalScore: real('total_score').default(0),
  letterGrade: text('letter_grade'),
  gradePoint: real('grade_point'),
  status: text('status').notNull().default('DRAFT'), // 'DRAFT', 'PUBLISHED'
  lecturerStaffId: text('lecturer_staff_id'),
  publishedAt: integer('published_at'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now'))`),
}, (t) => [
  unique().on(t.courseId, t.studentId),
]);

// 13. Dean Academic Oversight: Result Approvals & Grade Appeals
export const resultApprovals = sqliteTable('result_approvals', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => academicSessions.id),
  deanUserId: text('dean_user_id').notNull().references(() => users.id),
  totalStudentsApproved: integer('total_students_approved').notNull().default(0),
  approvalStatus: text('approval_status').notNull().default('APPROVED'), // 'APPROVED', 'REJECTED'
  comments: text('comments'),
  approvedAt: integer('approved_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

export const studentAppeals = sqliteTable('student_appeals', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  gradeEntryId: text('grade_entry_id').references(() => gradeEntries.id, { onDelete: 'set null' }),
  reason: text('reason').notNull(),
  desiredCorrection: text('desired_correction'),
  status: text('status').notNull().default('PENDING'), // 'PENDING', 'APPROVED', 'REJECTED'
  decisionNotes: text('decision_notes'),
  resolvedByDeanId: text('resolved_by_dean_id').references(() => users.id),
  resolvedAt: integer('resolved_at'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now'))`),
});

