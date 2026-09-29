-- ============================================================================
-- COEKA DIVISION-SPECIFIC TEST STUDENT SEED SCRIPT
-- ============================================================================
-- Creates 4 distinct test student accounts across all academic divisions:
-- 1. Degree Test  (degree@test.com) -> DEGREE (Tertiary View)
-- 2. NCE Test     (nce@test.com)    -> NCE (Tertiary View)
-- 3. Sec Test     (sec@test.com)    -> SECONDARY (Secondary View)
-- 4. Pri Test     (pri@test.com)    -> PRIMARY (Primary View)
-- Password for all accounts: Pass123!
-- SHA-256 Hash: 46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97
-- ============================================================================

-- 1. Users Table
INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type, is_active, two_factor_enabled) VALUES
('usr-test-degree', 'degree_test', 'degree@test.com', '08090000001', '46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97', 'STUDENT', 1, 0),
('usr-test-nce', 'nce_test', 'nce@test.com', '08090000002', '46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97', 'STUDENT', 1, 0),
('usr-test-sec', 'sec_test', 'sec@test.com', '08090000003', '46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97', 'STUDENT', 1, 0),
('usr-test-pri', 'pri_test', 'pri@test.com', '08090000004', '46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97', 'STUDENT', 1, 0);

-- Update password hashes in case accounts already existed
UPDATE users SET password_hash = '46708f23d682fef9aa996ecbb139bfb6c9ffdc039905ad6ad5c85a88b9411d97' WHERE id IN ('usr-test-degree', 'usr-test-nce', 'usr-test-sec', 'usr-test-pri');

-- 2. User Roles Table
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
('usr-test-degree', 'role-student'),
('usr-test-nce', 'role-student'),
('usr-test-sec', 'role-student'),
('usr-test-pri', 'role-student');

-- 3. Student Profiles Table
INSERT OR IGNORE INTO students (
  id, user_id, division_id, programme_id, current_level, matric_number,
  admission_year, first_name, middle_name, last_name, gender, date_of_birth,
  state_of_origin, lga_of_origin, blood_group, contact_address, passport_photo_url,
  qr_code_signature, academic_status
) VALUES
(
  'std-test-degree',
  'usr-test-degree',
  'div-degree',
  'prog-deg-bed',
  300,
  'COEKA/2026/DEG/901',
  2024,
  'Degree',
  'Undergraduate',
  'Test',
  'MALE',
  '2002-04-15',
  'Benue',
  'Katsina-Ala',
  'O+',
  'Degree Hall Block C, COEKA Main Campus, Katsina-Ala',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  'SIG_COEKA_STD_TEST_DEGREE_QR',
  'ACTIVE'
),
(
  'std-test-nce',
  'usr-test-nce',
  'div-nce',
  'prog-nce-csc-mth',
  200,
  'COEKA/2026/NCE/902',
  2025,
  'NCE',
  'Scholar',
  'Test',
  'FEMALE',
  '2004-09-22',
  'Benue',
  'Vandeikya',
  'A+',
  'Queen Amina Hall, COEKA Campus, Katsina-Ala',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9',
  'SIG_COEKA_STD_TEST_NCE_QR',
  'ACTIVE'
),
(
  'std-test-sec',
  'usr-test-sec',
  'div-secondary',
  'prog-sec-sss',
  200,
  'DSS/2026/SEC/903',
  2025,
  'Sec',
  'Senior',
  'Test',
  'MALE',
  '2009-02-18',
  'Benue',
  'Gboko',
  'B+',
  'Demonstration Secondary School Quarters, Katsina-Ala',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
  'SIG_COEKA_STD_TEST_SEC_QR',
  'ACTIVE'
),
(
  'std-test-pri',
  'usr-test-pri',
  'div-primary',
  'prog-pri-elem',
  4,
  'SPS/2026/PRI/904',
  2023,
  'Pri',
  'Basic',
  'Test',
  'FEMALE',
  '2016-07-10',
  'Benue',
  'Katsina-Ala',
  'O+',
  'Staff Primary School Residences, COEKA Campus, Katsina-Ala',
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1',
  'SIG_COEKA_STD_TEST_PRI_QR',
  'ACTIVE'
);

-- 4. Invoices Table for Students
INSERT OR IGNORE INTO student_invoices (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status) VALUES
('inv-test-deg-01', 'std-test-degree', 'sched-deg-100-tui', 'INV-2026-DEG-901-01', 7500000, 0, 'UNPAID'),
('inv-test-nce-01', 'std-test-nce', 'sched-nce-100-tui', 'INV-2026-NCE-902-01', 4500000, 4500000, 'PAID'),
('inv-test-sec-01', 'std-test-sec', 'sched-nce-100-tui', 'INV-2026-SEC-903-01', 3500000, 0, 'UNPAID'),
('inv-test-pri-01', 'std-test-pri', 'sched-nce-100-tui', 'INV-2026-PRI-904-01', 2500000, 0, 'UNPAID');


