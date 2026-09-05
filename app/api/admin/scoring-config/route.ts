import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/src/database";
import { districts, districtScoringConfigs, districtSocioData, tickets } from "@/src/database/schema";
import { updateTicketUrgencyScore } from "@/app/lib/scoring";
import { upsertDistrictSocioData } from "@/app/lib/services/socio-data";

export async function GET() {
  try {
    await requireAdmin();

    const districtList = await db.select().from(districts);
    const configs = await db.select().from(districtScoringConfigs);
    const socioData = await db.select().from(districtSocioData);

    const result = districtList.map((d) => {
      const cfg = configs.find((c) => c.districtId === d.id);
      const socio = socioData.find((s) => s.districtId === d.id);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        alpha: cfg?.alpha ?? 0.6,
        beta: cfg?.beta ?? 0.4,
        povertyRate: socio?.povertyRate ?? 0.15,
        vulnerabilityIndex: socio?.vulnerabilityIndex ?? 50.0,
        isDisasterProne: socio?.isDisasterProne ?? false,
        dtksRecipientDensity: socio?.dtksRecipientDensity ?? 20.0,
        populationDensity: socio?.populationDensity ?? 1000.0,
        updatedAt: cfg?.updatedAt || socio?.updatedAt || d.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch scoring configs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const {
      districtId,
      alpha,
      beta,
      povertyRate,
      vulnerabilityIndex,
      isDisasterProne,
      dtksRecipientDensity,
      populationDensity,
    } = body;

    if (!districtId) {
      return NextResponse.json({ error: "districtId is required" }, { status: 400 });
    }

    let parsedAlpha = typeof alpha === "number" ? alpha : 0.6;
    let parsedBeta = typeof beta === "number" ? beta : 0.4;

    const sum = parsedAlpha + parsedBeta;
    if (sum !== 0) {
      parsedAlpha = Math.round((parsedAlpha / sum) * 100) / 100;
      parsedBeta = Math.round((1 - parsedAlpha) * 100) / 100;
    }

    const existingConfig = await db
      .select()
      .from(districtScoringConfigs)
      .where(eq(districtScoringConfigs.districtId, districtId))
      .limit(1);

    if (existingConfig.length > 0) {
      await db
        .update(districtScoringConfigs)
        .set({
          alpha: parsedAlpha,
          beta: parsedBeta,
          updatedAt: new Date(),
        })
        .where(eq(districtScoringConfigs.districtId, districtId));
    } else {
      await db.insert(districtScoringConfigs).values({
        districtId,
        alpha: parsedAlpha,
        beta: parsedBeta,
      });
    }

    if (
      povertyRate !== undefined ||
      vulnerabilityIndex !== undefined ||
      isDisasterProne !== undefined ||
      dtksRecipientDensity !== undefined ||
      populationDensity !== undefined
    ) {
      await upsertDistrictSocioData(districtId, {
        povertyRate,
        vulnerabilityIndex,
        isDisasterProne,
        dtksRecipientDensity,
        populationDensity,
      });
    }

    const districtTickets = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.districtId, districtId));

    for (const ticket of districtTickets) {
      await updateTicketUrgencyScore(ticket.id);
    }

    return NextResponse.json({
      success: true,
      message: "Scoring configuration updated successfully",
      alpha: parsedAlpha,
      beta: parsedBeta,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save scoring config" }, { status: 500 });
  }
}
