import { isNull, inArray, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/src/database";
import { reports, tickets } from "@/src/database/schema";
import { updateTicketUrgencyScore } from "@/app/lib/scoring";

export async function POST() {
  try {
    await requireAdmin();
    const unclustered = await db
      .select({
        id: reports.id,
        description: reports.description,
        category: reports.category,
        location: reports.location,
        districtId: reports.districtId
      })
      .from(reports)
      .where(isNull(reports.ticketId));

    if (unclustered.length === 0) {
      return NextResponse.json({ success: true, message: "No unclustered reports found." });
    }

    const payload = unclustered.map((r) => {
      const loc = r.location as any;
      let lat = -6.2088;
      let lng = 106.8456;

      if (loc && typeof loc === 'object') {
        if (typeof loc.y === 'number' && typeof loc.x === 'number') {
          lat = loc.y;
          lng = loc.x;
        } else if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
          lng = Number(loc.coordinates[0]);
          lat = Number(loc.coordinates[1]);
        } else if (Array.isArray(loc) && loc.length >= 2) {
          lng = Number(loc[0]);
          lat = Number(loc[1]);
        }
      }

      return {
        report_id: r.id,
        text: r.description,
        latitude: lat,
        longitude: lng
      };
    });

    const response = await fetch(`${process.env.AI_SERVICE_URL}/api/v1/cluster-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch clusters from AI microservice." }, { status: 502 });
    }

    const clusters: Array<{
      master_latitude: number;
      master_longitude: number;
      representative_text: string;
      member_ids: string[];
      member_reports: Array<{
        report_id: string;
        ai_risk_score: number;
        ai_is_blocked: boolean;
      }>;
    }> = await response.json();

    await db.transaction(async (tx) => {
      for (const cluster of clusters) {
        if (cluster.member_ids.length === 0) continue;
        const firstReportId = cluster.member_ids[0];
        const firstReport = unclustered.find((r) => r.id === firstReportId);
        if (!firstReport) continue;

        const [ticket] = await tx
          .insert(tickets)
          .values({
            category: firstReport.category,
            centroidLocation: { x: cluster.master_longitude, y: cluster.master_latitude },
            status: "TERVALIDASI",
            districtId: firstReport.districtId,
            reportCount: cluster.member_ids.length
          })
          .returning({ id: tickets.id });

        for (const detail of cluster.member_reports) {
          await tx
            .update(reports)
            .set({
              ticketId: ticket.id,
              aiRiskScore: detail.ai_risk_score,
              aiIsBlocked: detail.ai_is_blocked
            })
            .where(eq(reports.id, detail.report_id as string));
        }

        await updateTicketUrgencyScore(ticket.id, undefined, tx);
      }
    });

    return NextResponse.json({ success: true, clustersProcessed: clusters.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred during clustering triage." }, { status: 500 });
  }
}
