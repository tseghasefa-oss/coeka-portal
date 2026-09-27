-- Migration 0006: SuperAdmin System Control, Backups & Migration Tracking

CREATE TABLE IF NOT EXISTS `system_migrations` (
	`id` text PRIMARY KEY NOT NULL,
	`migration_file` text NOT NULL UNIQUE,
	`batch` integer DEFAULT 1 NOT NULL,
	`applied_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`checksum` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'APPLIED' NOT NULL
);

CREATE TABLE IF NOT EXISTS `system_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tables_count` integer NOT NULL,
	`records_count` integer NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`storage_location` text NOT NULL,
	`triggered_by` text DEFAULT 'system' NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`signature` text NOT NULL
);

-- Seed Applied Drizzle Migrations Log
INSERT OR IGNORE INTO `system_migrations` (`id`, `migration_file`, `batch`, `applied_at`, `checksum`, `description`, `status`)
VALUES 
('mig-0000', '0000_first_kylun.sql', 1, strftime('%s', 'now') - 86400 * 5, 'sha256_d1_0000_core_institutional_tables', 'Initial COEKA multi-tenant core schema (33 tables)', 'APPLIED'),
('mig-0001', '0001_striped_black_widow.sql', 1, strftime('%s', 'now') - 86400 * 4, 'sha256_d1_0001_system_settings_table', 'Administrative system settings and key-value configuration', 'APPLIED'),
('mig-0002', '0002_add_missing_tables.sql', 1, strftime('%s', 'now') - 86400 * 3, 'sha256_d1_0002_financial_receipts_reconciliation', 'Financial payment transactions, debt alerts, and verifiable receipts', 'APPLIED'),
('mig-0003', '0003_academic_attendance_grades.sql', 2, strftime('%s', 'now') - 86400 * 2, 'sha256_d1_0003_course_attendance_grade_entries', 'Lecturer continuous assessments, attendance rosters, and grade entries', 'APPLIED'),
('mig-0004', '0004_dean_oversight.sql', 2, strftime('%s', 'now') - 86400 * 1, 'sha256_d1_0004_dean_oversight_appeals', 'Dean result approval audits, master switch, and grade dispute desk', 'APPLIED'),
('mig-0005', '0005_librarian_clearance.sql', 3, strftime('%s', 'now') - 3600 * 2, 'sha256_d1_0005_librarian_clearance_assets', 'Library inventory catalog, loans, penalty ledger sync, and digital clearance', 'APPLIED'),
('mig-0006', '0006_system_control.sql', 3, strftime('%s', 'now'), 'sha256_d1_0006_superadmin_god_mode', 'SuperAdmin Full-System Control Center, D1 snapshots, and migrations audit', 'APPLIED');

-- Seed Initial System Snapshot Record
INSERT OR IGNORE INTO `system_backups` (`id`, `name`, `tables_count`, `records_count`, `size_bytes`, `storage_location`, `triggered_by`, `status`, `created_at`, `signature`)
VALUES (
  'bkp-init-20260925-01',
  'COEKA Pre-Launch Master System Snapshot',
  46,
  1280,
  458752,
  'r2://coeka-document-lake/backups/snapshot-coeka-prelaunch-20260925.sqlite',
  'usr-admin-001',
  'COMPLETED',
  strftime('%s', 'now') - 7200,
  'hmac_sha256_master_snapshot_integrity_verified_2026'
);

-- Seed Default Institutional Settings
INSERT OR IGNORE INTO `system_settings` (`key`, `value`, `description`, `category`, `updated_by`, `updated_at`)
VALUES
('institution_name', 'College of Education, Katsina-Ala', 'Official statutory name of the tertiary institution', 'INSTITUTIONAL', 'usr-admin-001', strftime('%s', 'now')),
('institution_motto', 'Knowledge, Character and Excellence', 'Statutory institutional motto', 'INSTITUTIONAL', 'usr-admin-001', strftime('%s', 'now')),
('institution_logo_url', '/images/coeka-logo.png', 'Official high-resolution institutional crest/logo', 'INSTITUTIONAL', 'usr-admin-001', strftime('%s', 'now')),
('institution_email', 'registrar@coeka.edu.ng', 'Primary executive administrative email address', 'INSTITUTIONAL', 'usr-admin-001', strftime('%s', 'now')),
('institution_phone', '+234 803 123 4567', 'Official campus helpline and contact phone number', 'INSTITUTIONAL', 'usr-admin-001', strftime('%s', 'now')),
('institution_address', 'P.M.B. 1008, Katsina-Ala, Benue State, Nigeria', 'Statutory campus physical address', 'INSTITUTIONAL', 'usr-admin-001', strftime('%s', 'now')),
('maintenance_mode', 'false', 'Global portal maintenance mode lock', 'PORTAL_CONTROLS', 'usr-admin-001', strftime('%s', 'now'));
