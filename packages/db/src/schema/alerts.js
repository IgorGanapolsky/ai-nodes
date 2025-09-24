import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { nodes } from './nodes';
export const alerts = sqliteTable('alerts', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    nodeId: text('node_id')
        .notNull()
        .references(() => nodes.id, { onDelete: 'cascade' }),
    type: text('type', {
        enum: [
            'offline',
            'high_cpu',
            'high_memory',
            'low_storage',
            'network_issues',
            'sync_error',
            'earning_drop',
            'security_warning',
            'maintenance_required',
            'custom'
        ]
    }).notNull(),
    severity: text('severity', {
        enum: ['low', 'medium', 'high', 'critical']
    }).notNull().default('medium'),
    title: text('title').notNull(),
    message: text('message').notNull(),
    details: text('details'), // JSON string for additional data
    resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
    resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
    resolvedBy: text('resolved_by'), // User ID who resolved it
    acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
    acknowledgedBy: text('acknowledged_by'), // User ID who acknowledged it
    notificationSent: integer('notification_sent', { mode: 'boolean' }).notNull().default(false),
    notificationChannels: text('notification_channels'), // JSON array of channels
    timestamp: integer('timestamp', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`)
        .$onUpdate(() => new Date()),
}, (table) => ({
    nodeIdIdx: index('alerts_node_id_idx').on(table.nodeId),
    typeIdx: index('alerts_type_idx').on(table.type),
    severityIdx: index('alerts_severity_idx').on(table.severity),
    resolvedIdx: index('alerts_resolved_idx').on(table.resolved),
    timestampIdx: index('alerts_timestamp_idx').on(table.timestamp),
    nodeResolvedIdx: index('alerts_node_resolved_idx').on(table.nodeId, table.resolved),
}));
