CREATE TABLE `result_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`session_id` text,
	`dean_user_id` text NOT NULL,
	`total_students_approved` integer DEFAULT 0 NOT NULL,
	`approval_status` text DEFAULT 'APPROVED' NOT NULL,
	`comments` text,
	`approved_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dean_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student_appeals` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`grade_entry_id` text,
	`reason` text NOT NULL,
	`desired_correction` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`decision_notes` text,
	`resolved_by_dean_id` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`grade_entry_id`) REFERENCES `grade_entries`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`resolved_by_dean_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
