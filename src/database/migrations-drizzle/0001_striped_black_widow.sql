CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'GENERAL' NOT NULL,
	`updated_by` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
