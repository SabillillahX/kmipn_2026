import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    real,
    timestamp,
    pgEnum,
    geometry,
    index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
    'gov_employee'
]);

export const ticketStatusEnum = pgEnum('ticket_status', [
    'MENUNGGU_KLIRING',
    'TERVALIDASI',
    'DIPROSES_OPD',
    'SHARED_LOCK',
    'SELESAI'
]);

export const reportCategoryEnum = pgEnum('report_category', [
    'INFRASTRUKTUR',
    'KESEHATAN_LINGKUNGAN',
    'KEBERSIHAN',
    'PENERANGAN_JALAN'
]);

export const auditActionEnum = pgEnum('audit_action', [
    'DISPOSISI',
    'TOLAK',
    'LOCK_AKTIF',
    'SELESAI'
]);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    role: userRoleEnum('role').notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
    id: uuid('id').defaultRandom().primaryKey(),
    category: reportCategoryEnum('category').notNull(),
    centroidLocation: geometry('centroid_location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    status: ticketStatusEnum('status').default('MENUNGGU_KLIRING').notNull(),
    urgencyScore: real('urgency_score').default(0).notNull(),
    assignedToRole: userRoleEnum('assigned_to_role'),
    reportCount: integer('report_count').default(1).notNull(),
    proofImageUrl: varchar('proof_image_url', { length: 512 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    centroidLocationIdx: index('tickets_centroid_location_gist_idx').using('gist', table.centroidLocation),
    statusIdx: index('tickets_status_idx').on(table.status),
}));

export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id').references(() => tickets.id),
    reporterPhone: varchar('reporter_phone', { length: 20 }).notNull(),
    category: reportCategoryEnum('category').notNull(),
    damageLevel: integer('damage_level').notNull(),
    description: text('description').notNull(),
    location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    locationIdx: index('reports_location_gist_idx').using('gist', table.location),
}));

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id').references(() => tickets.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    action: auditActionEnum('action').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ticketsRelations = relations(tickets, ({ many }) => ({
    reports: many(reports),
    auditLogs: many(auditLogs),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
    ticket: one(tickets, {
        fields: [reports.ticketId],
        references: [tickets.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    ticket: one(tickets, {
        fields: [auditLogs.ticketId],
        references: [tickets.id],
    }),
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));