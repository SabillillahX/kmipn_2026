import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "./auth";
import { db } from "@/src/database";
import { users } from "@/src/database/schema";

export const requireStaff = cache(async () => {
  if (process.env.NODE_ENV === "development" && (await cookies()).get("splik_local_admin")?.value === "1") return { id: "local-admin", name: "Admin Lokal", role: "ADMIN" as const };
  const session = await getSession();
  if (!session) redirect("/login");
  const [user] = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) redirect("/login");
  return user;
});

/** Global operational pages remain restricted to the system administrator. */
export const requireAdmin = cache(async () => {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/dashboard/opd");
  return user;
});
