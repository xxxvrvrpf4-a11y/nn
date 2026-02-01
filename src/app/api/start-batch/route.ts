import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { createBatchRun, startRunner } from "@/src/lib/analysis/runner";
import { ANALYSIS_POLICY_VERSION, ENGINE_BUILD_ID } from "@/src/lib/analysis/config";

export async function POST(request: Request) {
  const { gameIds, planMinutes } = await request.json();
  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    return NextResponse.json({ error: "No games provided" }, { status: 400 });
  }

  const games = await prisma.game.findMany({
    where: { id: { in: gameIds } },
    include: { analysis: true }
  });
  const pendingIds = games
    .filter(
      (game) =>
        !game.analysis ||
        game.analysis.analysisPolicyVersion !== ANALYSIS_POLICY_VERSION ||
        game.analysis.engineBuildId !== ENGINE_BUILD_ID
    )
    .map((game) => game.id);

  if (pendingIds.length === 0) {
    return NextResponse.json({ message: "No pending games to analyze" });
  }

  const batch = await createBatchRun(pendingIds);
  await prisma.batchRun.update({
    where: { id: batch.id },
    data: { planMinutes: planMinutes ?? 30 }
  });

  startRunner();

  return NextResponse.json({ batchId: batch.id });
}
