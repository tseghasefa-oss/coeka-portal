export type DivisionType = 'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY';
export type GradingPolicy = 'NCCE_5_POINT' | 'NUC_DEGREE_5_POINT' | 'SECONDARY_WAEC' | 'PRIMARY_BASIC';

export interface Division {
  id: string;
  name: DivisionType;
  code: string;
  grading_policy: GradingPolicy;
  created_at: number;
}

export interface SchoolFaculty {
  id: string;
  division_id: string;
  name: string;
  code: string;
  dean_staff_id?: string;
  created_at: number;
}

export interface Department {
  id: string;
  school_id: string;
  name: string;
  code: string;
  hod_staff_id?: string;
  created_at: number;
}

export interface Programme {
  id: string;
  department_id: string;
  name: string;
  code: string;
  duration_years: number;
  total_semesters: number;
  qualification_awarded: string;
  is_active: number;
}

export interface AcademicSession {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: number;
  created_at: number;
}

export interface SemesterTerm {
  id: string;
  session_id: string;
  division_id: string;
  name: string;
  term_number: 1 | 2 | 3;
  is_current: number;
  registration_open: number;
  result_upload_open: number;
}

export type UserType = 'APPLICANT' | 'STUDENT' | 'STAFF' | 'PARENT' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone_number: string;
  password_hash: string;
  user_type: UserType;
  is_active: number;
  two_factor_secret?: string;
  two_factor_enabled: number;
  created_at: number;
  updated_at: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Student {
  id: string;
  user_id: string;
  division_id: string;
  programme_id: string;
  current_level: number;
  matric_number: string;
  admission_year: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'MALE' | 'FEMALE';
  date_of_birth: string;
  state_of_origin: string;
  lga_of_origin: string;
  blood_group?: string;
  contact_address: string;
  passport_photo_url: string;
  qr_code_signature: string;
  academic_status: 'ACTIVE' | 'PROBATION' | 'WITHDRAWN' | 'SUSPENDED' | 'GRADUATED';
  created_at: number;
}

export interface Course {
  id: string;
  programme_id: string;
  code: string;
  title: string;
  credit_units: number;
  level: number;
  semester_term: 1 | 2 | 3;
  is_compulsory: number;
  prerequisite_course_id?: string;
  created_at: number;
}

export interface CourseRegistration {
  id: string;
  student_id: string;
  semester_id: string;
  course_id: string;
  registered_at: number;
  is_approved_by_adviser: number;
  adviser_staff_id?: string;
}

export interface StudentGrade {
  id: string;
  registration_id: string;
  ca_score?: number;
  exam_score?: number;
  total_score?: number;
  letter_grade?: string;
  grade_point?: number;
  is_resit: number;
  created_at: number;
  updated_at: number;
}

export interface StudentInvoice {
  id: string;
  student_id: string;
  fee_schedule_id: string;
  invoice_number: string;
  amount_due_kobo: number;
  amount_paid_kobo: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  created_at: number;
}

export interface StudentVirtualAccount {
  id: string;
  student_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  provider: 'VPAY' | 'PAYVESSEL';
  created_at: number;
}

export interface Transaction {
  id: string;
  invoice_id: string;
  reference: string;
  gateway: 'REMITA_BSCPP' | 'VPAY' | 'PAYVESSEL' | 'PAYSTACK' | 'INTERSWITCH';
  gateway_reference?: string;
  type: 'CREDIT' | 'DEBIT';
  amount_kobo: number;
  service_charge_kobo: number;
  settlement_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  cryptographic_signature: string;
  created_at: number;
  reconciled_at?: number;
}

export interface HostelBedspace {
  id: string;
  room_id: string;
  bed_label: string;
  is_occupied: number;
  reserved_until?: number;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  entity_name: string;
  entity_id: string;
  ip_address: string;
  user_agent: string;
  old_value_json?: string;
  new_value_json?: string;
  created_at: number;
  signature: string;
}
