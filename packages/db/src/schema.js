import { text, integer, real, sqliteTable, index } from 'drizzle-orm/sqlite-core';
// Owner table
export const owners = sqliteTable(
  'owners',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    displayName: text('display_name').notNull(),
    email: text('email').notNull().unique(),
    discordWebhook: text('discord_webhook'),
    revSharePct: real('rev_share_pct').notNull().default(0.15),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    emailIdx: index('owners_email_idx').on(table.email),
  }),
);
// Device table
export const devices = sqliteTable(
  'devices',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text('owner_id')
      .notNull()
      .references(() => owners.id),
    label: text('label').notNull(),
    marketplace: text('marketplace').notNull(), // ionet, nosana, render, etc
    externalId: text('external_id').notNull(),
    hourlyPriceUsd: real('hourly_price_usd'),
    region: text('region'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ownerIdIdx: index('devices_owner_id_idx').on(table.ownerId),
    marketplaceIdx: index('devices_marketplace_idx').on(table.marketplace),
    activeIdx: index('devices_active_idx').on(table.active),
    externalIdIdx: index('devices_external_id_idx').on(table.externalId),
  }),
);
// Metric table
export const metrics = sqliteTable(
  'metrics',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    deviceId: text('device_id')
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    // Core performance metrics
    cpuUsage: real('cpu_usage'), // Percentage 0-100
    memoryUsage: real('memory_usage'), // Percentage 0-100
    gpuUsage: real('gpu_usage'), // Percentage 0-100
    storageUsage: real('storage_usage'), // Percentage 0-100
    // Earnings and utilization
    earningsUsd: real('earnings_usd'), // USD earned in this period
    utilizationHours: real('utilization_hours'), // Hours utilized
    uptime: real('uptime'), // Uptime percentage 0-100
    // Network metrics
    bandwidthUp: real('bandwidth_up'), // Mbps
    bandwidthDown: real('bandwidth_down'), // Mbps
    latency: real('latency'), // ms
    // Temperatures and power
    temperature: real('temperature'), // Celsius
    powerUsage: real('power_usage'), // Watts
    timestamp: integer('timestamp', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    deviceIdIdx: index('metrics_device_id_idx').on(table.deviceId),
    timestampIdx: index('metrics_timestamp_idx').on(table.timestamp),
    deviceTimestampIdx: index('metrics_device_timestamp_idx').on(table.deviceId, table.timestamp),
  }),
);
// Statement table
export const statements = sqliteTable(
  'statements',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text('owner_id')
      .notNull()
      .references(() => owners.id),
    deviceId: text('device_id').references(() => devices.id),
    // Statement period
    periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
    periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
    // Financial data
    grossEarningsUsd: real('gross_earnings_usd').notNull().default(0),
    platformFeePct: real('platform_fee_pct').notNull().default(0.15),
    platformFeeUsd: real('platform_fee_usd').notNull().default(0),
    ownerEarningsUsd: real('owner_earnings_usd').notNull().default(0),
    // Operational data
    totalUtilizationHours: real('total_utilization_hours').notNull().default(0),
    averageHourlyRate: real('average_hourly_rate'),
    uptimePercentage: real('uptime_percentage'),
    // Metadata
    marketplace: text('marketplace'), // Which marketplace generated these earnings
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull().default('pending'), // pending, processed, paid
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ownerIdIdx: index('statements_owner_id_idx').on(table.ownerId),
    deviceIdIdx: index('statements_device_id_idx').on(table.deviceId),
    periodIdx: index('statements_period_idx').on(table.periodStart, table.periodEnd),
    statusIdx: index('statements_status_idx').on(table.status),
  }),
);
// Alert table
export const alerts = sqliteTable(
  'alerts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text('owner_id')
      .notNull()
      .references(() => owners.id),
    deviceId: text('device_id').references(() => devices.id), // Can be null for owner-level alerts
    type: text('type', {
      enum: [
        'device_offline',
        'low_earnings',
        'high_temperature',
        'maintenance_required',
        'payment_received',
        'performance_degraded',
        'marketplace_issue',
        'custom',
      ],
    }).notNull(),
    severity: text('severity', {
      enum: ['low', 'medium', 'high', 'critical'],
    })
      .notNull()
      .default('medium'),
    title: text('title').notNull(),
    message: text('message').notNull(),
    details: text('details'), // JSON string for additional data
    // Alert state
    resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
    resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
    acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
    // Notification tracking
    notificationSent: integer('notification_sent', { mode: 'boolean' }).notNull().default(false),
    notificationChannels: text('notification_channels'), // JSON array of channels (discord, email, etc)
    timestamp: integer('timestamp', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    ownerIdIdx: index('alerts_owner_id_idx').on(table.ownerId),
    deviceIdIdx: index('alerts_device_id_idx').on(table.deviceId),
    typeIdx: index('alerts_type_idx').on(table.type),
    severityIdx: index('alerts_severity_idx').on(table.severity),
    resolvedIdx: index('alerts_resolved_idx').on(table.resolved),
    timestampIdx: index('alerts_timestamp_idx').on(table.timestamp),
  }),
);
//# sourceMappingURL=schema.js.map
