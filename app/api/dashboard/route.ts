import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/src/db";
import { reports } from "@/src/db/schema";
import { getLocalReports } from "@/app/lib/local-reports";

export async function GET() {
  const user = await requireAdmin();
  let rows: Array<Omit<typeof reports.$inferSelect, "createdAt" | "resolvedAt"> & { createdAt: Date; resolvedAt: Date | null }> = [];
  let local = false;
  try { rows = await db.select().from(reports).orderBy(desc(reports.createdAt)); }
  catch {
    local = true;
    rows = (await getLocalReports()).map(({ history: _history, ...report }) => ({ ...report, assignedTo: null, createdAt: new Date(report.createdAt), resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : null }));
  }
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const actionable = rows.filter((report) => report.status === "baru" || report.status === "diproses");
  const resolved = rows.filter((report) => report.status === "selesai");
  const chart = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now - (6 - index) * 86400000); day.setHours(0, 0, 0, 0);
    const next = new Date(day.getTime() + 86400000);
    return { label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day), masuk: rows.filter((report) => report.createdAt >= day && report.createdAt < next).length, selesai: rows.filter((report) => report.resolvedAt && report.resolvedAt >= day && report.resolvedAt < next).length };
  });
  const categories = rows.reduce<Record<string, number>>((counts, report) => { counts[report.category] = (counts[report.category] ?? 0) + 1; return counts; }, {});
  return NextResponse.json({ user, metrics: { total: rows.length, actionable: actionable.length, inProgress: rows.filter((report) => report.status === "diproses").length, resolved: resolved.filter((report) => report.resolvedAt && report.resolvedAt.getTime() >= sevenDaysAgo).length }, categories, chart, reports: rows.slice(0, 10).map((report) => ({ ...report, createdAt: report.createdAt.toISOString(), resolvedAt: report.resolvedAt?.toISOString() ?? null })), local });
}
