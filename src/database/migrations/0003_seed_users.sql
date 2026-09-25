-- ============================================================================
-- COEKA SEED USERS, STAFF PROFILES, STUDENT PROFILES, AND PARENTS
-- ============================================================================

-- 1. Users
INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type, is_active, two_factor_enabled) VALUES
('usr-admin-001', 'founder_tsegha', 'founder@fruitfulujah.com', '08022223344', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'ADMIN', 1, 1),
('usr-staff-001', 'lecturer1', 'lecturer1@coeka.edu.ng', '08011112233', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'STAFF', 1, 1),
('usr-dean-001', 'dean_tyav', 'btyav@coeka.edu.ng', '08033334455', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'STAFF', 1, 1),
('usr-bur-001', 'bursar_ikyur', 'bursar.office@coeka.edu.ng', '08044445566', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'STAFF', 1, 1),
('usr-std-001', 'std_iorliam', 'm.iorliam@student.coeka.edu.ng', '08055556677', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'STUDENT', 1, 0),
('usr-std-002', 'std_gbadu', 'd.gbadu@student.coeka.edu.ng', '08066667788', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'STUDENT', 1, 0),
('usr-std-003', 'std_chia', 'v.chia@degree.coeka.edu.ng', '08077778899', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'STUDENT', 1, 0),
('usr-par-001', 'parent_iorliam', 'tor.iorliam@gmail.com', '08088889900', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'PARENT', 1, 0);

-- Update lecturer1 password hash if already exists with old bcrypt mock
UPDATE users SET password_hash = 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea' WHERE username = 'lecturer1';

-- 2. Staff Profiles
INSERT OR IGNORE INTO staff_profiles (id, user_id, staff_id_number, department_id, first_name, last_name, cadre, designation, employment_date, highest_qualification) VALUES
('stf-002', 'usr-admin-001', 'COEKA/ADM/001', 'dept-csc', 'Stephen', 'Tsegha', 'NON_ACADEMIC', 'Chief Architect / Super Admin', '2018-01-01', 'Engr. Prof.'),
('stf-003', 'usr-dean-001', 'COEKA/STF/2026/012', 'dept-edu-fnd', 'Bridget', 'Tyav', 'ACADEMIC', 'Dean of Education', '2019-03-01', 'Ph.D Education'),
('stf-004', 'usr-bur-001', 'COEKA/BUR/005', 'dept-csc', 'Gabriel', 'Ikyur', 'NON_ACADEMIC', 'Bursar', '2019-06-15', 'FCA, B.Sc Accounting');

-- 3. Students
INSERT OR IGNORE INTO students (id, user_id, division_id, programme_id, current_level, matric_number, admission_year, first_name, middle_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin, blood_group, contact_address, passport_photo_url, qr_code_signature, academic_status) VALUES
('std-001', 'usr-std-001', 'div-nce', 'prog-nce-csc-mth', 100, 'COEKA/2026/NCE/084', 2026, 'Aondoaver', 'Moses', 'Iorliam', 'MALE', '2004-05-12', 'Benue', 'Vandeikya', 'O+', 'Katsina-Ala, Benue State', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'SIG_COEKA_STD_001_QR', 'ACTIVE'),
('std-002', 'usr-std-002', 'div-nce', 'prog-nce-bio-int', 100, 'COEKA/2026/NCE/087', 2026, 'Doose', 'Mercy', 'Gbadu', 'FEMALE', '2005-08-20', 'Benue', 'Gboko', 'A+', 'Makurdi, Benue State', 'https://images.unsplash.com/photo-1517841905240-472988babdf9', 'SIG_COEKA_STD_002_QR', 'ACTIVE'),
('std-003', 'usr-std-003', 'div-degree', 'prog-deg-bed', 100, 'COEKA/2026/DEG/018', 2026, 'Terna', 'Victor', 'Chia', 'MALE', '2003-11-14', 'Benue', 'Katsina-Ala', 'B+', 'Katsina-Ala, Benue State', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6', 'SIG_COEKA_STD_003_QR', 'ACTIVE');

-- 4. Parents & Guardians
INSERT OR IGNORE INTO parents (id, user_id, full_name, occupation, residential_address) VALUES
('par-001', 'usr-par-001', 'Elder Tor Iorliam', 'Civil Servant', 'Gboko Road, Katsina-Ala, Benue State');

-- 5. Link Parent to Ward
INSERT OR IGNORE INTO parent_wards (parent_id, student_id, relationship) VALUES
('par-001', 'std-001', 'FATHER');

-- 6. User Roles Mapping
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
('usr-admin-001', 'role-super-admin'),
('usr-staff-001', 'role-lecturer'),
('usr-dean-001', 'role-dean'),
('usr-bur-001', 'role-bursar'),
('usr-std-001', 'role-student'),
('usr-std-002', 'role-student'),
('usr-std-003', 'role-student'),
('usr-par-001', 'role-parent');
