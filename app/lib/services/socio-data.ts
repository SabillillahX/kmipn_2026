import { eq } from "drizzle-orm";
import { db } from "@/src/database";
import { districtSocioData } from "@/src/database/schema";

export interface SocioDataInput {
  povertyRate?: number;
  vulnerabilityIndex?: number;
  isDisasterProne?: boolean;
  dtksRecipientDensity?: number;
  populationDensity?: number;
}

export async function getSocioDemographicScoreByDistrict(
  districtId?: string | null,
  tx?: any
): Promise<number> {
  if (!districtId) {
    return 50;
  }

  const client = tx || db;

  const records = await client
    .select()
    .from(districtSocioData)
    .where(eq(districtSocioData.districtId, districtId))
    .limit(1);

  if (records.length === 0) {
    return 50;
  }

  const data = records[0];

  const povertyPart = Math.min(40, data.povertyRate * 100 * 1.5);
  const vulnerabilityPart = Math.min(40, data.vulnerabilityIndex * 0.4);
  const disasterPart = data.isDisasterProne ? 20 : 0;
  const macroScore = povertyPart + vulnerabilityPart + disasterPart;

  const dtksPart = Math.min(15, data.dtksRecipientDensity * 0.3);
  const densityPart = Math.min(10, (data.populationDensity / 1000) * 2);
  const microScore = dtksPart + densityPart;

  const totalScore = Math.min(100, Math.max(0, macroScore * 0.75 + microScore * 1.0));
  return Math.round(totalScore * 100) / 100;
}

export async function upsertDistrictSocioData(
  districtId: string,
  input: SocioDataInput,
  tx?: any
): Promise<void> {
  const client = tx || db;

  const existing = await client
    .select()
    .from(districtSocioData)
    .where(eq(districtSocioData.districtId, districtId))
    .limit(1);

  if (existing.length > 0) {
    await client
      .update(districtSocioData)
      .set({
        povertyRate: input.povertyRate ?? existing[0].povertyRate,
        vulnerabilityIndex: input.vulnerabilityIndex ?? existing[0].vulnerabilityIndex,
        isDisasterProne: input.isDisasterProne ?? existing[0].isDisasterProne,
        dtksRecipientDensity: input.dtksRecipientDensity ?? existing[0].dtksRecipientDensity,
        populationDensity: input.populationDensity ?? existing[0].populationDensity,
        updatedAt: new Date(),
      })
      .where(eq(districtSocioData.districtId, districtId));
  } else {
    await client.insert(districtSocioData).values({
      districtId,
      povertyRate: input.povertyRate ?? 0.15,
      vulnerabilityIndex: input.vulnerabilityIndex ?? 50.0,
      isDisasterProne: input.isDisasterProne ?? false,
      dtksRecipientDensity: input.dtksRecipientDensity ?? 20.0,
      populationDensity: input.populationDensity ?? 1000.0,
    });
  }
}
