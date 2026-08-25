import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { addLocalReportImages, getLocalReport } from "@/app/lib/local-reports";
import { db } from "@/src/database";
import { reportImages, reports, tickets } from "@/src/database/schema";

export const runtime = "nodejs";

const maxFiles = 5;
const maxSizeBytes = 5 * 1024 * 1024;
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  try {
    let reportIds: string[] = [];
    if (code.toUpperCase().startsWith("TK-")) {
      const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(sql`cast(${tickets.id} as text) like ${code.slice(3).toLowerCase() + "%"}`).limit(1);
      if (ticket) reportIds = (await db.select({ id: reports.id }).from(reports).where(eq(reports.ticketId, ticket.id))).map((report) => report.id);
    } else {
      const prefix = code.replace(/^REP-/i, "").toLowerCase();
      reportIds = (await db.select({ id: reports.id }).from(reports).where(sql`cast(${reports.id} as text) like ${prefix + "%"}`).limit(1)).map((report) => report.id);
    }
    if (reportIds.length) return NextResponse.json({ images: await db.select({ id: reportImages.id, reportId: reportImages.reportId, url: reportImages.url }).from(reportImages).where(inArray(reportImages.reportId, reportIds)) });
  } catch {
    // Local JSON fallback below.
  }
  const local = await getLocalReport(code);
  if (!local) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ images: (local.imageUrls ?? []).map((url, index) => ({ id: String(index), reportId: local.id, url })) });
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const form = await request.formData().catch(() => null);
  const files = form?.getAll("images").filter((value): value is File => value instanceof File && value.size > 0) ?? [];
  if (!files.length) return NextResponse.json({ error: "Pilih setidaknya satu foto." }, { status: 400 });
  if (files.length > maxFiles) return NextResponse.json({ error: `Maksimal ${maxFiles} foto per laporan.` }, { status: 400 });
  if (files.some((file) => !extensions[file.type] || file.size > maxSizeBytes)) return NextResponse.json({ error: "Gunakan foto JPG, PNG, atau WebP dengan ukuran maksimal 5 MB per foto." }, { status: 400 });

  let reportId: string | null = null;
  try {
    const prefix = code.replace(/^REP-/i, "").toLowerCase();
    const [report] = await db.select({ id: reports.id }).from(reports).where(sql`cast(${reports.id} as text) like ${prefix + "%"}`).limit(1);
    reportId = report?.id ?? null;
  } catch {
    // Local development uses the JSON fallback below.
  }
  const localReport = reportId ? null : await getLocalReport(code);
  if (!reportId && !localReport) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });

  const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
  await mkdir(uploadDir, { recursive: true });
  const saved: Array<{ url: string; mimeType: string; sizeBytes: number; diskPath: string }> = [];
  try {
    for (const file of files) {
      const name = `${randomUUID()}.${extensions[file.type]}`;
      const diskPath = path.join(uploadDir, name);
      await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
      saved.push({ url: `/uploads/reports/${name}`, mimeType: file.type, sizeBytes: file.size, diskPath });
    }
    if (reportId) await db.insert(reportImages).values(saved.map((image) => ({ url: image.url, mimeType: image.mimeType, sizeBytes: image.sizeBytes, reportId })));
    else await addLocalReportImages(code, saved.map((image) => image.url));
  } catch {
    await Promise.all(saved.map((image) => unlink(image.diskPath).catch(() => undefined)));
    return NextResponse.json({ error: "Foto tidak dapat disimpan. Coba lagi." }, { status: 500 });
  }
  return NextResponse.json({ images: saved.map((image) => ({ url: image.url, mimeType: image.mimeType, sizeBytes: image.sizeBytes })) }, { status: 201 });
}
