-- ============================================================================
-- COEKA ENTERPRISE DIGITAL CAMPUS PORTAL - INITIAL DDL SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS divisions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK(name IN ('NCE', 'DEGREE', 'SECONDARY', 'PRIMARY')),
    code TEXT NOT NULL UNIQUE,
    grading_policy TEXT NOT NULL CHECK(grading_policy IN ('NCCE_5_POINT', 'NUC_DEGREE_5_POINT', 'SECONDARY_WAEC', 'PRIMARY_BASIC')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS schools_faculties (
    id TEXT PRIMARY KEY,
    division_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    dean_staff_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    hod_staff_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (school_id) REFERENCES schools_faculties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS programmes (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    duration_years INTEGER NOT NULL DEFAULT 3,
    total_semesters INTEGER NOT NULL DEFAULT 6,
    qualification_awarded TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS academic_sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_current INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS semesters_terms (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    division_id TEXT NOT NULL,
    name TEXT NOT NULL,
    term_number INTEGER NOT NULL CHECK(term_number IN (1, 2, 3)),
    is_current INTEGER NOT NULL DEFAULT 0,
    registration_open INTEGER NOT NULL DEFAULT 0,
    result_upload_open INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('APPLICANT', 'STUDENT', 'STAFF', 'PARENT', 'ADMIN')),
    is_active INTEGER NOT NULL DEFAULT 1,
    two_factor_secret TEXT,
    two_factor_enabled INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    module TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admissions_cycles (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    division_id TEXT NOT NULL,
    name TEXT NOT NULL,
    application_fee_kobo INTEGER NOT NULL CHECK(application_fee_kobo >= 0),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_open INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    cycle_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    programme_id TEXT NOT NULL,
    application_number TEXT NOT NULL UNIQUE,
    jamb_registration_number TEXT,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK(gender IN ('MALE', 'FEMALE')),
    date_of_birth TEXT NOT NULL,
    state_of_origin TEXT NOT NULL,
    lga_of_origin TEXT NOT NULL,
    passport_photo_url TEXT,
    o_level_data_json TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('DRAFT', 'SUBMITTED', 'SCREENED', 'ADMITTED', 'ACCEPTED', 'REJECTED')),
    admission_letter_url TEXT,
    acceptance_fee_paid INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (cycle_id) REFERENCES admissions_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    division_id TEXT NOT NULL,
    programme_id TEXT NOT NULL,
    current_level INTEGER NOT NULL,
    matric_number TEXT NOT NULL UNIQUE,
    admission_year INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK(gender IN ('MALE', 'FEMALE')),
    date_of_birth TEXT NOT NULL,
    state_of_origin TEXT NOT NULL,
    lga_of_origin TEXT NOT NULL,
    blood_group TEXT,
    contact_address TEXT NOT NULL,
    passport_photo_url TEXT NOT NULL,
    qr_code_signature TEXT NOT NULL,
    academic_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(academic_status IN ('ACTIVE', 'PROBATION', 'WITHDRAWN', 'SUSPENDED', 'GRADUATED')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT,
    FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    programme_id TEXT NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    credit_units INTEGER NOT NULL CHECK(credit_units > 0),
    level INTEGER NOT NULL,
    semester_term INTEGER NOT NULL CHECK(semester_term IN (1, 2, 3)),
    is_compulsory INTEGER NOT NULL DEFAULT 1,
    prerequisite_course_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE SET NULL,
    UNIQUE(programme_id, code)
);

CREATE TABLE IF NOT EXISTS course_registrations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    semester_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    registered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    is_approved_by_adviser INTEGER NOT NULL DEFAULT 0,
    adviser_staff_id TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters_terms(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(student_id, semester_id, course_id)
);

CREATE TABLE IF NOT EXISTS student_grades (
    id TEXT PRIMARY KEY,
    registration_id TEXT NOT NULL UNIQUE,
    ca_score REAL CHECK(ca_score >= 0 AND ca_score <= 40),
    exam_score REAL CHECK(exam_score >= 0 AND exam_score <= 70),
    total_score REAL GENERATED ALWAYS AS (COALESCE(ca_score, 0) + COALESCE(exam_score, 0)) STORED,
    letter_grade TEXT CHECK(letter_grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
    grade_point REAL,
    is_resit INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (registration_id) REFERENCES course_registrations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS result_approval_audits (
    id TEXT PRIMARY KEY,
    semester_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    stage TEXT NOT NULL CHECK(stage IN ('LECTURER_SUBMITTED', 'HOD_RECOMMENDED', 'DEAN_VERIFIED', 'SENATE_APPROVED')),
    actor_staff_id TEXT NOT NULL,
    action_timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    digital_signature TEXT NOT NULL,
    comments TEXT,
    FOREIGN KEY (semester_id) REFERENCES semesters_terms(id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fee_categories (
    id TEXT PRIMARY KEY,
    division_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_recurring INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fee_schedules (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    amount_kobo INTEGER NOT NULL CHECK(amount_kobo > 0),
    due_date TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (category_id) REFERENCES fee_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_invoices (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    fee_schedule_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    amount_due_kobo INTEGER NOT NULL CHECK(amount_due_kobo > 0),
    amount_paid_kobo INTEGER NOT NULL DEFAULT 0 CHECK(amount_paid_kobo >= 0),
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK(status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    FOREIGN KEY (fee_schedule_id) REFERENCES fee_schedules(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS student_virtual_accounts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK(provider IN ('VPAY', 'PAYVESSEL')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    gateway TEXT NOT NULL CHECK(gateway IN ('REMITA_BSCPP', 'VPAY', 'PAYVESSEL', 'PAYSTACK', 'INTERSWITCH')),
    gateway_reference TEXT,
    type TEXT NOT NULL CHECK(type IN ('CREDIT', 'DEBIT')),
    amount_kobo INTEGER NOT NULL CHECK(amount_kobo > 0),
    service_charge_kobo INTEGER NOT NULL DEFAULT 0,
    settlement_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(settlement_status IN ('PENDING', 'SUCCESS', 'FAILED')),
    cryptographic_signature TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    reconciled_at INTEGER,
    FOREIGN KEY (invoice_id) REFERENCES student_invoices(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS hostels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    gender TEXT NOT NULL CHECK(gender IN ('MALE', 'FEMALE')),
    total_capacity INTEGER NOT NULL CHECK(total_capacity > 0),
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS hostel_rooms (
    id TEXT PRIMARY KEY,
    hostel_id TEXT NOT NULL,
    room_number TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK(capacity > 0),
    floor_number INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
    UNIQUE(hostel_id, room_number)
);

CREATE TABLE IF NOT EXISTS hostel_bedspaces (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    bed_label TEXT NOT NULL,
    is_occupied INTEGER NOT NULL DEFAULT 0,
    reserved_until INTEGER,
    FOREIGN KEY (room_id) REFERENCES hostel_rooms(id) ON DELETE CASCADE,
    UNIQUE(room_id, bed_label)
);

CREATE TABLE IF NOT EXISTS hostel_allocations (
    id TEXT PRIMARY KEY,
    bedspace_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    allocated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'CHECKED_OUT', 'REVOKED')),
    FOREIGN KEY (bedspace_id) REFERENCES hostel_bedspaces(id) ON DELETE RESTRICT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS staff_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    staff_id_number TEXT NOT NULL UNIQUE,
    department_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    cadre TEXT NOT NULL CHECK(cadre IN ('ACADEMIC', 'NON_ACADEMIC')),
    designation TEXT NOT NULL,
    employment_date TEXT NOT NULL,
    highest_qualification TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS staff_course_allocations (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    semester_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'PRIMARY_LECTURER' CHECK(role IN ('PRIMARY_LECTURER', 'CO_LECTURER')),
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters_terms(id) ON DELETE CASCADE,
    UNIQUE(staff_id, course_id, semester_id)
);

CREATE TABLE IF NOT EXISTS parents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    occupation TEXT,
    residential_address TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parent_wards (
    parent_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK(relationship IN ('FATHER', 'MOTHER', 'GUARDIAN')),
    PRIMARY KEY(parent_id, student_id),
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    old_value_json TEXT,
    new_value_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    signature TEXT NOT NULL
);
