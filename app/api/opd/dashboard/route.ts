import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { db } from "@/src/database";
import { notifications, tickets } from "@/src/database/schema";

export async function GET() {
  const user = await requireStaff();
  if (user.role !== "OPD") return NextResponse.json({ error: "Dashboard ini khusus OPD." }, { status: 403 });
  const [assigned, alerts] = await Promise.all([
    db.select({ id: tickets.id, category: tickets.category, status: tickets.status, updatedAt: tickets.updatedAt, location: tickets.centroidLocation }).from(tickets).where(eq(tickets.assignedToUserId, user.id)).orderBy(desc(tickets.updatedAt)).limit(20),
    db.select({ id: notifications.id, title: notifications.title, message: notifications.message, createdAt: notifications.createdAt, readAt: notifications.readAt }).from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(8),
  ]);
  return NextResponse.json({ tickets: assigned.map((ticket) => ({ ...ticket, code: `TK-${ticket.id.slice(0, 6).toUpperCase()}`, latitude: (ticket.location as any)?.y ?? 0, longitude: (ticket.location as any)?.x ?? 0 })), notifications: alerts });
}
