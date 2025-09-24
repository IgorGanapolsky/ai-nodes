import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { nodes } from './nodes';
export const metrics = sqliteTable('metrics', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    nodeId: text('node_id')
        .notNull()
        .references(() => nodes.id, { onDelete: 'cascade' }),
    // CPU Metrics
    cpuUsage: real('cpu_usage'), // Percentage 0-100
    cpuCores: integer('cpu_cores'),
    cpuFrequency: real('cpu_frequency'), // GHz
    cpuTemperature: real('cpu_temperature'), // Celsius
    // Memory Metrics
    memoryUsage: real('memory_usage'), // Percentage 0-100
    memoryTotal: real('memory_total'), // GB
    memoryUsed: real('memory_used'), // GB
    memoryFree: real('memory_free'), // GB
    // Storage Metrics
    storageUsage: real('storage_usage'), // Percentage 0-100
    storageTotal: real('storage_total'), // GB
    storageUsed: real('storage_used'), // GB
    storageFree: real('storage_free'), // GB
    storageIOPS: real('storage_iops'), // Operations per second
    // Network Metrics
    bandwidthUp: real('bandwidth_up'), // Mbps
    bandwidthDown: real('bandwidth_down'), // Mbps
    networkLatency: real('network_latency'), // ms
    packetLoss: real('packet_loss'), // Percentage 0-100
    // Node-specific Metrics
    uptime: integer('uptime'), // Seconds since last restart
    connections: integer('connections'), // Active connections
    requestsPerSecond: real('requests_per_second'),
    errorRate: real('error_rate'), // Percentage 0-100
    // Blockchain/DePIN specific
    syncStatus: real('sync_status'), // Percentage 0-100
    blockHeight: integer('block_height'),
    peerCount: integer('peer_count'),
    timestamp: integer('timestamp', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`),
}, (table) => ({
    nodeIdIdx: index('metrics_node_id_idx').on(table.nodeId),
    timestampIdx: index('metrics_timestamp_idx').on(table.timestamp),
    nodeTimestampIdx: index('metrics_node_timestamp_idx').on(table.nodeId, table.timestamp),
    cpuUsageIdx: index('metrics_cpu_usage_idx').on(table.cpuUsage),
    memoryUsageIdx: index('metrics_memory_usage_idx').on(table.memoryUsage),
    storageUsageIdx: index('metrics_storage_usage_idx').on(table.storageUsage),
}));
