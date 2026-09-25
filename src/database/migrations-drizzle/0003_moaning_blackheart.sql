CREATE TABLE `course_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`student_id` text NOT NULL,
	`lecture_date` text NOT NULL,
	`status` text DEFAULT 'PRESENT' NOT NULL,
	`marked_by_staff_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_attendance_course_id_student_id_lecture_date_unique` ON `course_attendance` (`course_id`,`student_id`,`lecture_date`);--> statement-breakpoint
CREATE TABLE `grade_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`student_id` text NOT NULL,
	`session_id` text,
	`ca1_score` real DEFAULT 0,
	`ca2_score` real DEFAULT 0,
	`exam_score` real DEFAULT 0,
	`total_score` real DEFAULT 0,
	`letter_grade` text,
	`grade_point` real,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`lecturer_staff_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grade_entries_course_id_student_id_unique` ON `grade_entries` (`course_id`,`student_id`);