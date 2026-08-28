import { eq } from "drizzle-orm";
import { db } from "@/src/database";
import { tickets, reports, districtScoringConfigs } from "@/src/database/schema";
import { getSocioDemographicScoreByDistrict } from "@/app/lib/services/socio-data";

export interface ScoringFactors {
  alpha?: number;
  beta?: number;
}

export function calculateTechnicalImpactScore(
  reportCount: number,
  reportsList: { damageLevel: number; description: string; category: string; aiRiskScore: number; aiIsBlocked: boolean }[],
  createdAt: Date
): number {
  const count = Math.max(1, reportCount);
  const volumeScore = Math.min(20, Math.log1p(count) * 5);

  const maxDamageLevel = reportsList.length > 0
    ? Math.max(...reportsList.map((r) => r.damageLevel))
    : 1;

  const maxAiRisk = reportsList.length > 0
    ? Math.max(...reportsList.map((r) => r.aiRiskScore))
    : 1;

  let riskScore = 10;
  if (maxAiRisk === 4) {
    riskScore = 40;
  } else if (maxAiRisk === 3) {
    riskScore = 30;
  } else if (maxAiRisk === 2) {
    riskScore = 20;
  }

  const hasInfrastructure = reportsList.some((r) => r.category === "INFRASTRUKTUR");
  const facilityImpactPercent = Math.min(
    100,
    Math.max(10, maxDamageLevel * 20 + (hasInfrastructure ? 20 : 0))
  );
  const facilityImpactScore = facilityImpactPercent * 0.2;

  const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const chronicityScore = Math.min(10, ageInHours * 0.5);

  const essentialKeywords = ["puskesmas", "sekolah", "rumah sakit", "rs", "pasar", "fasilitas", "akses utama"];
  const mentionsEssentialService = reportsList.some((r) => {
    const desc = r.description.toLowerCase();
    return essentialKeywords.some((kw) => desc.includes(kw));
  });

  const isBlocked = reportsList.some((r) => r.aiIsBlocked);
  const accessibilityScore = (isBlocked || mentionsEssentialService) ? 10 : 0;

  return Math.min(100, volumeScore + riskScore + facilityImpactScore + chronicityScore + accessibilityScore);
}

export async function updateTicketUrgencyScore(
  ticketId: string,
  config?: ScoringFactors,
  tx?: any
): Promise<number | null> {
  const client = tx || db;

  const ticketRows = await client
    .select({
      ticketId: tickets.id,
      districtId: tickets.districtId,
      reportCount: tickets.reportCount,
      createdAt: tickets.createdAt,
      reportId: reports.id,
      reportDamageLevel: reports.damageLevel,
      reportDescription: reports.description,
      reportCategory: reports.category,
      aiRiskScore: reports.aiRiskScore,
      aiIsBlocked: reports.aiIsBlocked,
    })
    .from(tickets)
    .leftJoin(reports, eq(reports.ticketId, tickets.id))
    .where(eq(tickets.id, ticketId));

  if (ticketRows.length === 0) {
    return null;
  }

  const firstRow = ticketRows[0];
  let alpha = config?.alpha;
  let beta = config?.beta;

  if (alpha === undefined || beta === undefined) {
    if (firstRow.districtId) {
      const configRows = await client
        .select()
        .from(districtScoringConfigs)
        .where(eq(districtScoringConfigs.districtId, firstRow.districtId))
        .limit(1);

      if (configRows.length > 0) {
        alpha = configRows[0].alpha;
        beta = configRows[0].beta;
      }
    }
  }

  alpha = alpha ?? 0.6;
  beta = beta ?? 0.4;

  const totalWeight = alpha + beta;
  if (totalWeight !== 0) {
    alpha = alpha / totalWeight;
    beta = beta / totalWeight;
  }

  const reportsList = ticketRows
    .filter((row: any) => row.reportId !== null)
    .map((row: any) => ({
      damageLevel: row.reportDamageLevel!,
      description: row.reportDescription!,
      category: row.reportCategory!,
      aiRiskScore: row.aiRiskScore!,
      aiIsBlocked: row.aiIsBlocked!,
    }));

  const sa = calculateTechnicalImpactScore(
    firstRow.reportCount,
    reportsList,
    firstRow.createdAt
  );

  const sb = await getSocioDemographicScoreByDistrict(firstRow.districtId, client);

  const scoreUrgency = alpha * sa + beta * sb;
  const roundedScore = Math.min(100, Math.max(0, Math.round(scoreUrgency * 100) / 100));

  await client
    .update(tickets)
    .set({
      urgencyScore: roundedScore,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId));

  return roundedScore;
}
