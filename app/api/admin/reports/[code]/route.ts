import { NextResponse } from "next/server";
import { requireAdmin, requireStaff } from "@/app/lib/dal";
import { getLocalReport, ReportStatus, updateLocalReport } from "@/app/lib/local-reports";
import { db } from "@/src/database";
import { tickets, reports, auditLogs, users } from "@/src/database/schema";
import { eq, sql, desc } from "drizzle-orm";

const statuses = new Set<ReportStatus>(["baru", "diverifikasi", "diproses", "selesai", "ditolak"]);

const catLabelMap: Record<string, string> = {
  INFRASTRUKTUR: "Infrastruktur",
  KEBERSIHAN: "Lingkungan & kebersihan",
  PENERANGAN_JALAN: "Penerangan jalan",
  KESEHATAN_LINGKUNGAN: "Kesehatan lingkungan"
};

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireStaff();
  const { code } = await context.params;

  if (code.toUpperCase().startsWith("TK-")) {
    const prefix = code.slice(3).toLowerCase();
    const ticketList = await db
      .select()
      .from(tickets)
      .where(sql`cast(${tickets.id} as text) like ${prefix + "%"}`)
      .limit(1);

    if (ticketList.length === 0) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    const ticket = ticketList[0];

    if (user.role === "OPD" && ticket.assignedToUserId !== user.id) {
      return NextResponse.json({ error: "Tiket tidak ditemukan atau di luar penugasan Anda." }, { status: 403 });
    }

    const ticketReports = await db
      .select()
      .from(reports)
      .where(eq(reports.ticketId, ticket.id));

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        reason: auditLogs.reason,
        createdAt: auditLogs.createdAt,
        actor: users.name,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.ticketId, ticket.id))
      .orderBy(desc(auditLogs.createdAt));

    const firstReport = ticketReports[0];
    const lat = (ticket.centroidLocation as any)?.y ?? (firstReport?.location as any)?.y ?? 0;
    const lng = (ticket.centroidLocation as any)?.x ?? (firstReport?.location as any)?.x ?? 0;
    const score = ticket.urgencyScore;
    const priority = score >= 70 ? "tinggi" : score >= 40 ? "sedang" : "rendah";

    let status = "baru";
    if (ticket.status === "DIPROSES_OPD" || ticket.status === "SHARED_LOCK") {
      status = "diproses";
    } else if (ticket.status === "SELESAI") {
      status = "selesai";
    } else if (ticket.status === "TERVALIDASI") {
      status = "diverifikasi";
    }

    const history = logs.map((log) => {
      let uiStatus = "baru";
      if (log.action === "DISPOSISI") uiStatus = "diproses";
      else if (log.action === "TOLAK") uiStatus = "ditolak";
      else if (log.action === "LOCK_AKTIF") uiStatus = "diverifikasi";
      else if (log.action === "SELESAI") uiStatus = "selesai";
      return {
        status: uiStatus,
        note: log.reason ?? "",
        at: log.createdAt.toISOString(),
        actor: log.actor,
      };
    });

    if (history.length === 0) {
      history.push({
        status: "baru",
        note: "Laporan diterima oleh sistem SPLIK.",
        at: ticket.createdAt.toISOString(),
        actor: "Sistem",
      });
    }

    const firstDesc = firstReport?.description ?? "";
    const description = ticketReports.length > 1 ? `${firstDesc} (Klaster ${ticketReports.length} aduan)` : firstDesc;

    return NextResponse.json({
      code: `TK-${ticket.id.slice(0, 6).toUpperCase()}`,
      category: catLabelMap[ticket.category] ?? ticket.category,
      severity: priority,
      description,
      contactPhone: firstReport?.reporterPhone ?? "",
      latitude: lat,
      longitude: lng,
      priority,
      status,
      districtId: ticket.districtId,
      assignedTo: ticket.assignedToRole === "OPD" ? "Petugas OPD" : null,
      createdAt: ticket.createdAt.toISOString(),
      history,
      reports: ticketReports.map((r) => ({
        id: r.id,
        code: `REP-${r.id.slice(0, 6).toUpperCase()}`,
        reporterPhone: r.reporterPhone,
        description: r.description,
        damageLevel: r.damageLevel,
        createdAt: r.createdAt.toISOString(),
        latitude: (r.location as any)?.y ?? 0,
        longitude: (r.location as any)?.x ?? 0,
      })),
    });
  }

  if (code.toUpperCase().startsWith("REP-")) {
    const prefix = code.slice(4).toLowerCase();
    const reportList = await db
      .select()
      .from(reports)
      .where(sql`cast(${reports.id} as text) like ${prefix + "%"}`)
      .limit(1);

    if (reportList.length === 0) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    const report = reportList[0];

    if (report.ticketId) {
      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, report.ticketId)).limit(1);
      if (ticket) {
        if (user.role === "OPD" && ticket.assignedToUserId !== user.id) {
          return NextResponse.json({ error: "Tiket tidak ditemukan atau di luar penugasan Anda." }, { status: 403 });
        }
        const ticketReports = await db.select().from(reports).where(eq(reports.ticketId, ticket.id));
        const logs = await db
          .select({
            id: auditLogs.id,
            action: auditLogs.action,
            reason: auditLogs.reason,
            createdAt: auditLogs.createdAt,
            actor: users.name,
          })
          .from(auditLogs)
          .innerJoin(users, eq(auditLogs.userId, users.id))
          .where(eq(auditLogs.ticketId, ticket.id))
          .orderBy(desc(auditLogs.createdAt));

        const lat = (ticket.centroidLocation as any)?.y ?? (report.location as any)?.y ?? 0;
        const lng = (ticket.centroidLocation as any)?.x ?? (report.location as any)?.x ?? 0;
        const score = ticket.urgencyScore;
        const priority = score >= 70 ? "tinggi" : score >= 40 ? "sedang" : "rendah";

        let status = "baru";
        if (ticket.status === "DIPROSES_OPD" || ticket.status === "SHARED_LOCK") {
          status = "diproses";
        } else if (ticket.status === "SELESAI") {
          status = "selesai";
        } else if (ticket.status === "TERVALIDASI") {
          status = "diverifikasi";
        }

        const history = logs.map((log) => {
          let uiStatus = "baru";
          if (log.action === "DISPOSISI") uiStatus = "diproses";
          else if (log.action === "TOLAK") uiStatus = "ditolak";
          else if (log.action === "LOCK_AKTIF") uiStatus = "diverifikasi";
          else if (log.action === "SELESAI") uiStatus = "selesai";
          return {
            status: uiStatus,
            note: log.reason ?? "",
            at: log.createdAt.toISOString(),
            actor: log.actor,
          };
        });

        if (history.length === 0) {
          history.push({
            status: "baru",
            note: "Laporan diterima oleh sistem SPLIK.",
            at: ticket.createdAt.toISOString(),
            actor: "Sistem",
          });
        }

        return NextResponse.json({
          code: `TK-${ticket.id.slice(0, 6).toUpperCase()}`,
          category: catLabelMap[ticket.category] ?? ticket.category,
          severity: priority,
          description: ticketReports.length > 1 ? `${report.description} (Klaster ${ticketReports.length} aduan)` : report.description,
          contactPhone: report.reporterPhone,
          latitude: lat,
          longitude: lng,
          priority,
          status,
          districtId: ticket.districtId,
          assignedTo: ticket.assignedToRole === "OPD" ? "Petugas OPD" : null,
          createdAt: ticket.createdAt.toISOString(),
          history,
          reports: ticketReports.map((r) => ({
            id: r.id,
            code: `REP-${r.id.slice(0, 6).toUpperCase()}`,
            reporterPhone: r.reporterPhone,
            description: r.description,
            damageLevel: r.damageLevel,
            createdAt: r.createdAt.toISOString(),
            latitude: (r.location as any)?.y ?? 0,
            longitude: (r.location as any)?.x ?? 0,
          })),
        });
      }
    }

    if (user.role === "OPD") {
      return NextResponse.json({ error: "Laporan belum dikelompokkan ke dalam tiket penugasan Anda." }, { status: 403 });
    }

    const [newTicket] = await db
      .insert(tickets)
      .values({
        category: report.category,
        centroidLocation: report.location,
        status: "MENUNGGU_KLIRING",
        districtId: report.districtId,
        reportCount: 1,
      })
      .returning();

    await db.update(reports).set({ ticketId: newTicket.id }).where(eq(reports.id, report.id));

    const lat = (report.location as any)?.y ?? 0;
    const lng = (report.location as any)?.x ?? 0;

    return NextResponse.json({
      code: `TK-${newTicket.id.slice(0, 6).toUpperCase()}`,
      category: catLabelMap[report.category] ?? report.category,
      severity: "rendah",
      description: report.description,
      contactPhone: report.reporterPhone,
      latitude: lat,
      longitude: lng,
      priority: "rendah",
      status: "baru",
      districtId: newTicket.districtId,
      assignedTo: null,
      createdAt: newTicket.createdAt.toISOString(),
      history: [
        {
          status: "baru",
          note: "Laporan diterima oleh sistem SPLIK.",
          at: newTicket.createdAt.toISOString(),
          actor: "Sistem",
        },
      ],
      reports: [
        {
          id: report.id,
          code: `REP-${report.id.slice(0, 6).toUpperCase()}`,
          reporterPhone: report.reporterPhone,
          description: report.description,
          damageLevel: report.damageLevel,
          createdAt: report.createdAt.toISOString(),
          latitude: lat,
          longitude: lng,
        },
      ],
    });
  }

  const report = await getLocalReport(code);
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  return NextResponse.json(report);
}

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireAdmin();
  const { code } = await context.params;
  const body = await request.json().catch(() => null);
  if (!statuses.has(body?.status) || typeof body?.note !== "string" || body.note.trim().length < 5) {
    return NextResponse.json({ error: "Status dan catatan minimal 5 karakter wajib diisi." }, { status: 400 });
  }

  if (code.toUpperCase().startsWith("TK-")) {
    const prefix = code.slice(3).toLowerCase();
    const ticketList = await db
      .select()
      .from(tickets)
      .where(sql`cast(${tickets.id} as text) like ${prefix + "%"}`)
      .limit(1);

    if (ticketList.length === 0) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    const ticket = ticketList[0];

    let dbStatus: any = "MENUNGGU_KLIRING";
    if (body.status === "baru") dbStatus = "MENUNGGU_KLIRING";
    else if (body.status === "diverifikasi") dbStatus = "TERVALIDASI";
    else if (body.status === "diproses") dbStatus = "DIPROSES_OPD";
    else if (body.status === "selesai") dbStatus = "SELESAI";

    let auditAction: any = "DISPOSISI";
    if (body.status === "diverifikasi") auditAction = "LOCK_AKTIF";
    else if (body.status === "selesai") auditAction = "SELESAI";
    else if (body.status === "ditolak") auditAction = "TOLAK";

    let userId = user.id;
    if (userId === "local-admin") {
      const dbUsers = await db.select({ id: users.id }).from(users).limit(1);
      if (dbUsers.length > 0) {
        userId = dbUsers[0].id;
      }
    }

    await db
      .update(tickets)
      .set({
        status: dbStatus,
        assignedToRole: body.assignedTo ? "OPD" : null,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id));

    await db.insert(auditLogs).values({
      ticketId: ticket.id,
      userId: userId,
      action: auditAction,
      reason: body.note,
    });

    const ticketReports = await db.select().from(reports).where(eq(reports.ticketId, ticket.id));
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        reason: auditLogs.reason,
        createdAt: auditLogs.createdAt,
        actor: users.name,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.ticketId, ticket.id))
      .orderBy(desc(auditLogs.createdAt));

    const firstReport = ticketReports[0];
    const lat = (ticket.centroidLocation as any)?.y ?? (firstReport?.location as any)?.y ?? 0;
    const lng = (ticket.centroidLocation as any)?.x ?? (firstReport?.location as any)?.x ?? 0;
    const score = ticket.urgencyScore;
    const priority = score >= 70 ? "tinggi" : score >= 40 ? "sedang" : "rendah";

    const history = logs.map((log) => {
      let uiStatus = "baru";
      if (log.action === "DISPOSISI") uiStatus = "diproses";
      else if (log.action === "TOLAK") uiStatus = "ditolak";
      else if (log.action === "LOCK_AKTIF") uiStatus = "diverifikasi";
      else if (log.action === "SELESAI") uiStatus = "selesai";
      return {
        status: uiStatus,
        note: log.reason ?? "",
        at: log.createdAt.toISOString(),
        actor: log.actor,
      };
    });

    if (history.length === 0) {
      history.push({
        status: "baru",
        note: "Laporan diterima oleh sistem SPLIK.",
        at: ticket.createdAt.toISOString(),
        actor: "Sistem",
      });
    }

    const firstDesc = firstReport?.description ?? "";
    const description = ticketReports.length > 1 ? `${firstDesc} (Klaster ${ticketReports.length} aduan)` : firstDesc;

    return NextResponse.json({
      code: `TK-${ticket.id.slice(0, 6).toUpperCase()}`,
      category: catLabelMap[ticket.category] ?? ticket.category,
      severity: priority,
      description,
      contactPhone: firstReport?.reporterPhone ?? "",
      latitude: lat,
      longitude: lng,
      priority,
      status: body.status,
      assignedTo: body.assignedTo || null,
      createdAt: ticket.createdAt.toISOString(),
      history,
      reports: ticketReports.map((r) => ({
        id: r.id,
        code: `REP-${r.id.slice(0, 6).toUpperCase()}`,
        reporterPhone: r.reporterPhone,
        description: r.description,
        damageLevel: r.damageLevel,
        createdAt: r.createdAt.toISOString(),
        latitude: (r.location as any)?.y ?? 0,
        longitude: (r.location as any)?.x ?? 0,
      })),
    });
  }

  if (code.toUpperCase().startsWith("REP-")) {
    const prefix = code.slice(4).toLowerCase();
    const reportList = await db
      .select()
      .from(reports)
      .where(sql`cast(${reports.id} as text) like ${prefix + "%"}`)
      .limit(1);

    if (reportList.length === 0) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    const report = reportList[0];

    let ticketId = report.ticketId;
    if (!ticketId) {
      const [newTicket] = await db
        .insert(tickets)
        .values({
          category: report.category,
          centroidLocation: report.location,
          status: "MENUNGGU_KLIRING",
          districtId: report.districtId,
          reportCount: 1,
        })
        .returning();
      await db.update(reports).set({ ticketId: newTicket.id }).where(eq(reports.id, report.id));
      ticketId = newTicket.id;
    }

    let dbStatus: any = "MENUNGGU_KLIRING";
    if (body.status === "baru") dbStatus = "MENUNGGU_KLIRING";
    else if (body.status === "diverifikasi") dbStatus = "TERVALIDASI";
    else if (body.status === "diproses") dbStatus = "DIPROSES_OPD";
    else if (body.status === "selesai") dbStatus = "SELESAI";

    let auditAction: any = "DISPOSISI";
    if (body.status === "diverifikasi") auditAction = "LOCK_AKTIF";
    else if (body.status === "selesai") auditAction = "SELESAI";
    else if (body.status === "ditolak") auditAction = "TOLAK";

    let userId = user.id;
    if (userId === "local-admin") {
      const dbUsers = await db.select({ id: users.id }).from(users).limit(1);
      if (dbUsers.length > 0) {
        userId = dbUsers[0].id;
      }
    }

    await db
      .update(tickets)
      .set({
        status: dbStatus,
        assignedToRole: body.assignedTo ? "OPD" : null,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    await db.insert(auditLogs).values({
      ticketId: ticketId,
      userId: userId,
      action: auditAction,
      reason: body.note,
    });

    const ticketReports = await db.select().from(reports).where(eq(reports.ticketId, ticketId));
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        reason: auditLogs.reason,
        createdAt: auditLogs.createdAt,
        actor: users.name,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.ticketId, ticketId))
      .orderBy(desc(auditLogs.createdAt));

    const lat = (report.location as any)?.y ?? 0;
    const lng = (report.location as any)?.x ?? 0;

    const history = logs.map((log) => {
      let uiStatus = "baru";
      if (log.action === "DISPOSISI") uiStatus = "diproses";
      else if (log.action === "TOLAK") uiStatus = "ditolak";
      else if (log.action === "LOCK_AKTIF") uiStatus = "diverifikasi";
      else if (log.action === "SELESAI") uiStatus = "selesai";
      return {
        status: uiStatus,
        note: log.reason ?? "",
        at: log.createdAt.toISOString(),
        actor: log.actor,
      };
    });

    if (history.length === 0) {
      history.push({
        status: "baru",
        note: "Laporan diterima oleh sistem SPLIK.",
        at: report.createdAt.toISOString(),
        actor: "Sistem",
      });
    }

    return NextResponse.json({
      code: `REP-${report.id.slice(0, 6).toUpperCase()}`,
      category: catLabelMap[report.category] ?? report.category,
      severity: "rendah",
      description: ticketReports.length > 1 ? `${report.description} (Klaster ${ticketReports.length} aduan)` : report.description,
      contactPhone: report.reporterPhone,
      latitude: lat,
      longitude: lng,
      priority: "rendah",
      status: body.status,
      assignedTo: body.assignedTo || null,
      createdAt: report.createdAt.toISOString(),
      history,
      reports: ticketReports.map((r) => ({
        id: r.id,
        code: `REP-${r.id.slice(0, 6).toUpperCase()}`,
        reporterPhone: r.reporterPhone,
        description: r.description,
        damageLevel: r.damageLevel,
        createdAt: r.createdAt.toISOString(),
        latitude: (r.location as any)?.y ?? 0,
        longitude: (r.location as any)?.x ?? 0,
      })),
    });
  }

  const report = await updateLocalReport(code, {
    status: body.status,
    note: body.note,
    assignedTo: typeof body.assignedTo === "string" ? body.assignedTo : undefined,
  });
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  return NextResponse.json(report);
}
