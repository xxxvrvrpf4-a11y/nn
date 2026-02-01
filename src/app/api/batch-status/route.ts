import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const batch = await prisma.batchRun.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!batch) {
    return NextResponse.json({ status: "idle" });
  }

  const currentJob = batch.currentGameId
    ? await prisma.gameAnalysisJob.findFirst({
        where: { gameId: batch.currentGameId },
        include: { events: { take: 3, orderBy: { createdAt: "desc" } } }
      })
    : null;

  return NextResponse.json({
    batch,
    currentJob
  });
}
