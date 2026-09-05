import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/src/database";
import { reports, tickets } from "@/src/database/schema";
import { getLocalReports } from "@/app/lib/local-reports";

export async function GET() {
  const user = await requireAdmin();
  let rows: Array<{
    id: string;
    code: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    priority: string;
    status: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }> = [];
  let local = false;
  let rawReports: Array<{
    category: string;
    status: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }> = [];
  try {
    const dbRows = await db
      .select({
        id: reports.id,
        category: reports.category,
        damageLevel: reports.damageLevel,
        description: reports.description,
        location: reports.location,
        createdAt: reports.createdAt,
        ticketId: reports.ticketId,
        ticketStatus: tickets.status,
        ticketUpdatedAt: tickets.updatedAt,
        ticketUrgencyScore: tickets.urgencyScore,
        ticketCentroidLocation: tickets.centroidLocation,
      })
      .from(reports)
      .leftJoin(tickets, eq(reports.ticketId, tickets.id))
      .orderBy(desc(reports.createdAt));

    const catLabelMap: Record<string, string> = {
      INFRASTRUKTUR: "Infrastruktur",
      KEBERSIHAN: "Lingkungan & kebersihan",
      PENERANGAN_JALAN: "Penerangan jalan",
      KESEHATAN_LINGKUNGAN: "Kesehatan lingkungan"
    };

    const ticketMap = new Map<string, any[]>();
    const unclusteredRows: any[] = [];

    for (const row of dbRows) {
      if (row.ticketId) {
        if (!ticketMap.has(row.ticketId)) {
          ticketMap.set(row.ticketId, []);
        }
        ticketMap.get(row.ticketId)!.push(row);
      } else {
        unclusteredRows.push(row);
      }
    }

    const processedRows: typeof rows = [];

    for (const [ticketId, reportsInTicket] of ticketMap.entries()) {
      const firstReport = reportsInTicket[0];
      const lat = (firstReport.ticketCentroidLocation as any)?.y ?? (firstReport.location as any)?.y ?? 0;
      const lng = (firstReport.ticketCentroidLocation as any)?.x ?? (firstReport.location as any)?.x ?? 0;
      const score = firstReport.ticketUrgencyScore ?? 0;
      const priority = score >= 70 ? "tinggi" : score >= 40 ? "sedang" : "rendah";

      let status = "baru";
      if (firstReport.ticketStatus === "DIPROSES_OPD" || firstReport.ticketStatus === "SHARED_LOCK") {
        status = "diproses";
      } else if (firstReport.ticketStatus === "SELESAI") {
        status = "selesai";
      }

      processedRows.push({
        id: ticketId,
        code: `TK-${ticketId.slice(0, 6).toUpperCase()}`,
        category: catLabelMap[firstReport.category] ?? firstReport.category,
        description: `${firstReport.description} (Klaster ${reportsInTicket.length} aduan)`,
        latitude: lat,
        longitude: lng,
        priority,
        status,
        createdAt: firstReport.createdAt,
        resolvedAt: firstReport.ticketStatus === "SELESAI" ? firstReport.ticketUpdatedAt : null
      });
    }

    for (const row of unclusteredRows) {
      const lat = (row.location as any)?.y ?? 0;
      const lng = (row.location as any)?.x ?? 0;
      const priority = row.damageLevel === 1 ? "rendah" : row.damageLevel === 2 ? "sedang" : "tinggi";

      processedRows.push({
        id: row.id,
        code: `REP-${row.id.slice(0, 6).toUpperCase()}`,
        category: catLabelMap[row.category] ?? row.category,
        description: row.description,
        latitude: lat,
        longitude: lng,
        priority,
        status: "baru",
        createdAt: row.createdAt,
        resolvedAt: null
      });
    }

    processedRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    rows = processedRows;

    rawReports = dbRows.map(row => {
      let status = "baru";
      if (row.ticketId) {
        if (row.ticketStatus === "SELESAI") {
          status = "selesai";
        } else if (row.ticketStatus === "DIPROSES_OPD" || row.ticketStatus === "SHARED_LOCK") {
          status = "diproses";
        }
      }
      return {
        category: catLabelMap[row.category] ?? row.category,
        status,
        createdAt: row.createdAt,
        resolvedAt: (row.ticketId && row.ticketStatus === "SELESAI") ? row.ticketUpdatedAt : null
      };
    });
  } catch (err) {
    local = true;
    rows = (await getLocalReports()).map(({ history: _history, ...report }) => {
      let status = "baru";
      if (report.status === "diproses") status = "diproses";
      else if (report.status === "selesai") status = "selesai";
      return {
        ...report,
        latitude: report.latitude,
        longitude: report.longitude,
        status,
        createdAt: new Date(report.createdAt),
        resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : null
      };
    });

    rawReports = rows.map(r => ({
      category: r.category,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt
    }));
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const actionable = rawReports.filter((report) => report.status === "baru" || report.status === "diproses");
  const resolved = rawReports.filter((report) => report.status === "selesai");

  const chart = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now - (6 - index) * 86400000);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day.getTime() + 86400000);
    return {
      label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day),
      masuk: rawReports.filter((report) => report.createdAt >= day && report.createdAt < next).length,
      selesai: rawReports.filter((report) => report.resolvedAt && report.resolvedAt >= day && report.resolvedAt < next).length
    };
  });

  const categories = rawReports.reduce<Record<string, number>>((counts, report) => {
    counts[report.category] = (counts[report.category] ?? 0) + 1;
    return counts;
  }, {});

  return NextResponse.json({
    user,
    metrics: {
      total: rawReports.length,
      actionable: actionable.length,
      inProgress: rawReports.filter((report) => report.status === "diproses").length,
      resolved: resolved.filter((report) => report.resolvedAt && report.resolvedAt.getTime() >= sevenDaysAgo).length
    },
    categories,
    chart,
    reports: rows.slice(0, 10).map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null
    })),
    local
  });
}
