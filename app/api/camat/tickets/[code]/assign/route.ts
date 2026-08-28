import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { getLocalReport, updateLocalReport } from "@/app/lib/local-reports";
import { db } from "@/src/database";
import { auditLogs, notifications, reports, tickets, userDistricts, users } from "@/src/database/schema";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireStaff();
  if (user.role !== "CAMAT" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin kecamatan yang dapat mendisposisikan laporan." }, { status: 403 });
  }

  const { code } = await context.params;
  const body = await request.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const opdUserId = typeof body?.opdUserId === "string" ? body.opdUserId : "";

  if (note.length < 5 || !opdUserId) {
    return NextResponse.json({ error: "Pilih OPD pelaksana dan isi catatan disposisi minimal 5 karakter." }, { status: 400 });
  }

  let opdName = "OPD Pelaksana";
  let opdUser: { id: string; name: string } | null = null;

  try {
    const [foundUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, opdUserId))
      .limit(1);

    if (foundUser) {
      opdUser = foundUser;
      opdName = foundUser.name;
    }
  } catch {}

  // Standard OPD name mapping fallback for local mock IDs
  if (!opdUser) {
    const opdNamesMap: Record<string, string> = {
      "local-opd-1": "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)",
      "local-opd-2": "Dinas Lingkungan Hidup (DLH)",
      "local-opd-3": "Dinas Perhubungan (Dishub)",
      "local-opd-4": "Dinas Kesehatan (Dinkes)",
      "local-opd-5": "Satuan Polisi Pamong Praja (Satpol PP)",
    };
    if (opdNamesMap[opdUserId]) {
      opdName = opdNamesMap[opdUserId];
    }
  }

  try {
    let ticketRecord: typeof tickets.$inferSelect | null = null;

    if (code.toUpperCase().startsWith("TK-")) {
      const prefix = code.slice(3).toLowerCase();
      const [t] = await db
        .select()
        .from(tickets)
        .where(sql`cast(${tickets.id} as text) like ${prefix + "%"}`)
        .limit(1);
      ticketRecord = t ?? null;
    } else if (code.toUpperCase().startsWith("REP-")) {
      const prefix = code.slice(4).toLowerCase();
      const [r] = await db
        .select()
        .from(reports)
        .where(sql`cast(${reports.id} as text) like ${prefix + "%"}`)
        .limit(1);

      if (r) {
        if (r.ticketId) {
          const [t] = await db.select().from(tickets).where(eq(tickets.id, r.ticketId)).limit(1);
          ticketRecord = t ?? null;
        }

        if (!ticketRecord) {
          const [newTicket] = await db
            .insert(tickets)
            .values({
              category: r.category,
              centroidLocation: r.location,
              status: "MENUNGGU_KLIRING",
              districtId: r.districtId,
              reportCount: 1,
            })
            .returning();

          await db.update(reports).set({ ticketId: newTicket.id }).where(eq(reports.id, r.id));
          ticketRecord = newTicket;
        }
      }
    }

    if (ticketRecord) {
      if (opdUser && ticketRecord.districtId) {
        await db
          .insert(userDistricts)
          .values({ userId: opdUser.id, districtId: ticketRecord.districtId })
          .onConflictDoNothing();
      }

      let auditUserId = user.id;
      if (auditUserId === "local-admin") {
        const dbUsers = await db.select({ id: users.id }).from(users).limit(1);
        if (dbUsers.length > 0) auditUserId = dbUsers[0].id;
      }

      await db.transaction(async (tx) => {
        await tx
          .update(tickets)
          .set({
            status: "TERVALIDASI",
            assignedToRole: "OPD",
            assignedToUserId: opdUser?.id ?? null,
            updatedAt: new Date(),
          })
          .where(eq(tickets.id, ticketRecord.id));

        if (auditUserId !== "local-admin") {
          await tx.insert(auditLogs).values({
            ticketId: ticketRecord.id,
            userId: auditUserId,
            action: "DISPOSISI",
            reason: `Disposisi ke ${opdName}: ${note}`,
          });
        }

        if (opdUser?.id) {
          await tx.insert(notifications).values({
            userId: opdUser.id,
            ticketId: ticketRecord.id,
            title: "Surat Tugas Baru",
            message: `Tiket TK-${ticketRecord.id.slice(0, 6).toUpperCase()} didisposisikan ke instansi Anda.`,
          });
        }
      });

      return NextResponse.json({ ok: true, status: "TERVALIDASI", assignedTo: opdName });
    }
  } catch (err) {
    // Database bypass / Local JSON fallback below
  }

  // Fallback for Local Mode (JSON file)
  const localReport = await getLocalReport(code);
  if (localReport) {
    await updateLocalReport(code, {
      status: "diverifikasi",
      assignedTo: opdName,
      note: `Disposisi ke ${opdName}: ${note}`,
    });
    return NextResponse.json({ ok: true, status: "diverifikasi", assignedTo: opdName });
  }

  return NextResponse.json({ error: "Laporan/Tiket tidak ditemukan dalam sistem." }, { status: 404 });
}
