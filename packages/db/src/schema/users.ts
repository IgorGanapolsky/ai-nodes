import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable, index } from 'drizzle-orm/sqlite-core';

export const owners = sqliteTable(
  'owners',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    displayName: text('display_name').notNull(),
    email: text('email').notNull().unique(),
    discordWebhook: text('discord_webhook'),
    revSharePct: real('rev_share_pct').notNull().default(70), // Default 70% to owner
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index('owners_email_idx').on(table.email),
  }),
);

export type Owner = typeof owners.$inferSelect;
export type NewOwner = typeof owners.$inferInsert;
