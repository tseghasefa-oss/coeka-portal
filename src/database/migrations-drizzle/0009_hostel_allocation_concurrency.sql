-- Migration 0009: High-Concurrency Hostel Allocation, 15-Minute Reservation Locks, and Warden Controls

CREATE TABLE IF NOT EXISTS `allocation_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`bedspace_id` text NOT NULL,
	`locked_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'LOCKED' NOT NULL CHECK(`status` IN ('LOCKED', 'CONFIRMED', 'EXPIRED', 'RELEASED')),
	`payment_reference` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bedspace_id`) REFERENCES `hostel_bedspaces`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_allocation_locks_bedspace` ON `allocation_locks` (`bedspace_id`, `status`, `expires_at`);
CREATE INDEX IF NOT EXISTS `idx_allocation_locks_student` ON `allocation_locks` (`student_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_allocation_locks_status` ON `allocation_locks` (`status`);

-- Recreate hostel_allocations to ensure flexible payment_reference and nullable transaction_id
DROP TABLE IF EXISTS `hostel_allocations`;
CREATE TABLE `hostel_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`bedspace_id` text NOT NULL,
	`student_id` text NOT NULL,
	`session_id` text NOT NULL,
	`transaction_id` text,
	`payment_reference` text,
	`warden_staff_id` text,
	`notes` text,
	`allocated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL CHECK(`status` IN ('ACTIVE', 'CHECKED_OUT', 'REVOKED', 'RELOCATED')),
	FOREIGN KEY (`bedspace_id`) REFERENCES `hostel_bedspaces`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE restrict
);

CREATE INDEX IF NOT EXISTS `idx_hostel_allocations_bedspace` ON `hostel_allocations` (`bedspace_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_hostel_allocations_student` ON `hostel_allocations` (`student_id`, `status`);

-- Ensure price_kobo is present on hostel_rooms (already provisioned in production database)
-- ALTER TABLE `hostel_rooms` ADD COLUMN `price_kobo` integer DEFAULT 2000000 NOT NULL;

-- Log Migration in system_migrations table
INSERT OR IGNORE INTO `system_migrations` (`id`, `migration_file`, `batch`, `applied_at`, `checksum`, `description`, `status`)
VALUES (
  'mig-0009',
  '0009_hostel_allocation_concurrency.sql',
  6,
  strftime('%s', 'now'),
  'sha256_d1_0009_hostel_allocation_concurrency',
  'High-concurrency hostel bed allocation, 15-minute atomic reservation locks, and warden management',
  'APPLIED'
);
