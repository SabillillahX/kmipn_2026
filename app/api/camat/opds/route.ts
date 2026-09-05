import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { db } from "@/src/database";
import { users, userDistricts, districts } from "@/src/database/schema";
import { eq } from "drizzle-orm";

const DEFAULT_OPDS = [
  { name: "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)", email: "opd.pupr@sukamaju.go.id" },
  { name: "Dinas Lingkungan Hidup (DLH)", email: "opd.dlh@sukamaju.go.id" },
  { name: "Dinas Perhubungan (Dishub)", email: "opd.dishub@sukamaju.go.id" },
  { name: "Dinas Kesehatan (Dinkes)", email: "opd.dinkes@sukamaju.go.id" },
  { name: "Satuan Polisi Pamong Praja (Satpol PP)", email: "opd.satpolpp@sukamaju.go.id" },
];

export async function GET(request: Request) {
  const user = await requireStaff();
  if (user.role !== "CAMAT" && user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const districtId = url.searchParams.get("districtId");

  try {
    let opds = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "OPD"));

    // If no OPD users exist in DB yet, seed standard OPD accounts
    if (opds.length === 0) {
      for (const opdDef of DEFAULT_OPDS) {
        await db.insert(users).values({
          name: opdDef.name,
          email: opdDef.email,
          role: "OPD",
          passwordHash: "opd12345",
        }).onConflictDoNothing();
      }
      opds = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "OPD"));
    }

    // Ensure all OPD users have district access mapping if districtId is given
    if (districtId) {
      for (const opd of opds) {
        await db.insert(userDistricts).values({
          userId: opd.id,
          districtId: districtId,
        }).onConflictDoNothing();
      }
    }

    return NextResponse.json(opds);
  } catch (err) {
    // Return standard fallback OPD list if database is unreachable in local mode
    return NextResponse.json(
      DEFAULT_OPDS.map((opd, i) => ({ id: `local-opd-${i + 1}`, name: opd.name }))
    );
  }
}
