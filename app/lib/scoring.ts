import { eq } from "drizzle-orm";
import { db } from "@/src/database";
import { tickets, reports } from "@/src/database/schema";

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

  const isBlocked = reportsList.some((r) => r.aiIsBlocked);
  const accessibilityScore = isBlocked ? 10 : 0;

  return Math.min(100, volumeScore + riskScore + facilityImpactScore + chronicityScore + accessibilityScore);
}

export function getSocioDemographicScore(x: number, y: number): number {
  const value = Math.abs(Math.sin(x) * Math.cos(y) * 100);
  return Math.min(100, Math.max(10, Math.round(value)));
}

export async function updateTicketUrgencyScore(
  ticketId: string,
  config?: ScoringFactors,
  tx?: any
): Promise<number | null> {
  const alpha = config?.alpha ?? 0.6;
  const beta = config?.beta ?? 0.4;
  const client = tx || db;

  const ticketRows = await client
    .select({
      ticketId: tickets.id,
      reportCount: tickets.reportCount,
      createdAt: tickets.createdAt,
      centroidLocation: tickets.centroidLocation,
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

  const location = firstRow.centroidLocation as { x: number; y: number } | null;
  const x = location?.x ?? 0;
  const y = location?.y ?? 0;
  const sb = getSocioDemographicScore(x, y);

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
