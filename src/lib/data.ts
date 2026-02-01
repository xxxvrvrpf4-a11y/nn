import { prisma } from "@/src/lib/prisma";

export async function getLatestProfile() {
  return prisma.playerProfile.findFirst({
    orderBy: { updatedAt: "desc" },
    include: { ratingStats: true }
  });
}

export async function getDashboardData(username?: string) {
  const profile = username
    ? await prisma.playerProfile.findUnique({
        where: { username },
        include: { ratingStats: true }
      })
    : await getLatestProfile();

  const batch = await prisma.batchRun.findFirst({
    orderBy: { updatedAt: "desc" }
  });

  const weakness = profile
    ? await prisma.weaknessProfile.findFirst({
        where: { profileId: profile.id }
      })
    : null;

  const plan = profile
    ? await prisma.dailyPlan.findFirst({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        include: { items: true }
      })
    : null;

  return { profile, batch, weakness, plan };
}

export async function getGames() {
  return prisma.game.findMany({
    orderBy: { endTime: "desc" },
    include: {
      analysis: { include: { criticalMoments: true } },
      analysisJob: { include: { events: { orderBy: { createdAt: "desc" }, take: 3 } } }
    }
  });
}

export async function getGameById(id: string) {
  return prisma.game.findUnique({
    where: { id },
    include: {
      analysis: { include: { criticalMoments: true } },
      analysisJob: { include: { events: { orderBy: { createdAt: "asc" } } } }
    }
  });
}

export async function getTacticsSession(limit = 5) {
  return prisma.puzzle.findMany({
    take: limit,
    orderBy: { rating: "asc" }
  });
}

export async function getEndgameDrills(limit = 5) {
  return prisma.endgameDrill.findMany({
    take: limit,
    orderBy: { createdAt: "asc" }
  });
}
