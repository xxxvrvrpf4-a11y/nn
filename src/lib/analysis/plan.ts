import { prisma } from "@/src/lib/prisma";

export async function generateDailyPlan(profileId: string, minutes: number) {
  const weakness = await prisma.weaknessProfile.findFirst({ where: { profileId } });
  const base = weakness
    ? {
        tactics: weakness.tactics,
        opening: weakness.opening,
        endgame: weakness.endgame,
        strategy: weakness.strategy
      }
    : { tactics: 1, opening: 1, endgame: 1, strategy: 1 };

  const total = Object.values(base).reduce((sum, val) => sum + val, 0) || 1;
  const plan = await prisma.dailyPlan.create({
    data: {
      profileId,
      minutes
    }
  });

  const items = [
    { type: "tactics", title: "Tactics session", share: base.tactics },
    { type: "endgame", title: "Endgame micro-drill", share: base.endgame },
    { type: "review", title: "Review critical moments", share: base.strategy },
    { type: "opening", title: "Opening/strategy review", share: base.opening }
  ];

  for (const item of items) {
    const itemMinutes = Math.max(5, Math.round((item.share / total) * minutes));
    await prisma.dailyPlanItem.create({
      data: {
        planId: plan.id,
        type: item.type,
        title: item.title,
        minutes: itemMinutes,
        payload: JSON.stringify({})
      }
    });
  }

  return prisma.dailyPlan.findUnique({ where: { id: plan.id }, include: { items: true } });
}
