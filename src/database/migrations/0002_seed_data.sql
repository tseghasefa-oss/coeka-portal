-- ============================================================================
-- COEKA ENTERPRISE DIGITAL CAMPUS PORTAL - SEED DATA
-- ============================================================================

-- 1. Divisions
INSERT OR IGNORE INTO divisions (id, name, code, grading_policy) VALUES
('div-nce', 'NCE', 'NCE', 'NCCE_5_POINT'),
('div-degree', 'DEGREE', 'DEG', 'NUC_DEGREE_5_POINT'),
('div-secondary', 'SECONDARY', 'SEC', 'SECONDARY_WAEC'),
('div-primary', 'PRIMARY', 'PRI', 'PRIMARY_BASIC');

-- 2. Schools / Faculties
INSERT OR IGNORE INTO schools_faculties (id, division_id, name, code) VALUES
('sch-sci', 'div-nce', 'School of Sciences', 'SOS'),
('sch-arts', 'div-nce', 'School of Arts and Social Sciences', 'SASS'),
('sch-edu', 'div-nce', 'School of Education', 'SOE'),
('sch-lang', 'div-nce', 'School of Languages', 'SOL'),
('sch-voc', 'div-nce', 'School of Vocational and Technical Education', 'SOVTE'),
('sch-deg-edu', 'div-degree', 'Faculty of Education (Degree Directorate)', 'FEDU'),
('sch-demo-sec', 'div-secondary', 'Demonstration Secondary School', 'DSS'),
('sch-staff-pri', 'div-primary', 'Staff Primary School', 'SPS');

-- 3. Departments
INSERT OR IGNORE INTO departments (id, school_id, name, code) VALUES
('dept-csc', 'sch-sci', 'Department of Computer Science', 'CSC'),
('dept-mth', 'sch-sci', 'Department of Mathematics', 'MTH'),
('dept-bio', 'sch-sci', 'Department of Biology', 'BIO'),
('dept-eng', 'sch-lang', 'Department of English', 'ENG'),
('dept-edu-fnd', 'sch-edu', 'Department of Educational Foundations', 'EDF'),
('dept-deg-bed', 'sch-deg-edu', 'Department of Business Education (Degree)', 'DBED'),
('dept-sec-sci', 'sch-demo-sec', 'Department of Sciences (Secondary)', 'SECSCI'),
('dept-pri-basic', 'sch-staff-pri', 'Primary Basic Education Unit', 'PRIEDU');

-- 4. Programmes
INSERT OR IGNORE INTO programmes (id, department_id, name, code, duration_years, total_semesters, qualification_awarded) VALUES
('prog-nce-csc-mth', 'dept-csc', 'NCE Computer Science / Mathematics', 'NCE-CSC-MTH', 3, 6, 'Nigeria Certificate in Education (NCE)'),
('prog-nce-bio-int', 'dept-bio', 'NCE Biology / Integrated Science', 'NCE-BIO-ISC', 3, 6, 'Nigeria Certificate in Education (NCE)'),
('prog-deg-bed', 'dept-deg-bed', 'B.Ed Business Education (Degree)', 'BED-BED', 4, 8, 'Bachelor of Education (B.Ed)'),
('prog-sec-sss', 'dept-sec-sci', 'Senior Secondary School (Science Track)', 'SEC-SSS', 3, 9, 'SSCE / WAEC Certificate'),
('prog-pri-elem', 'dept-pri-basic', 'Primary Basic Education (Basic 1 - 6)', 'PRI-BAS', 6, 18, 'First School Leaving Certificate');

-- 5. Academic Sessions & Semesters
INSERT OR IGNORE INTO academic_sessions (id, name, start_date, end_date, is_current) VALUES
('sess-2026-2027', '2026/2027', '2026-10-01', '2027-08-31', 1);

INSERT OR IGNORE INTO semesters_terms (id, session_id, division_id, name, term_number, is_current, registration_open, result_upload_open) VALUES
('sem-nce-2026-1', 'sess-2026-2027', 'div-nce', 'First Semester', 1, 1, 1, 1),
('sem-deg-2026-1', 'sess-2026-2027', 'div-degree', 'First Semester', 1, 1, 1, 1),
('term-sec-2026-1', 'sess-2026-2027', 'div-secondary', 'First Term', 1, 1, 1, 1),
('term-pri-2026-1', 'sess-2026-2027', 'div-primary', 'First Term', 1, 1, 1, 1);

