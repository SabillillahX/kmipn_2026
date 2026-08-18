import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";
import { getLocalReport, ReportStatus, updateLocalReport } from "@/app/lib/local-reports";

const statuses = new Set<ReportStatus>(["baru", "diverifikasi", "diproses", "selesai", "ditolak"]);

export async function GET(_request: Request, context: RouteContext<"/api/admin/reports/[code]">) {
  await requireAdmin(); const { code } = await context.params; const report = await getLocalReport(code);
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  return NextResponse.json(report);
}

export async function PATCH(request: Request, context: RouteContext<"/api/admin/reports/[code]">) {
  await requireAdmin(); const { code } = await context.params; const body = await request.json().catch(() => null);
  if (!statuses.has(body?.status) || typeof body?.note !== "string" || body.note.trim().length < 5) return NextResponse.json({ error: "Status dan catatan minimal 5 karakter wajib diisi." }, { status: 400 });
  const report = await updateLocalReport(code, { status: body.status, note: body.note, assignedTo: typeof body.assignedTo === "string" ? body.assignedTo : undefined });
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  return NextResponse.json(report);
}
