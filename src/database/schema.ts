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
    index,
    boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
    'ADMIN',
    'CAMAT',
    'OPD'
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

/** Kecamatan is the access boundary for an administrator and an OPD. */
export const districts = pgTable('districts', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull().unique(),
    code: varchar('code', { length: 32 }).notNull().unique(),
    /** GeoJSON/PostGIS polygon used to place a public report in its kecamatan. */
    boundary: geometry('boundary', { type: 'polygon', mode: 'xy', srid: 4326 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userDistricts = pgTable('user_districts', {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    districtId: uuid('district_id').references(() => districts.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
    userDistrictIdx: index('user_districts_user_district_idx').on(table.userId, table.districtId),
}));

export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    tokenHash: text('token_hash').unique().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
    id: uuid('id').defaultRandom().primaryKey(),
    category: reportCategoryEnum('category').notNull(),
    centroidLocation: geometry('centroid_location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    status: ticketStatusEnum('status').default('MENUNGGU_KLIRING').notNull(),
    urgencyScore: real('urgency_score').default(0).notNull(),
    assignedToRole: userRoleEnum('assigned_to_role'),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id),
    districtId: uuid('district_id').references(() => districts.id),
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
    districtId: uuid('district_id').references(() => districts.id),
    reporterPhone: varchar('reporter_phone', { length: 20 }).notNull(),
    category: reportCategoryEnum('category').notNull(),
    damageLevel: integer('damage_level').notNull(),
    description: text('description').notNull(),
    location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    aiRiskScore: integer('ai_risk_score').default(1).notNull(),
    aiIsBlocked: boolean('ai_is_blocked').default(false).notNull(),
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

/** An active circular work zone. A ticket can progress only when it owns the zone. */
export const zoneLocks = pgTable('zone_locks', {
    id: uuid('id').defaultRandom().primaryKey(),
    districtId: uuid('district_id').references(() => districts.id, { onDelete: 'cascade' }).notNull(),
    ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }).notNull().unique(),
    center: geometry('center', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    radiusMeters: integer('radius_meters').notNull().default(500),
    lockedByUserId: uuid('locked_by_user_id').references(() => users.id).notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    zoneLocksDistrictIdx: index('zone_locks_district_idx').on(table.districtId),
}));

export const ticketProofImages = pgTable('ticket_proof_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id).notNull(),
    url: varchar('url', { length: 512 }).notNull(),
    mimeType: varchar('mime_type', { length: 64 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    ticketProofTicketIdx: index('ticket_proof_images_ticket_idx').on(table.ticketId),
}));

export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 160 }).notNull(),
    message: text('message').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    notificationUserIdx: index('notifications_user_idx').on(table.userId, table.readAt),
}));

export const reportImages = pgTable('report_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id').references(() => reports.id, { onDelete: 'cascade' }).notNull(),
    url: varchar('url', { length: 512 }).notNull(),
    mimeType: varchar('mime_type', { length: 64 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    reportImageReportIdx: index('report_images_report_idx').on(table.reportId),
}));

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