-- 6. Core Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES
('role-super-admin', 'SUPER_ADMIN', 'Full system management and infrastructure oversight'),
('role-provost', 'PROVOST', 'Chief Executive and Academic Officer oversight and final ratification'),
('role-registrar', 'REGISTRAR', 'Registry custodian, admissions sign-off, certificate authority'),
('role-bursar', 'BURSAR', 'Bursary head, revenue schedules, refund approvals, ledger inspection'),
('role-dean', 'DEAN', 'Dean of School / Faculty result verification and faculty allocations'),
('role-hod', 'HOD', 'Head of Department result moderation and course assignments'),
('role-exam-officer', 'EXAM_OFFICER', 'Examination officer, broadsheet compilation, transcript processing'),
('role-lecturer', 'LECTURER', 'Academic staff score entry and continuous assessment capture'),
('role-student', 'STUDENT', 'Enrolled undergraduate or pupil self-service access'),
('role-parent', 'PARENT', 'Parent or guardian ward performance and fee tracking');

-- 7. Fee Categories
INSERT OR IGNORE INTO fee_categories (id, division_id, name, code, is_recurring) VALUES
('fee-nce-tuition', 'div-nce', 'NCE School Fees (Tuition & Services)', 'NCE-TUI', 1),
('fee-nce-accept', 'div-nce', 'Provisional Acceptance Fee', 'NCE-ACC', 0),
('fee-hostel-std', 'div-nce', 'Hostel Accommodation Fee (Standard Hall)', 'HST-STD', 1),
('fee-teaching-prac', 'div-nce', 'Teaching Practice & Supervision Levy', 'TP-LEVY', 1),
('fee-deg-tuition', 'div-degree', 'Degree Programme School Fees', 'DEG-TUI', 1),
('fee-sec-termly', 'div-secondary', 'Demonstration Secondary Termly Fees', 'SEC-TRM', 1),
('fee-pri-termly', 'div-primary', 'Staff Primary School Termly Fees', 'PRI-TRM', 1);

-- 8. Fee Schedules for 2026/2027
-- Amounts in Kobo: ₦45,000.00 = 4,500,000 Kobo
INSERT OR IGNORE INTO fee_schedules (id, category_id, session_id, level, amount_kobo, due_date) VALUES
('sched-nce-100-tui', 'fee-nce-tuition', 'sess-2026-2027', 100, 4500000, '2026-12-15'),
('sched-nce-accept', 'fee-nce-accept', 'sess-2026-2027', 100, 1500000, '2026-11-30'),
('sched-hostel-std', 'fee-hostel-std', 'sess-2026-2027', 100, 2000000, '2026-12-15'),
('sched-deg-100-tui', 'fee-deg-tuition', 'sess-2026-2027', 100, 7500000, '2026-12-15');

-- 9. Sample Hostels
INSERT OR IGNORE INTO hostels (id, name, gender, total_capacity) VALUES
('hostel-a-fem', 'Hall A (Queen Amina Hall - Female)', 'FEMALE', 240),
('hostel-b-male', 'Hall B (Benue Hall - Male)', 'MALE', 200);

INSERT OR IGNORE INTO hostel_rooms (id, hostel_id, room_number, capacity, floor_number) VALUES
('room-a-101', 'hostel-a-fem', 'Room 101', 4, 1),
('room-a-102', 'hostel-a-fem', 'Room 102', 4, 1),
('room-b-101', 'hostel-b-male', 'Room 101', 4, 1);

INSERT OR IGNORE INTO hostel_bedspaces (id, room_id, bed_label, is_occupied) VALUES
('bed-a101-1', 'room-a-101', 'Bed 1 (Lower)', 0),
('bed-a101-2', 'room-a-101', 'Bed 2 (Upper)', 0),
('bed-a101-3', 'room-a-101', 'Bed 3 (Lower)', 0),
('bed-a101-4', 'room-a-101', 'Bed 4 (Upper)', 0),
('bed-b101-1', 'room-b-101', 'Bed 1 (Lower)', 0),
('bed-b101-2', 'room-b-101', 'Bed 2 (Upper)', 0);

-- 10. Sample Staff / Faculty
INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type) VALUES
('usr-staff-001', 'lecturer1', 'lecturer1@coeka.edu.ng', '08011112233', '$2a$12$samplepasswordhash', 'STAFF');

INSERT OR IGNORE INTO staff_profiles (id, user_id, staff_id_number, department_id, first_name, last_name, cadre, designation, employment_date, highest_qualification) VALUES
('stf-001', 'usr-staff-001', 'COEKA/STF/2026/001', 'dept-csc', 'Olufemi', 'Adeyemi', 'ACADEMIC', 'Senior Lecturer', '2020-01-15', 'Ph.D Computer Science');

