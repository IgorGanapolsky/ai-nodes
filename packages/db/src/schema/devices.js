import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
export const nodes = sqliteTable(
  'nodes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: [
        'storj',
        'filecoin',
        'chia',
        'akash',
        'theta',
        'livepeer',
        'helium',
        'arweave',
        'sia',
        'custom',
      ],
    }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    apiKey: text('api_key'),
    apiUrl: text('api_url'),
    status: text('status', {
      enum: ['active', 'inactive', 'error', 'maintenance', 'pending'],
    })
      .notNull()
      .default('pending'),
    version: text('version'),
    location: text('location'),
    hardware: text('hardware'),
    bandwidth: real('bandwidth'), // Mbps
    storage: real('storage'), // GB
    isOnline: integer('is_online', { mode: 'boolean' }).notNull().default(false),
    lastSeen: integer('last_seen', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    ownerIdIdx: index('nodes_owner_id_idx').on(table.ownerId),
    typeIdx: index('nodes_type_idx').on(table.type),
    statusIdx: index('nodes_status_idx').on(table.status),
    isOnlineIdx: index('nodes_is_online_idx').on(table.isOnline),
  }),
);
