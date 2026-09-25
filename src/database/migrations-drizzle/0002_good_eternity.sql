CREATE TABLE `debt_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`outstanding_amount_kobo` integer NOT NULL,
	`severity` text DEFAULT 'WARNING' NOT NULL,
	`channel` text DEFAULT 'PORTAL' NOT NULL,
	`sent_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`is_resolved` integer DEFAULT 0 NOT NULL,
	`resolved_at` integer,
	`notes` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `student_invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payment_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_number` text NOT NULL,
	`transaction_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`student_id` text NOT NULL,
	`amount_paid_kobo` integer NOT NULL,
	`balance_remaining_kobo` integer DEFAULT 0 NOT NULL,
	`issued_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`issued_by_staff_id` text NOT NULL,
	`verification_hash` text NOT NULL,
	`qr_code_url` text,
	`metadata_json` text,
	FOREIGN KEY (`transaction_id`) REFERENCES `payment_transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `student_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_receipt_number_unique` ON `payment_receipts` (`receipt_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_transaction_id_unique` ON `payment_receipts` (`transaction_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_verification_hash_unique` ON `payment_receipts` (`verification_hash`);--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text,
	`invoice_id` text,
	`transaction_reference` text NOT NULL,
	`bank_reference` text,
	`payment_channel` text NOT NULL,
	`amount_kobo` integer NOT NULL,
	`channel_fee_kobo` integer DEFAULT 0 NOT NULL,
	`net_amount_kobo` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`payer_name` text,
	`payer_phone` text,
	`reconciled_by_staff_id` text,
	`reconciled_at` integer,
	`reconciliation_notes` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `student_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_transactions_transaction_reference_unique` ON `payment_transactions` (`transaction_reference`);