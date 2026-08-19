import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, verifyPassword } from "@/app/lib/auth";
import { db } from "@/src/database";
import { users } from "@/src/database/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || user.role !== "gov_employee" || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({ error: "Email atau password tidak sesuai." }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    const localLogin = process.env.NODE_ENV === "development" && email === process.env.LOCAL_ADMIN_EMAIL?.toLowerCase() && password === process.env.LOCAL_ADMIN_PASSWORD;
    if (!localLogin) return NextResponse.json({ error: "Database belum tersambung. Gunakan kredensial admin lokal dari .env." }, { status: 503 });
    (await cookies()).set("splik_local_admin", "1", { httpOnly: true, sameSite: "lax", path: "/" });
    return NextResponse.json({ ok: true, local: true });
  }
}
