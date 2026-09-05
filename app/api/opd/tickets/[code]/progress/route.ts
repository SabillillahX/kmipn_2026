import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { getLocalReport, updateLocalReport } from "@/app/lib/local-reports";
import { sendWhatsAppNotification } from "@/app/lib/whatsapp";
import { db } from "@/src/database";
import { auditLogs, districts, notifications, ticketProofImages, tickets, userDistricts, users, reports, zoneLocks } from "@/src/database/schema";

const defaultRadiusMeters = 500;

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireStaff();
  if (user.role !== "OPD") return NextResponse.json({ error: "Hanya OPD pelaksana yang dapat memperbarui progres." }, { status: 403 });
  const { code } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const radiusMeters = Number.isInteger(body?.radiusMeters) ? body.radiusMeters : defaultRadiusMeters;
  if ((status !== "diproses" && status !== "selesai") || note.length < 5) {
    return NextResponse.json({ error: "Status dan catatan (minimal 5 karakter) wajib diisi." }, { status: 400 });
  }

  try {
    let ticketRecord: typeof tickets.$inferSelect | null = null;

    if (code.toUpperCase().startsWith("TK-")) {
      const prefix = code.slice(3).toLowerCase();
      const [t] = await db.select().from(tickets).where(sql`cast(${tickets.id} as text) like ${prefix + "%"}`).limit(1);
      ticketRecord = t ?? null;
    } else if (code.toUpperCase().startsWith("REP-")) {
      const prefix = code.slice(4).toLowerCase();
      const [r] = await db.select().from(reports).where(sql`cast(${reports.id} as text) like ${prefix + "%"}`).limit(1);
      if (r) {
        if (r.ticketId) {
          const [t] = await db.select().from(tickets).where(eq(tickets.id, r.ticketId)).limit(1);
          ticketRecord = t ?? null;
        }
        if (!ticketRecord) {
          const [newTicket] = await db.insert(tickets).values({
            category: r.category,
            centroidLocation: r.location,
            status: "DIPROSES_OPD",
            districtId: r.districtId,
            reportCount: 1,
            assignedToRole: "OPD",
            assignedToUserId: user.id
          }).returning();
          await db.update(reports).set({ ticketId: newTicket.id }).where(eq(reports.id, r.id));
          ticketRecord = newTicket;
        }
      }
    }

    if (ticketRecord) {
      let districtId = ticketRecord.districtId;
      if (!districtId) {
        const [defaultDist] = await db.select({ id: districts.id }).from(districts).limit(1);
        if (defaultDist) {
          districtId = defaultDist.id;
          await db.update(tickets).set({ districtId }).where(eq(tickets.id, ticketRecord.id));
        }
      }

      if (districtId && user.id !== "local-admin") {
        await db.insert(userDistricts).values({ userId: user.id, districtId }).onConflictDoNothing();
      }

      if (status === "diproses") {
        await db.update(tickets).set({ status: "DIPROSES_OPD", assignedToRole: "OPD", assignedToUserId: user.id, updatedAt: new Date() }).where(eq(tickets.id, ticketRecord.id));
        if (user.id !== "local-admin") {
          await db.insert(auditLogs).values({ ticketId: ticketRecord.id, userId: user.id, action: "LOCK_AKTIF", reason: note });
        }
      } else {
        await db.update(tickets).set({ status: "SELESAI", updatedAt: new Date() }).where(eq(tickets.id, ticketRecord.id));
        if (user.id !== "local-admin") {
          await db.insert(auditLogs).values({ ticketId: ticketRecord.id, userId: user.id, action: "SELESAI", reason: note });
        }
      }

      // Automated WhatsApp status notification to reporter(s)
      const ticketReports = await db
        .select({ phone: reports.reporterPhone })
        .from(reports)
        .where(eq(reports.ticketId, ticketRecord.id));

      const displayCode = `TK-${ticketRecord.id.slice(0, 6).toUpperCase()}`;
      for (const rep of ticketReports) {
        if (rep.phone) {
          await sendWhatsAppNotification({
            to: rep.phone,
            type: status === "diproses" ? "DIPROSES" : "SELESAI",
            code: displayCode,
            assignedTo: user.name,
            note: note,
          });
        }
      }

      return NextResponse.json({ ok: true, status: status === "diproses" ? "DIPROSES_OPD" : "SELESAI" });
    }
  } catch (err) {
    // Fallthrough to local JSON mode below
  }

  // Local fallback mode (JSON)
  const uiStatus = status === "diproses" ? "diproses" : "selesai";
  const updated = await updateLocalReport(code, {
    status: uiStatus,
    note: note,
    assignedTo: user.name || "Tim Lapangan OPD"
  });

  if (updated) {
    if (updated.contactPhone) {
      await sendWhatsAppNotification({
        to: updated.contactPhone,
        type: status === "diproses" ? "DIPROSES" : "SELESAI",
        code: code,
        assignedTo: user.name || "Tim Lapangan OPD",
        note: note,
      });
    }
    return NextResponse.json({ ok: true, status: uiStatus });
  }

  return NextResponse.json({ error: "Tiket atau laporan tidak ditemukan." }, { status: 404 });
}
