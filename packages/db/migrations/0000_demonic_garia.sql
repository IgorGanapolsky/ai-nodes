CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`api_key` text,
	`api_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`version` text,
	`location` text,
	`hardware` text,
	`bandwidth` real,
	`storage` real,
	`is_online` integer DEFAULT false NOT NULL,
	`last_seen` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nodes_owner_id_idx` ON `nodes` (`owner_id`);--> statement-breakpoint
CREATE INDEX `nodes_type_idx` ON `nodes` (`type`);--> statement-breakpoint
CREATE INDEX `nodes_status_idx` ON `nodes` (`status`);--> statement-breakpoint
CREATE INDEX `nodes_is_online_idx` ON `nodes` (`is_online`);--> statement-breakpoint
CREATE TABLE `earnings` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`crypto_amount` real,
	`crypto_currency` text,
	`exchange_rate` real,
	`source` text,
	`transaction_hash` text,
	`block_height` integer,
	`earning_type` text DEFAULT 'other' NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`paid_at` integer,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `earnings_node_id_idx` ON `earnings` (`node_id`);--> statement-breakpoint
CREATE INDEX `earnings_timestamp_idx` ON `earnings` (`timestamp`);--> statement-breakpoint
CREATE INDEX `earnings_currency_idx` ON `earnings` (`currency`);--> statement-breakpoint
CREATE INDEX `earnings_earning_type_idx` ON `earnings` (`earning_type`);--> statement-breakpoint
CREATE INDEX `earnings_is_paid_idx` ON `earnings` (`is_paid`);--> statement-breakpoint
CREATE INDEX `earnings_node_timestamp_idx` ON `earnings` (`node_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`cpu_usage` real,
	`cpu_cores` integer,
	`cpu_frequency` real,
	`cpu_temperature` real,
	`memory_usage` real,
	`memory_total` real,
	`memory_used` real,
	`memory_free` real,
	`storage_usage` real,
	`storage_total` real,
	`storage_used` real,
	`storage_free` real,
	`storage_iops` real,
	`bandwidth_up` real,
	`bandwidth_down` real,
	`network_latency` real,
	`packet_loss` real,
	`uptime` integer,
	`connections` integer,
	`requests_per_second` real,
	`error_rate` real,
	`sync_status` real,
	`block_height` integer,
	`peer_count` integer,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `metrics_node_id_idx` ON `metrics` (`node_id`);--> statement-breakpoint
CREATE INDEX `metrics_timestamp_idx` ON `metrics` (`timestamp`);--> statement-breakpoint
CREATE INDEX `metrics_node_timestamp_idx` ON `metrics` (`node_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `metrics_cpu_usage_idx` ON `metrics` (`cpu_usage`);--> statement-breakpoint
CREATE INDEX `metrics_memory_usage_idx` ON `metrics` (`memory_usage`);--> statement-breakpoint
CREATE INDEX `metrics_storage_usage_idx` ON `metrics` (`storage_usage`);--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`type` text NOT NULL,
	`severity` text DEFAULT 'medium' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`resolved` integer DEFAULT false NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	`acknowledged_at` integer,
	`acknowledged_by` text,
	`notification_sent` integer DEFAULT false NOT NULL,
	`notification_channels` text,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `alerts_node_id_idx` ON `alerts` (`node_id`);--> statement-breakpoint
CREATE INDEX `alerts_type_idx` ON `alerts` (`type`);--> statement-breakpoint
CREATE INDEX `alerts_severity_idx` ON `alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `alerts_resolved_idx` ON `alerts` (`resolved`);--> statement-breakpoint
CREATE INDEX `alerts_timestamp_idx` ON `alerts` (`timestamp`);--> statement-breakpoint
CREATE INDEX `alerts_node_resolved_idx` ON `alerts` (`node_id`,`resolved`);--> statement-breakpoint
CREATE TABLE `revenue_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`percentage` real NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`period` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`total_earnings` real NOT NULL,
	`share_type` text DEFAULT 'owner' NOT NULL,
	`recipient_id` text,
	`recipient_address` text,
	`paid_out` integer DEFAULT false NOT NULL,
	`paid_at` integer,
	`transaction_hash` text,
	`notes` text,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `revenue_shares_node_id_idx` ON `revenue_shares` (`node_id`);--> statement-breakpoint
CREATE INDEX `revenue_shares_period_idx` ON `revenue_shares` (`period`);--> statement-breakpoint
CREATE INDEX `revenue_shares_share_type_idx` ON `revenue_shares` (`share_type`);--> statement-breakpoint
CREATE INDEX `revenue_shares_paid_out_idx` ON `revenue_shares` (`paid_out`);--> statement-breakpoint
CREATE INDEX `revenue_shares_recipient_id_idx` ON `revenue_shares` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `revenue_shares_period_range_idx` ON `revenue_shares` (`period_start`,`period_end`);--> statement-breakpoint
CREATE INDEX `revenue_shares_node_period_idx` ON `revenue_shares` (`node_id`,`period`);