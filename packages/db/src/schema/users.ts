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

// Users table for authentication and role management
export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['admin', 'user', 'viewer'] })
      .notNull()
      .default('user'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
  }),
);

export type Owner = typeof owners.$inferSelect;
export type NewOwner = typeof owners.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
