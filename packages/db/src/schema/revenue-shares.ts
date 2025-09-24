import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { nodes } from './nodes';

export const revenueShares = sqliteTable('revenue_shares', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  nodeId: text('node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  percentage: real('percentage').notNull(), // 0-100
  amount: real('amount').notNull(), // Calculated amount based on percentage
  currency: text('currency').notNull().default('USD'),
  period: text('period').notNull(), // e.g., '2024-01', 'Q1-2024', 'weekly-2024-W01'
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  totalEarnings: real('total_earnings').notNull(), // Total earnings for the period
  shareType: text('share_type', {
    enum: ['owner', 'platform', 'referral', 'maintenance', 'hosting', 'custom']
  }).notNull().default('owner'),
  recipientId: text('recipient_id'), // User ID for owner shares
  recipientAddress: text('recipient_address'), // Wallet address or account
  paidOut: integer('paid_out', { mode: 'boolean' }).notNull().default(false),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  transactionHash: text('transaction_hash'),
  notes: text('notes'),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
}, (table) => ({
  nodeIdIdx: index('revenue_shares_node_id_idx').on(table.nodeId),
  periodIdx: index('revenue_shares_period_idx').on(table.period),
  shareTypeIdx: index('revenue_shares_share_type_idx').on(table.shareType),
  paidOutIdx: index('revenue_shares_paid_out_idx').on(table.paidOut),
  recipientIdIdx: index('revenue_shares_recipient_id_idx').on(table.recipientId),
  periodStartEndIdx: index('revenue_shares_period_range_idx').on(table.periodStart, table.periodEnd),
  nodePeriodIdx: index('revenue_shares_node_period_idx').on(table.nodeId, table.period),
}));

export type RevenueShare = typeof revenueShares.$inferSelect;
export type NewRevenueShare = typeof revenueShares.$inferInsert;