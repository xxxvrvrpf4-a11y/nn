import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { startRunner } from "@/src/lib/analysis/runner";

export async function POST(request: Request) {
  const { action } = await request.json();
  const batch = await prisma.batchRun.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!batch) {
    return NextResponse.json({ error: "No batch" }, { status: 404 });
  }

  if (action === "pause") {
    await prisma.batchRun.update({ where: { id: batch.id }, data: { status: "paused" } });
  }
  if (action === "cancel") {
    await prisma.batchRun.update({ where: { id: batch.id }, data: { status: "cancelled" } });
    await prisma.gameAnalysisJob.updateMany({
      where: { batchRunId: batch.id, status: { in: ["queued", "running", "pending"] } },
      data: { status: "skipped" }
    });
  }
  if (action === "resume") {
    await prisma.batchRun.update({ where: { id: batch.id }, data: { status: "queued" } });
    startRunner();
  }
  if (action === "reset") {
    await prisma.gameAnalysisJob.updateMany({
      where: { batchRunId: batch.id, status: { in: ["running", "failed"] } },
      data: { status: "queued" }
    });
    await prisma.batchRun.update({ where: { id: batch.id }, data: { status: "queued" } });
    startRunner();
  }

  return NextResponse.json({ status: "ok" });
}
