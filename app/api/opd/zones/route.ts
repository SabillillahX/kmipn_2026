import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { db } from "@/src/database";
import { districts, tickets, userDistricts, zoneLocks } from "@/src/database/schema";

/** Active locks visible to an OPD. This powers the "zona sedang ditangani" panel. */
export async function GET() {
  const user = await requireStaff();
  if (user.role !== "OPD" && user.role !== "CAMAT" && user.role !== "ADMIN") return NextResponse.json({ error: "Akun internal diperlukan." }, { status: 403 });
  const assigned = user.role === "ADMIN" ? [] : await db.select({ districtId: userDistricts.districtId }).from(userDistricts).where(eq(userDistricts.userId, user.id));
  const districtIds = assigned.map((item) => item.districtId);
  if (user.role !== "ADMIN" && districtIds.length === 0) return NextResponse.json([]);
  const visibleZones = user.role === "ADMIN"
    ? isNull(zoneLocks.releasedAt)
    : and(isNull(zoneLocks.releasedAt), inArray(zoneLocks.districtId, districtIds));
  const rows = await db
    .select({
      ticketId: zoneLocks.ticketId,
      district: districts.name,
      radiusMeters: zoneLocks.radiusMeters,
      center: zoneLocks.center,
      createdAt: zoneLocks.createdAt,
      ticketStatus: tickets.status,
    })
    .from(zoneLocks)
    .innerJoin(districts, eq(zoneLocks.districtId, districts.id))
    .innerJoin(tickets, eq(zoneLocks.ticketId, tickets.id))
    .where(visibleZones);
  return NextResponse.json(rows.map((row) => ({ ...row, code: `TK-${row.ticketId.slice(0, 6).toUpperCase()}`, latitude: (row.center as any)?.y ?? 0, longitude: (row.center as any)?.x ?? 0 })));
}
