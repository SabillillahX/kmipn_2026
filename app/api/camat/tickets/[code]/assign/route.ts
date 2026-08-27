import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { db } from "@/src/database";
import { auditLogs, notifications, tickets, userDistricts, users } from "@/src/database/schema";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireStaff();
  if (user.role !== "CAMAT" && user.role !== "ADMIN") return NextResponse.json({ error: "Hanya admin kecamatan yang dapat mendisposisikan laporan." }, { status: 403 });
  const { code } = await context.params;
  const body = await request.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const opdUserId = typeof body?.opdUserId === "string" ? body.opdUserId : "";
  if (note.length < 5 || !opdUserId) return NextResponse.json({ error: "Pilih OPD pelaksana dan isi catatan disposisi minimal 5 karakter." }, { status: 400 });

  const [ticket] = await db.select().from(tickets).where(sql`cast(${tickets.id} as text) like ${code.replace(/^TK-/i, "").toLowerCase() + "%"}`).limit(1);
  if (!ticket || !ticket.districtId) return NextResponse.json({ error: "Tiket atau kecamatan tiket belum tersedia." }, { status: 404 });
  if (user.role === "CAMAT") {
    const access = await db.select().from(userDistricts).where(eq(userDistricts.userId, user.id));
    if (!access.some((item) => item.districtId === ticket.districtId)) return NextResponse.json({ error: "Laporan ini berada di luar kecamatan Anda." }, { status: 403 });
  }
  const [opd] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, opdUserId)).limit(1);
  const opdAccess = await db.select().from(userDistricts).where(eq(userDistricts.userId, opdUserId));
  if (!opd || opd.role !== "OPD" || !opdAccess.some((item) => item.districtId === ticket.districtId)) return NextResponse.json({ error: "OPD harus terdaftar untuk kecamatan laporan ini." }, { status: 400 });
  await db.transaction(async (tx) => {
    await tx.update(tickets).set({ status: "TERVALIDASI", assignedToRole: "OPD", assignedToUserId: opdUserId, updatedAt: new Date() }).where(eq(tickets.id, ticket.id));
    await tx.insert(auditLogs).values({ ticketId: ticket.id, userId: user.id, action: "DISPOSISI", reason: note });
    await tx.insert(notifications).values({ userId: opdUserId, ticketId: ticket.id, title: "Tiket baru ditugaskan", message: `Tiket TK-${ticket.id.slice(0, 6).toUpperCase()} menunggu penanganan Anda.` });
  });
  return NextResponse.json({ ok: true, status: "TERVALIDASI" });
}
