import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";
import { hashPassword } from "@/app/lib/auth";
import { db } from "@/src/database";
import { districts, userDistricts, users } from "@/src/database/schema";

export async function GET() {
  await requireAdmin();
  const [districtRows, userRows, assignments] = await Promise.all([
    db.select({ id: districts.id, name: districts.name, code: districts.code }).from(districts),
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users),
    db.select().from(userDistricts),
  ]);
  return NextResponse.json({ districts: districtRows, users: userRows.map((user) => ({ ...user, districtIds: assignments.filter((item) => item.userId === user.id).map((item) => item.districtId) })) });
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  if (body?.kind === "district") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!name || !code) return NextResponse.json({ error: "Nama dan kode kecamatan wajib diisi." }, { status: 400 });
    const [district] = await db.insert(districts).values({ name, code }).returning({ id: districts.id, name: districts.name, code: districts.code });
    return NextResponse.json(district, { status: 201 });
  }
  if (body?.kind === "user") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "CAMAT" || body.role === "OPD" ? body.role : "";
    const districtId = typeof body.districtId === "string" ? body.districtId : "";
    if (!name || !email || password.length < 8 || !role || !districtId) return NextResponse.json({ error: "Data akun belum lengkap." }, { status: 400 });
    const [user] = await db.insert(users).values({ name, email, passwordHash: await hashPassword(password), role }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });
    await db.insert(userDistricts).values({ userId: user.id, districtId });
    return NextResponse.json(user, { status: 201 });
  }
  return NextResponse.json({ error: "Jenis data tidak valid." }, { status: 400 });
}
