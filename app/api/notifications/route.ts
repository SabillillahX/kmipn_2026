import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { db } from "@/src/database";
import { notifications } from "@/src/database/schema";

export async function GET() {
  const user = await requireStaff();
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(20);
  return NextResponse.json(rows);
}

export async function PATCH(request: Request) {
  const user = await requireStaff();
  const body = await request.json().catch(() => ({}));
  if (body?.all) await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, user.id));
  return NextResponse.json({ ok: true });
}
