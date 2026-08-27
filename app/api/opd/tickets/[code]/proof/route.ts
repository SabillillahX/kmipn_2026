import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { db } from "@/src/database";
import { ticketProofImages, tickets, userDistricts } from "@/src/database/schema";

export const runtime = "nodejs";
const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  await requireStaff();
  const { code } = await context.params;
  const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(sql`cast(${tickets.id} as text) like ${code.replace(/^TK-/i, "").toLowerCase() + "%"}`).limit(1);
  if (!ticket) return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ images: await db.select({ id: ticketProofImages.id, url: ticketProofImages.url, createdAt: ticketProofImages.createdAt }).from(ticketProofImages).where(eq(ticketProofImages.ticketId, ticket.id)) });
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireStaff();
  if (user.role !== "OPD") return NextResponse.json({ error: "Hanya OPD dapat mengunggah bukti penyelesaian." }, { status: 403 });
  const { code } = await context.params;
  const files = (await request.formData()).getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length || files.length > 5 || files.some((file) => !allowed[file.type] || file.size > 5 * 1024 * 1024)) return NextResponse.json({ error: "Unggah 1–5 foto JPG, PNG, atau WebP; maksimal 5 MB per foto." }, { status: 400 });
  const [ticket] = await db.select().from(tickets).where(sql`cast(${tickets.id} as text) like ${code.replace(/^TK-/i, "").toLowerCase() + "%"}`).limit(1);
  if (!ticket || !ticket.districtId || (ticket.assignedToUserId && ticket.assignedToUserId !== user.id)) return NextResponse.json({ error: "Tiket tidak ditemukan atau bukan penugasan Anda." }, { status: 404 });
  const access = await db.select().from(userDistricts).where(and(eq(userDistricts.userId, user.id), eq(userDistricts.districtId, ticket.districtId))).limit(1);
  if (!access.length) return NextResponse.json({ error: "Tiket di luar wilayah kerja Anda." }, { status: 403 });
  const dir = path.join(process.cwd(), "public", "uploads", "proofs"); await mkdir(dir, { recursive: true });
  const values = await Promise.all(files.map(async (file) => { const name = `${randomUUID()}.${allowed[file.type]}`; await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer())); return { ticketId: ticket.id, uploadedByUserId: user.id, url: `/uploads/proofs/${name}`, mimeType: file.type, sizeBytes: file.size }; }));
  await db.insert(ticketProofImages).values(values);
  return NextResponse.json({ images: values }, { status: 201 });
}
