import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { nodes } from './nodes';
export const earnings = sqliteTable('earnings', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    nodeId: text('node_id')
        .notNull()
        .references(() => nodes.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    currency: text('currency').notNull().default('USD'),
    cryptoAmount: real('crypto_amount'), // Amount in native token
    cryptoCurrency: text('crypto_currency'), // e.g., 'STORJ', 'FIL', 'CHIA'
    exchangeRate: real('exchange_rate'), // Rate at time of earning
    source: text('source'), // Description of earning source
    transactionHash: text('transaction_hash'),
    blockHeight: integer('block_height'),
    earningType: text('earning_type', {
        enum: ['storage', 'bandwidth', 'compute', 'staking', 'mining', 'hosting', 'other']
    }).notNull().default('other'),
    isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
    paidAt: integer('paid_at', { mode: 'timestamp' }),
    timestamp: integer('timestamp', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql `(unixepoch())`),
}, (table) => ({
    nodeIdIdx: index('earnings_node_id_idx').on(table.nodeId),
    timestampIdx: index('earnings_timestamp_idx').on(table.timestamp),
    currencyIdx: index('earnings_currency_idx').on(table.currency),
    earningTypeIdx: index('earnings_earning_type_idx').on(table.earningType),
    isPaidIdx: index('earnings_is_paid_idx').on(table.isPaid),
    nodeTimestampIdx: index('earnings_node_timestamp_idx').on(table.nodeId, table.timestamp),
}));
