import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { reports } from "@/src/db/schema";
import { createLocalReport } from "@/app/lib/local-reports";

const categories = new Set(["Infrastruktur", "Lingkungan & kebersihan", "Penerangan jalan", "Kesehatan lingkungan"]);
const severityToPriority: Record<string, string> = { Ringan: "rendah", Sedang: "sedang", Berat: "tinggi" };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const category = typeof body?.category === "string" ? body.category : "";
  const severity = typeof body?.severity === "string" ? body.severity : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const contactPhone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  if (!categories.has(category) || !severityToPriority[severity] || description.length < 10 || !contactPhone || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return NextResponse.json({ error: "Data laporan belum lengkap atau lokasi belum dipilih." }, { status: 400 });
  const code = `SPLIK-${new Date().getFullYear().toString().slice(-2)}${String(Date.now()).slice(-6)}`;
  try {
    await db.insert(reports).values({ code, category, severity, description, contactPhone, latitude, longitude, priority: severityToPriority[severity] });
    return NextResponse.json({ code }, { status: 201 });
  } catch {
    if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Database laporan belum tersedia." }, { status: 503 });
    const report = await createLocalReport({ category, severity, description, contactPhone, latitude, longitude, priority: severityToPriority[severity] });
    return NextResponse.json({ code: report.code, local: true }, { status: 201 });
  }
}
