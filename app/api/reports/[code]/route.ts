import { NextResponse } from "next/server";
import { getLocalReport } from "@/app/lib/local-reports";

export async function GET(_request: Request, context: RouteContext<"/api/reports/[code]">) {
  const { code } = await context.params;
  const report = await getLocalReport(code);
  if (!report) return NextResponse.json({ error: "Kode laporan tidak ditemukan." }, { status: 404 });
  const { contactPhone: _contactPhone, ...publicReport } = report;
  return NextResponse.json(publicReport);
}
