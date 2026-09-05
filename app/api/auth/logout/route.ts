import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/app/lib/auth";

export async function POST() {
  await deleteSession();
  (await cookies()).delete("splik_local_admin");
  return NextResponse.json({ ok: true });
}
