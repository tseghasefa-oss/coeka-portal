CREATE TABLE `academic_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_current` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academic_sessions_name_unique` ON `academic_sessions` (`name`);--> statement-breakpoint
CREATE TABLE `admissions_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`division_id` text NOT NULL,
	`name` text NOT NULL,
	`application_fee_kobo` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_open` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`programme_id` text NOT NULL,
	`application_number` text NOT NULL,
	`jamb_registration_number` text,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`gender` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`state_of_origin` text NOT NULL,
	`lga_of_origin` text NOT NULL,
	`passport_photo_url` text,
	`o_level_data_json` text,
	`status` text DEFAULT 'SUBMITTED' NOT NULL,
	`admission_letter_url` text,
	`acceptance_fee_paid` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `admissions_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_application_number_unique` ON `applications` (`application_number`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_name` text NOT NULL,
	`entity_id` text NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text NOT NULL,
	`old_value_json` text,
	`new_value_json` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`signature` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `course_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`semester_id` text NOT NULL,
	`course_id` text NOT NULL,
	`registered_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`is_approved_by_adviser` integer DEFAULT 0 NOT NULL,
	`adviser_staff_id` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`semester_id`) REFERENCES `semesters_terms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_registrations_student_id_semester_id_course_id_unique` ON `course_registrations` (`student_id`,`semester_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`programme_id` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`credit_units` integer NOT NULL,
	`level` integer NOT NULL,
	`semester_term` integer NOT NULL,
	`is_compulsory` integer DEFAULT 1 NOT NULL,
	`prerequisite_course_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_programme_id_code_unique` ON `courses` (`programme_id`,`code`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`hod_staff_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools_faculties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_code_unique` ON `departments` (`code`);--> statement-breakpoint
CREATE TABLE `divisions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`grading_policy` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `divisions_name_unique` ON `divisions` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `divisions_code_unique` ON `divisions` (`code`);--> statement-breakpoint
CREATE TABLE `fee_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`division_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`is_recurring` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fee_categories_code_unique` ON `fee_categories` (`code`);--> statement-breakpoint
CREATE TABLE `fee_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`session_id` text NOT NULL,
	`level` integer NOT NULL,
	`amount_kobo` integer NOT NULL,
	`due_date` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `fee_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hostel_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`bedspace_id` text NOT NULL,
	`student_id` text NOT NULL,
	`session_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`allocated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	FOREIGN KEY (`bedspace_id`) REFERENCES `hostel_bedspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hostel_allocations_transaction_id_unique` ON `hostel_allocations` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `hostel_bedspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`bed_label` text NOT NULL,
	`is_occupied` integer DEFAULT 0 NOT NULL,
	`reserved_until` integer,
	FOREIGN KEY (`room_id`) REFERENCES `hostel_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hostel_bedspaces_room_id_bed_label_unique` ON `hostel_bedspaces` (`room_id`,`bed_label`);--> statement-breakpoint
CREATE TABLE `hostel_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`hostel_id` text NOT NULL,
	`room_number` text NOT NULL,
	`capacity` integer NOT NULL,
	`floor_number` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`hostel_id`) REFERENCES `hostels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hostel_rooms_hostel_id_room_number_unique` ON `hostel_rooms` (`hostel_id`,`room_number`);--> statement-breakpoint
CREATE TABLE `hostels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`total_capacity` integer NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hostels_name_unique` ON `hostels` (`name`);--> statement-breakpoint
CREATE TABLE `notification_queue` (
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
CREATE TABLE `parent_wards` (
	`parent_id` text NOT NULL,
	`student_id` text NOT NULL,
	`relationship` text NOT NULL,
	PRIMARY KEY(`parent_id`, `student_id`),
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`full_name` text NOT NULL,
	`occupation` text,
	`residential_address` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parents_user_id_unique` ON `parents` (`user_id`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`module` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_unique` ON `permissions` (`code`);--> statement-breakpoint
CREATE TABLE `programmes` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`duration_years` integer DEFAULT 3 NOT NULL,
	`total_semesters` integer DEFAULT 6 NOT NULL,
	`qualification_awarded` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `programmes_code_unique` ON `programmes` (`code`);--> statement-breakpoint
CREATE TABLE `result_approval_audits` (
	`id` text PRIMARY KEY NOT NULL,
	`semester_id` text NOT NULL,
	`department_id` text NOT NULL,
	`level` integer NOT NULL,
	`stage` text NOT NULL,
	`actor_staff_id` text NOT NULL,
	`action_timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`digital_signature` text NOT NULL,
	`comments` text,
	FOREIGN KEY (`semester_id`) REFERENCES `semesters_terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `schools_faculties` (
	`id` text PRIMARY KEY NOT NULL,
	`division_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`dean_staff_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_faculties_code_unique` ON `schools_faculties` (`code`);--> statement-breakpoint
CREATE TABLE `semesters_terms` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`division_id` text NOT NULL,
	`name` text NOT NULL,
	`term_number` integer NOT NULL,
	`is_current` integer DEFAULT 0 NOT NULL,
	`registration_open` integer DEFAULT 0 NOT NULL,
	`result_upload_open` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `staff_course_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`course_id` text NOT NULL,
	`semester_id` text NOT NULL,
	`role` text DEFAULT 'PRIMARY_LECTURER' NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`semester_id`) REFERENCES `semesters_terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_course_allocations_staff_id_course_id_semester_id_unique` ON `staff_course_allocations` (`staff_id`,`course_id`,`semester_id`);--> statement-breakpoint
CREATE TABLE `staff_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`staff_id_number` text NOT NULL,
	`department_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`cadre` text NOT NULL,
	`designation` text NOT NULL,
	`employment_date` text NOT NULL,
	`highest_qualification` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_profiles_user_id_unique` ON `staff_profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `staff_profiles_staff_id_number_unique` ON `staff_profiles` (`staff_id_number`);--> statement-breakpoint
CREATE TABLE `student_grades` (
	`id` text PRIMARY KEY NOT NULL,
	`registration_id` text NOT NULL,
	`ca_score` real,
	`exam_score` real,
	`total_score` real,
	`letter_grade` text,
	`grade_point` real,
	`is_resit` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`registration_id`) REFERENCES `course_registrations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_grades_registration_id_unique` ON `student_grades` (`registration_id`);--> statement-breakpoint
CREATE TABLE `student_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`fee_schedule_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`amount_due_kobo` integer NOT NULL,
	`amount_paid_kobo` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'UNPAID' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fee_schedule_id`) REFERENCES `fee_schedules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_invoices_invoice_number_unique` ON `student_invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `student_virtual_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`account_name` text NOT NULL,
	`provider` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_virtual_accounts_student_id_unique` ON `student_virtual_accounts` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `student_virtual_accounts_account_number_unique` ON `student_virtual_accounts` (`account_number`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`division_id` text NOT NULL,
	`programme_id` text NOT NULL,
	`current_level` integer NOT NULL,
	`matric_number` text NOT NULL,
	`admission_year` integer NOT NULL,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`gender` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`state_of_origin` text NOT NULL,
	`lga_of_origin` text NOT NULL,
	`blood_group` text,
	`contact_address` text NOT NULL,
	`passport_photo_url` text NOT NULL,
	`qr_code_signature` text NOT NULL,
	`academic_status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_matric_number_unique` ON `students` (`matric_number`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`reference` text NOT NULL,
	`gateway` text NOT NULL,
	`gateway_reference` text,
	`type` text NOT NULL,
	`amount_kobo` integer NOT NULL,
	`service_charge_kobo` integer DEFAULT 0 NOT NULL,
	`settlement_status` text DEFAULT 'PENDING' NOT NULL,
	`cryptographic_signature` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`reconciled_at` integer,
	FOREIGN KEY (`invoice_id`) REFERENCES `student_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_reference_unique` ON `transactions` (`reference`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`phone_number` text NOT NULL,
	`password_hash` text NOT NULL,
	`user_type` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`two_factor_secret` text,
	`two_factor_enabled` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_number_unique` ON `users` (`phone_number`);