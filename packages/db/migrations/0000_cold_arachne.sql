CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`device_id` text,
	`type` text NOT NULL,
	`severity` text DEFAULT 'medium' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`resolved` integer DEFAULT false NOT NULL,
	`resolved_at` integer,
	`acknowledged_at` integer,
	`notification_sent` integer DEFAULT false NOT NULL,
	`notification_channels` text,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `alerts_owner_id_idx` ON `alerts` (`owner_id`);--> statement-breakpoint
CREATE INDEX `alerts_device_id_idx` ON `alerts` (`device_id`);--> statement-breakpoint
CREATE INDEX `alerts_type_idx` ON `alerts` (`type`);--> statement-breakpoint
CREATE INDEX `alerts_severity_idx` ON `alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `alerts_resolved_idx` ON `alerts` (`resolved`);--> statement-breakpoint
CREATE INDEX `alerts_timestamp_idx` ON `alerts` (`timestamp`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`label` text NOT NULL,
	`marketplace` text NOT NULL,
	`external_id` text NOT NULL,
	`hourly_price_usd` real,
	`region` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `devices_owner_id_idx` ON `devices` (`owner_id`);--> statement-breakpoint
CREATE INDEX `devices_marketplace_idx` ON `devices` (`marketplace`);--> statement-breakpoint
CREATE INDEX `devices_active_idx` ON `devices` (`active`);--> statement-breakpoint
CREATE INDEX `devices_external_id_idx` ON `devices` (`external_id`);--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`cpu_usage` real,
	`memory_usage` real,
	`gpu_usage` real,
	`storage_usage` real,
	`earnings_usd` real,
	`utilization_hours` real,
	`uptime` real,
	`bandwidth_up` real,
	`bandwidth_down` real,
	`latency` real,
	`temperature` real,
	`power_usage` real,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `metrics_device_id_idx` ON `metrics` (`device_id`);--> statement-breakpoint
CREATE INDEX `metrics_timestamp_idx` ON `metrics` (`timestamp`);--> statement-breakpoint
CREATE INDEX `metrics_device_timestamp_idx` ON `metrics` (`device_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `owners` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`discord_webhook` text,
	`rev_share_pct` real DEFAULT 0.15 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `owners_email_unique` ON `owners` (`email`);--> statement-breakpoint
CREATE INDEX `owners_email_idx` ON `owners` (`email`);--> statement-breakpoint
CREATE TABLE `statements` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`device_id` text,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`gross_earnings_usd` real DEFAULT 0 NOT NULL,
	`platform_fee_pct` real DEFAULT 0.15 NOT NULL,
	`platform_fee_usd` real DEFAULT 0 NOT NULL,
	`owner_earnings_usd` real DEFAULT 0 NOT NULL,
	`total_utilization_hours` real DEFAULT 0 NOT NULL,
	`average_hourly_rate` real,
	`uptime_percentage` real,
	`marketplace` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `statements_owner_id_idx` ON `statements` (`owner_id`);--> statement-breakpoint
CREATE INDEX `statements_device_id_idx` ON `statements` (`device_id`);--> statement-breakpoint
CREATE INDEX `statements_period_idx` ON `statements` (`period_start`,`period_end`);--> statement-breakpoint
CREATE INDEX `statements_status_idx` ON `statements` (`status`);