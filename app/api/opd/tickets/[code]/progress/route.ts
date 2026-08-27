import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { db } from "@/src/database";
import { auditLogs, notifications, ticketProofImages, tickets, userDistricts, users, zoneLocks } from "@/src/database/schema";

const defaultRadiusMeters = 500;

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireStaff();
  if (user.role !== "OPD") return NextResponse.json({ error: "Hanya OPD pelaksana yang dapat memperbarui progres." }, { status: 403 });
  const { code } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const radiusMeters = Number.isInteger(body?.radiusMeters) ? body.radiusMeters : defaultRadiusMeters;
  if ((status !== "diproses" && status !== "selesai") || note.length < 5 || radiusMeters < 100 || radiusMeters > 2000) return NextResponse.json({ error: "Status, catatan, atau radius zona tidak valid." }, { status: 400 });

  const [ticket] = await db.select().from(tickets).where(sql`cast(${tickets.id} as text) like ${code.replace(/^TK-/i, "").toLowerCase() + "%"}`).limit(1);
  if (!ticket || !ticket.districtId) return NextResponse.json({ error: "Tiket atau kecamatan tiket belum tersedia." }, { status: 404 });
  const districtId = ticket.districtId;
  const access = await db.select().from(userDistricts).where(and(eq(userDistricts.userId, user.id), eq(userDistricts.districtId, districtId))).limit(1);
  if (!access.length) return NextResponse.json({ error: "Tiket ini di luar wilayah kerja OPD Anda." }, { status: 403 });
  if (ticket.assignedToRole !== "OPD") return NextResponse.json({ error: "Tiket belum didisposisikan oleh admin kecamatan." }, { status: 409 });
  if (ticket.assignedToUserId && ticket.assignedToUserId !== user.id) return NextResponse.json({ error: "Tiket ini ditugaskan kepada OPD lain." }, { status: 403 });

  const point = ticket.centroidLocation as { x: number; y: number };
  try {
    await db.transaction(async (tx) => {
    // Serialize locks per kecamatan: two OPD cannot acquire overlapping zones concurrently.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${districtId}))`);
    if (status === "diproses") {
      const overlaps = await tx.execute(sql<{ ticket_id: string }>`
        select ${zoneLocks.ticketId} as ticket_id from ${zoneLocks}
        where ${zoneLocks.districtId} = ${districtId}
          and ${isNull(zoneLocks.releasedAt)}
          and ${zoneLocks.ticketId} <> ${ticket.id}
          and ST_DWithin(${zoneLocks.center}::geography, ST_SetSRID(ST_MakePoint(${point.x}, ${point.y}), 4326)::geography, ${zoneLocks.radiusMeters})
        limit 1`);
      if (overlaps.rows.length) throw new Error("ZONE_LOCKED");
      await tx.insert(zoneLocks).values({ districtId, ticketId: ticket.id, center: point, radiusMeters, lockedByUserId: user.id }).onConflictDoNothing();
      await tx.update(tickets).set({ status: "DIPROSES_OPD", updatedAt: new Date() }).where(eq(tickets.id, ticket.id));
      await tx.insert(auditLogs).values({ ticketId: ticket.id, userId: user.id, action: "LOCK_AKTIF", reason: note });
    } else {
      const proof = await tx.select({ id: ticketProofImages.id }).from(ticketProofImages).where(eq(ticketProofImages.ticketId, ticket.id)).limit(1);
      if (!proof.length) throw new Error("PROOF_REQUIRED");
      await tx.update(zoneLocks).set({ releasedAt: new Date() }).where(eq(zoneLocks.ticketId, ticket.id));
      await tx.update(tickets).set({ status: "SELESAI", updatedAt: new Date() }).where(eq(tickets.id, ticket.id));
      await tx.insert(auditLogs).values({ ticketId: ticket.id, userId: user.id, action: "SELESAI", reason: note });
      const camatIds = await tx.select({ userId: userDistricts.userId }).from(userDistricts).innerJoin(users, eq(userDistricts.userId, users.id)).where(and(eq(userDistricts.districtId, districtId), eq(users.role, "CAMAT")));
      if (camatIds.length) await tx.insert(notifications).values(camatIds.map((camat) => ({ userId: camat.userId, ticketId: ticket.id, title: "Tiket selesai", message: `TK-${ticket.id.slice(0, 6).toUpperCase()} telah diselesaikan dan bukti telah diunggah.` })));
    }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ZONE_LOCKED") return NextResponse.json({ error: "Zona ini sedang ditangani oleh OPD lain. Progres tiket lain di dalam radius lock tidak dapat dimulai." }, { status: 409 });
    if (error instanceof Error && error.message === "PROOF_REQUIRED") return NextResponse.json({ error: "Unggah minimal satu foto bukti penyelesaian sebelum menandai tiket selesai." }, { status: 400 });
    throw error;
  }
  return NextResponse.json({ ok: true, status: status === "diproses" ? "DIPROSES_OPD" : "SELESAI" });
}
