import { and, desc, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { getLocalReports } from "@/app/lib/local-reports";
import { db } from "@/src/database";
import { notifications, tickets } from "@/src/database/schema";

export async function GET() {
  const user = await requireStaff();
  if (user.role !== "OPD" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Dashboard ini khusus OPD." }, { status: 403 });
  }

  let assignedTickets: Array<{
    id: string;
    code: string;
    category: string;
    status: string;
    updatedAt: string;
    createdAt?: string;
    latitude: number;
    longitude: number;
  }> = [];

  let alerts: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: string;
    readAt: string | null;
  }> = [];

  try {
    // Only fetch tickets that have been explicitly assigned to OPD role/user by Camat/Admin
    const dbTickets = await db
      .select({
        id: tickets.id,
        category: tickets.category,
        status: tickets.status,
        updatedAt: tickets.updatedAt,
        createdAt: tickets.createdAt,
        location: tickets.centroidLocation,
        assignedToUserId: tickets.assignedToUserId,
        assignedToRole: tickets.assignedToRole,
      })
      .from(tickets)
      .where(
        and(
          or(eq(tickets.assignedToUserId, user.id), eq(tickets.assignedToRole, "OPD")),
          inArray(tickets.status, ["TERVALIDASI", "DIPROSES_OPD", "SHARED_LOCK", "SELESAI"])
        )
      )
      .orderBy(desc(tickets.updatedAt))
      .limit(30);

    assignedTickets = dbTickets.map((t) => ({
      id: t.id,
      code: `TK-${t.id.slice(0, 6).toUpperCase()}`,
      category: t.category,
      status: t.status,
      updatedAt: t.updatedAt.toISOString(),
      createdAt: t.createdAt?.toISOString(),
      latitude: (t.location as any)?.y ?? -7.0658,
      longitude: (t.location as any)?.x ?? 110.42918,
    }));

    if (user.id !== "local-admin") {
      const dbAlerts = await db
        .select({
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          createdAt: notifications.createdAt,
          readAt: notifications.readAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(8);

      alerts = dbAlerts.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
        readAt: a.readAt ? a.readAt.toISOString() : null,
      }));
    }
  } catch (err) {
    // Database query bypass
  }

  // Local JSON fallback (Only if DB tickets are empty)
  if (assignedTickets.length === 0) {
    try {
      const localReports = await getLocalReports();
      // Only include reports that have been assigned to OPD and moved beyond initial status
      const assignedLocal = localReports.filter(
        (r) => r.assignedTo && r.status !== "baru" && r.status !== "ditolak"
      );

      for (const r of assignedLocal) {
        let mappedStatus = "TERVALIDASI";
        if (r.status === "diproses") mappedStatus = "DIPROSES_OPD";
        if (r.status === "selesai") mappedStatus = "SELESAI";

        assignedTickets.push({
          id: r.id,
          code: r.code,
          category: r.category,
          status: mappedStatus,
          updatedAt: r.createdAt,
          createdAt: r.createdAt,
          latitude: r.latitude,
          longitude: r.longitude,
        });
      }
    } catch (err) {}
  }

  return NextResponse.json({ tickets: assignedTickets, notifications: alerts });
}
