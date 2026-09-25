CREATE TABLE IF NOT EXISTS `notification_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`recipient` text NOT NULL,
	`template_code` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_books` (
	`id` text PRIMARY KEY NOT NULL,
	`isbn` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`publisher` text,
	`publication_year` integer,
	`category` text DEFAULT 'GENERAL' NOT NULL,
	`shelf_location` text NOT NULL,
	`total_copies` integer DEFAULT 1 NOT NULL,
	`available_copies` integer DEFAULT 1 NOT NULL,
	`cover_image_url` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `book_loans` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`student_id` text NOT NULL,
	`staff_id` text,
	`loan_date` text NOT NULL,
	`due_date` text NOT NULL,
	`return_date` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`fine_amount_kobo` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `library_books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_fines` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`loan_id` text,
	`invoice_id` text,
	`amount_kobo` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'UNPAID' NOT NULL,
	`issued_by_staff_id` text,
	`issued_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`loan_id`) REFERENCES `book_loans`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`invoice_id`) REFERENCES `student_invoices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_clearances` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL UNIQUE,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`cleared_by_user_id` text,
	`cleared_at` integer,
	`remarks` text,
	`digital_certificate_hash` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cleared_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Seed Roles and Librarian User
INSERT OR IGNORE INTO roles (id, name, description) VALUES
('role-librarian', 'LIBRARIAN', 'College Library inventory management, book loans, fines and student clearance');
--> statement-breakpoint
INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type, is_active, two_factor_enabled) VALUES
('usr-lib-001', 'librarian_wende', 'library@coeka.edu.ng', '08099990011', 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea', 'STAFF', 1, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO staff_profiles (id, user_id, staff_id_number, department_id, first_name, last_name, cadre, designation, employment_date, highest_qualification) VALUES
('stf-lib-001', 'usr-lib-001', 'COEKA/LIB/001', 'dept-edu-fnd', 'Kwasho', 'Wende', 'NON_ACADEMIC', 'College Librarian', '2017-04-10', 'MLS Library and Information Science');
--> statement-breakpoint
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
('usr-lib-001', 'role-librarian');
--> statement-breakpoint
-- Fee Category & Schedule for Library Penalties
INSERT OR IGNORE INTO fee_categories (id, division_id, name, code, is_recurring) VALUES
('cat-lib-fine', 'div-nce', 'Library Overdue & Damage Penalties', 'LIB-FINE', 0);
--> statement-breakpoint
INSERT OR IGNORE INTO fee_schedules (id, category_id, session_id, level, amount_kobo) VALUES
('sched-lib-fine-default', 'cat-lib-fine', 'sess-2026-2027', 100, 50000);
--> statement-breakpoint
-- Initial Seed Catalog of Academic Textbooks
INSERT OR IGNORE INTO library_books (id, isbn, title, author, publisher, publication_year, category, shelf_location, total_copies, available_copies, cover_image_url) VALUES
('bk-001', '978-978-49012-1-2', 'Fundamentals of Data Structures & Algorithms', 'Prof. O. C. Nwankwo', 'University Press Plc', 2023, 'COMPUTING', 'STACK-CSC-01', 5, 4, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400'),
('bk-002', '978-978-49012-2-9', 'Introduction to Educational Technology & Audio-Visual Pedagogy', 'Dr. B. T. Tyav & Prof. A. Iorliam', 'Spectrum Books Nigeria', 2024, 'EDUCATION', 'STACK-EDU-04', 8, 7, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400'),
('bk-003', '978-978-49012-3-6', 'College Algebra & Trigonometry for Nigerian Educators', 'Prof. B. Uzer', 'Heinemann Educational', 2022, 'SCIENCES', 'STACK-MTH-02', 6, 6, 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400'),
('bk-004', '978-978-49012-4-3', 'Modern Nigerian English & Usage in Higher Education', 'Dr. D. Tyav', 'Longman Nigeria', 2023, 'LANGUAGES', 'STACK-ENG-03', 10, 9, 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400'),
('bk-005', '978-978-49012-5-0', 'Advanced Cellular Biology & Practical Microbiology', 'Dr. T. Kange', 'Evans Brothers Publishing', 2021, 'SCIENCES', 'STACK-BIO-01', 4, 3, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400'),
('bk-006', '978-978-49012-6-7', 'Comprehensive Educational Administration & School Management', 'Prof. S. Tsegha', 'Fruitfulujah Academic Press', 2025, 'EDUCATION', 'STACK-ADM-02', 5, 5, 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400');
--> statement-breakpoint
-- Seed Active and Overdue Loans
INSERT OR IGNORE INTO book_loans (id, book_id, student_id, staff_id, loan_date, due_date, return_date, status, fine_amount_kobo, notes) VALUES
('loan-001', 'bk-001', 'std-001', 'usr-lib-001', '2026-08-10', '2026-08-24', NULL, 'OVERDUE', 150000, 'Student failed to return volume before semester examinations.'),
('loan-002', 'bk-002', 'std-002', 'usr-lib-001', '2026-09-18', '2026-10-02', NULL, 'ACTIVE', 0, 'Standard 14-day loan for course EDU 111 term paper.'),
('loan-003', 'bk-005', 'std-001', 'usr-lib-001', '2026-07-01', '2026-07-15', '2026-07-14', 'RETURNED', 0, 'Returned in pristine condition.');
--> statement-breakpoint
-- Seed Initial Clearance for std-003 (who has no outstanding liabilities)
INSERT OR IGNORE INTO library_clearances (id, student_id, status, cleared_by_user_id, cleared_at, remarks, digital_certificate_hash) VALUES
('clr-std-003', 'std-003', 'CLEARED', 'usr-lib-001', 1790250000, 'All library inventory returned intact and verified zero fine liability.', 'hash_lib_cleared_std_003_9941a');
