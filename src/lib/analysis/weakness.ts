import { prisma } from "@/src/lib/prisma";

export async function recomputeWeaknessProfile(profileId: string) {
  const analyses = await prisma.gameAnalysisResult.findMany({
    where: { game: { profileId } },
    include: { criticalMoments: true }
  });

  const buckets = { tactics: 0, opening: 0, endgame: 0, strategy: 0 };
  const histogram: Record<string, number> = {};

  for (const analysis of analyses) {
    for (const moment of analysis.criticalMoments) {
      if (moment.phase === "opening") buckets.opening += 1;
      if (moment.phase === "endgame") buckets.endgame += 1;
      if (moment.phase === "middlegame") buckets.tactics += 1;
      const key = `${Math.round(moment.evalDrop / 50) * 50}`;
      histogram[key] = (histogram[key] ?? 0) + 1;
    }
  }

  const patterns = [
    buckets.opening > buckets.endgame ? "Opening move-order slips" : "Endgame conversion errors",
    buckets.tactics > 2 ? "Tactical oversight in middlegame" : "Slow plan development"
  ];

  return prisma.weaknessProfile.upsert({
    where: { profileId },
    update: {
      tactics: buckets.tactics,
      opening: buckets.opening,
      endgame: buckets.endgame,
      strategy: buckets.strategy,
      evalHistogram: JSON.stringify(histogram),
      patterns: JSON.stringify(patterns)
    },
    create: {
      profileId,
      tactics: buckets.tactics,
      opening: buckets.opening,
      endgame: buckets.endgame,
      strategy: buckets.strategy,
      evalHistogram: JSON.stringify(histogram),
      patterns: JSON.stringify(patterns)
    }
  });
}
