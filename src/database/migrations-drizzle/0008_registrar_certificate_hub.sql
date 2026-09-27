-- Migration 0008: Registrar & Certificate Issuance Hub, Public Credential Verification, Transcript Pipeline, and Alumni Archives

CREATE TABLE IF NOT EXISTS `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`certificate_number` text NOT NULL UNIQUE,
	`qualification_awarded` text NOT NULL,
	`programme_name` text NOT NULL,
	`division` text NOT NULL,
	`honors_classification` text NOT NULL,
	`final_cgpa` real NOT NULL,
	`conferment_date` text NOT NULL,
	`issued_by` text,
	`issued_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`qr_verification_hash` text NOT NULL UNIQUE,
	`digital_signature` text NOT NULL,
	`status` text DEFAULT 'VALID' NOT NULL,
	`revocation_reason` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `transcript_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`recipient_name` text NOT NULL,
	`recipient_address` text NOT NULL,
	`recipient_email` text,
	`delivery_method` text DEFAULT 'ELECTRONIC' NOT NULL,
	`fee_amount_kobo` integer DEFAULT 500000 NOT NULL,
	`payment_reference` text,
	`status` text DEFAULT 'PAID' NOT NULL,
	`processed_by` text,
	`tracking_number` text,
	`dispatch_notes` text,
	`requested_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`processed_at` integer,
	`dispatched_at` integer,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `student_archives` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL UNIQUE,
	`graduation_year` integer NOT NULL,
	`qualification_awarded` text NOT NULL,
	`honors_classification` text NOT NULL,
	`final_cgpa` real NOT NULL,
	`certificate_number` text,
	`archive_status` text DEFAULT 'ALUMNI' NOT NULL,
	`archived_by` text,
	`archived_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`dossier_summary_json` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`archived_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

-- Fast indexes for certificate lookup, employer verification, and alumni search
CREATE INDEX IF NOT EXISTS `idx_certificates_student_id` ON `certificates` (`student_id`);
CREATE INDEX IF NOT EXISTS `idx_certificates_cert_number` ON `certificates` (`certificate_number`);
CREATE INDEX IF NOT EXISTS `idx_certificates_qr_hash` ON `certificates` (`qr_verification_hash`);
CREATE INDEX IF NOT EXISTS `idx_certificates_status` ON `certificates` (`status`);

CREATE INDEX IF NOT EXISTS `idx_transcripts_student_id` ON `transcript_requests` (`student_id`);
CREATE INDEX IF NOT EXISTS `idx_transcripts_status` ON `transcript_requests` (`status`);

CREATE INDEX IF NOT EXISTS `idx_student_archives_student_id` ON `student_archives` (`student_id`);
CREATE INDEX IF NOT EXISTS `idx_student_archives_year` ON `student_archives` (`graduation_year`);
CREATE INDEX IF NOT EXISTS `idx_student_archives_status` ON `student_archives` (`archive_status`);

-- Log Migration in system_migrations table
INSERT OR IGNORE INTO `system_migrations` (`id`, `migration_file`, `batch`, `applied_at`, `checksum`, `description`, `status`)
VALUES (
  'mig-0008',
  '0008_registrar_certificate_hub.sql',
  5,
  strftime('%s', 'now'),
  'sha256_d1_0008_registrar_certificate_hub',
  'Registrar Certificate Issuance, public verification, transcript queue, and alumni file archive hub',
  'APPLIED'
);
