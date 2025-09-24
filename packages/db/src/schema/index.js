import { relations } from 'drizzle-orm';
// Export all tables
export * from './users';
export * from './nodes';
export * from './earnings';
export * from './metrics';
export * from './alerts';
export * from './revenue-shares';
// Import for relations
import { users } from './users';
import { nodes } from './nodes';
import { earnings } from './earnings';
import { metrics } from './metrics';
import { alerts } from './alerts';
import { revenueShares } from './revenue-shares';
// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
    nodes: many(nodes),
}));
export const nodesRelations = relations(nodes, ({ one, many }) => ({
    owner: one(users, {
        fields: [nodes.ownerId],
        references: [users.id],
    }),
    earnings: many(earnings),
    metrics: many(metrics),
    alerts: many(alerts),
    revenueShares: many(revenueShares),
}));
export const earningsRelations = relations(earnings, ({ one }) => ({
    node: one(nodes, {
        fields: [earnings.nodeId],
        references: [nodes.id],
    }),
}));
export const metricsRelations = relations(metrics, ({ one }) => ({
    node: one(nodes, {
        fields: [metrics.nodeId],
        references: [nodes.id],
    }),
}));
export const alertsRelations = relations(alerts, ({ one }) => ({
    node: one(nodes, {
        fields: [alerts.nodeId],
        references: [nodes.id],
    }),
}));
export const revenueSharesRelations = relations(revenueShares, ({ one }) => ({
    node: one(nodes, {
        fields: [revenueShares.nodeId],
        references: [nodes.id],
    }),
}));
// Export schema object for migrations
export const schema = {
    users,
    nodes,
    earnings,
    metrics,
    alerts,
    revenueShares,
    usersRelations,
    nodesRelations,
    earningsRelations,
    metricsRelations,
    alertsRelations,
    revenueSharesRelations,
};
