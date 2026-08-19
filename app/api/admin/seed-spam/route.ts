import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/src/database";
import { reports } from "@/src/database/schema";

export async function POST() {
  try {
    await requireAdmin();

    const baseLng = 106.8456;
    const baseLat = -6.2088;

    const descriptions = [
      "jalan bolong",
      "aspal rusak parah",
      "awas lubang besar",
      "jalan rusak berlubang",
      "ada lubang besar di jalan",
      "aspal hancur berlubang",
      "jalan berlubang parah",
      "jalan ambles berlubang"
    ];

    const reportsToInsert = [];
    for (let i = 0; i < 50; i++) {
      const lng = baseLng + (Math.random() - 0.5) * 0.00015;
      const lat = baseLat + (Math.random() - 0.5) * 0.00015;
      const desc = descriptions[i % descriptions.length];
      const damageLevel = Math.floor(Math.random() * 3) + 1;

      reportsToInsert.push({
        reporterPhone: `0812345678${i.toString().padStart(2, "0")}`,
        category: "INFRASTRUKTUR" as const,
        damageLevel,
        description: desc,
        location: { x: lng, y: lat }
      });
    }

    await db.insert(reports).values(reportsToInsert);

    return NextResponse.json({ success: true, count: 50 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to seed spam reports." },
      { status: 500 }
    );
  }
}
