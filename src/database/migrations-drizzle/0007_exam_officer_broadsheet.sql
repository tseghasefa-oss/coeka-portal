-- Migration 0007: Examination Officer Broadsheet Hub, Academic Audits & Graduation Verification

CREATE TABLE IF NOT EXISTS `broadsheets` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`level` integer NOT NULL,
	`session_id` text NOT NULL,
	`semester_id` text,
	`total_students` integer DEFAULT 0 NOT NULL,
	`passed_count` integer DEFAULT 0 NOT NULL,
	`probation_count` integer DEFAULT 0 NOT NULL,
	`carry_over_count` integer DEFAULT 0 NOT NULL,
	`average_cgpa` real DEFAULT 0.0 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`compiled_by` text,
	`compiled_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`certified_by` text,
	`certified_at` integer,
	`snapshot_json` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`semester_id`) REFERENCES `semesters_terms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`compiled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`certified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `academic_statuses` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`session_id` text NOT NULL,
	`level` integer NOT NULL,
	`gpa` real DEFAULT 0.0 NOT NULL,
	`cgpa` real DEFAULT 0.0 NOT NULL,
	`total_credits_registered` integer DEFAULT 0 NOT NULL,
	`total_credits_passed` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'GOOD_STANDING' NOT NULL,
	`carry_over_courses_json` text,
	`warning_sent` integer DEFAULT 0 NOT NULL,
	`warning_sent_at` integer,
	`remarks` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT `academic_statuses_student_session_unique` UNIQUE(`student_id`, `session_id`)
);

-- Indexes for lightning fast Broadsheet and Probation querying
CREATE INDEX IF NOT EXISTS `idx_broadsheets_dept_level_session` ON `broadsheets` (`department_id`, `level`, `session_id`);
CREATE INDEX IF NOT EXISTS `idx_academic_statuses_student` ON `academic_statuses` (`student_id`);
CREATE INDEX IF NOT EXISTS `idx_academic_statuses_status` ON `academic_statuses` (`status`);
CREATE INDEX IF NOT EXISTS `idx_academic_statuses_cgpa` ON `academic_statuses` (`cgpa`);

-- Log Migration in system_migrations table
INSERT OR IGNORE INTO `system_migrations` (`id`, `migration_file`, `batch`, `applied_at`, `checksum`, `description`, `status`)
VALUES (
  'mig-0007',
  '0007_exam_officer_broadsheet.sql',
  4,
  strftime('%s', 'now'),
  'sha256_d1_0007_exam_officer_broadsheet_hub',
  'Examination Officer Broadsheet Hub, academic audit, probation tracker, and graduation verification',
  'APPLIED'
);
