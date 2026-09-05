import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { getLocalReport, updateLocalReport } from "@/app/lib/local-reports";
import { db } from "@/src/database";
import { ticketProofImages, tickets, userDistricts, auditLogs, notifications, users, reports, districts } from "@/src/database/schema";

export const runtime = "nodejs";

const maxFiles = 5;
const maxSizeBytes = 10 * 1024 * 1024; // 10 MB per photo

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/heic-sequence": "heic",
  "image/heif-sequence": "heif",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
};

function getFileExtension(file: File): string {
  if (extensions[file.type]) return extensions[file.type];
  if (file.name.includes(".")) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext && ext.length <= 4) return ext;
  }
  return "jpg";
}

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  await requireStaff();
  const { code } = await context.params;
  try {
    let ticketId: string | null = null;
    if (code.toUpperCase().startsWith("TK-")) {
      const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(sql`cast(${tickets.id} as text) like ${code.slice(3).toLowerCase() + "%"}`).limit(1);
      ticketId = ticket?.id ?? null;
    } else if (code.toUpperCase().startsWith("REP-")) {
      const [r] = await db.select({ ticketId: reports.ticketId }).from(reports).where(sql`cast(${reports.id} as text) like ${code.slice(4).toLowerCase() + "%"}`).limit(1);
      ticketId = r?.ticketId ?? null;
    }

    if (ticketId) {
      const images = await db.select({ id: ticketProofImages.id, url: ticketProofImages.url, createdAt: ticketProofImages.createdAt }).from(ticketProofImages).where(eq(ticketProofImages.ticketId, ticketId));
      return NextResponse.json({ images });
    }
  } catch {}

  const local = await getLocalReport(code);
  return NextResponse.json({ images: (local?.imageUrls ?? []).map((url, i) => ({ id: String(i), url })) });
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const user = await requireStaff();
  if (user.role !== "OPD") return NextResponse.json({ error: "Hanya OPD yang dapat mengunggah bukti penyelesaian." }, { status: 403 });
  const { code } = await context.params;
  const formData = await request.formData().catch(() => new FormData());
  const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);

  if (!files.length) return NextResponse.json({ error: "Unggah minimal 1 foto bukti penyelesaian." }, { status: 400 });
  if (files.length > maxFiles) return NextResponse.json({ error: `Maksimal ${maxFiles} foto per laporan.` }, { status: 400 });
  if (files.some((file) => file.size > maxSizeBytes)) return NextResponse.json({ error: "Ukuran foto maksimal 10 MB per foto." }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads", "proofs");
  await mkdir(dir, { recursive: true });

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
      const savedValues: Array<{ ticketId: string; uploadedByUserId: string; url: string; mimeType: string; sizeBytes: number }> = [];

      for (const file of files) {
        const ext = getFileExtension(file);
        const name = `${randomUUID()}.${ext}`;
        await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
        savedValues.push({
          ticketId: ticketRecord.id,
          uploadedByUserId: user.id,
          url: `/uploads/proofs/${name}`,
          mimeType: file.type || `image/${ext}`,
          sizeBytes: file.size,
        });
      }

      await db.insert(ticketProofImages).values(savedValues);

      const noteRaw = formData.get("note");
      const note = typeof noteRaw === "string" && noteRaw.trim().length > 0 ? noteRaw : "Penanganan selesai oleh OPD (Bukti terlampir).";

      await db.update(tickets).set({ status: "SELESAI", updatedAt: new Date() }).where(eq(tickets.id, ticketRecord.id));

      if (user.id !== "local-admin") {
        await db.insert(auditLogs).values({
          ticketId: ticketRecord.id,
          userId: user.id,
          action: "SELESAI",
          reason: note,
        });
      }

      return NextResponse.json({ images: savedValues }, { status: 201 });
    }
  } catch (err) {
    // Local fallback mode below
  }

  // Local JSON mode fallback
  const savedUrls: string[] = [];
  for (const file of files) {
    const ext = getFileExtension(file);
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    savedUrls.push(`/uploads/proofs/${name}`);
  }

  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim().length > 0 ? noteRaw : "Penanganan selesai oleh OPD (Bukti terlampir).";

  await updateLocalReport(code, {
    status: "selesai",
    note: note,
    assignedTo: "Tim Lapangan OPD",
  });

  return NextResponse.json({ images: savedUrls.map(url => ({ url })) }, { status: 201 });
}
