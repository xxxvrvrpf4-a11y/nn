import { prisma } from "@/src/lib/prisma";
import { analyzeGame } from "@/src/lib/analysis/analyze-game";
import { GAME_TIMEOUT_MS } from "@/src/lib/analysis/config";
import { recomputeWeaknessProfile } from "@/src/lib/analysis/weakness";
import { generateDailyPlan } from "@/src/lib/analysis/plan";

const RUNNER_INTERVAL_MS = 1500;

declare global {
  // eslint-disable-next-line no-var
  var analysisRunner: NodeJS.Timeout | undefined;
}

async function logEvent(jobId: string, type: string, message: string) {
  await prisma.jobEvent.create({
    data: {
      jobId,
      type,
      message
    }
  });

  await prisma.gameAnalysisJob.update({
    where: { id: jobId },
    data: {
      lastEventMessage: message,
      lastEventAt: new Date()
    }
  });
}

export async function createBatchRun(gameIds: string[]) {
  const batch = await prisma.batchRun.create({
    data: {
      status: "queued",
      totalGames: gameIds.length,
      doneGames: 0,
      failedGames: 0,
      skippedGames: 0
    }
  });

  for (const gameId of gameIds) {
    const job = await prisma.gameAnalysisJob.upsert({
      where: { gameId },
      update: {
        status: "queued",
        phase: "parsing",
        batchRunId: batch.id
      },
      create: {
        gameId,
        status: "queued",
        phase: "parsing",
        batchRunId: batch.id
      }
    });
    await logEvent(job.id, "JOB_QUEUED", "Job queued for analysis");
  }

  return batch;
}

async function updateBatchCounts(batchId: string) {
  const [done, failed, skipped] = await Promise.all([
    prisma.gameAnalysisJob.count({ where: { batchRunId: batchId, status: "done" } }),
    prisma.gameAnalysisJob.count({ where: { batchRunId: batchId, status: "failed" } }),
    prisma.gameAnalysisJob.count({ where: { batchRunId: batchId, status: "skipped" } })
  ]);

  await prisma.batchRun.update({
    where: { id: batchId },
    data: {
      doneGames: done,
      failedGames: failed,
      skippedGames: skipped,
      updatedAt: new Date()
    }
  });
}

async function runJob(jobId: string) {
  const job = await prisma.gameAnalysisJob.findUnique({
    where: { id: jobId },
    include: { game: true, batchRun: true }
  });

  if (!job || !job.batchRunId) return;
  if (job.batchRun?.status === "cancelled") {
    await prisma.gameAnalysisJob.update({
      where: { id: jobId },
      data: { status: "skipped", finishedAt: new Date() }
    });
    await logEvent(jobId, "JOB_SKIPPED", "Batch cancelled");
    return;
  }

  await prisma.gameAnalysisJob.update({
    where: { id: jobId },
    data: {
      status: "running",
      phase: "parsing",
      startedAt: new Date(),
      lastEventAt: new Date()
    }
  });
  await prisma.batchRun.update({
    where: { id: job.batchRunId },
    data: { status: "running", currentGameId: job.gameId, startedAt: job.batchRun?.startedAt ?? new Date() }
  });

  await logEvent(jobId, "JOB_STARTED", `Analyzing ${job.game.gameId}`);

  const timeout = setTimeout(async () => {
    await prisma.gameAnalysisJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        phase: "engine_search",
        finishedAt: new Date()
      }
    });
    await logEvent(jobId, "JOB_FAILED", "Timeout exceeded");
  }, GAME_TIMEOUT_MS);
  const heartbeat = setInterval(async () => {
    await prisma.gameAnalysisJob.update({
      where: { id: jobId },
      data: { lastEventAt: new Date() }
    });
    if (job.batchRunId) {
      await prisma.batchRun.update({
        where: { id: job.batchRunId },
        data: { updatedAt: new Date() }
      });
    }
  }, 1500);

  try {
    await logEvent(jobId, "PGN_PARSED", "PGN parsed successfully");
    await prisma.gameAnalysisJob.update({
      where: { id: jobId },
      data: { phase: "fen_generation" }
    });

    await logEvent(jobId, "ENGINE_START", "Starting Stockfish analysis");
    const summary = await analyzeGame(job.game.pgn, async (type, message) => {
      await logEvent(jobId, type, message);
      if (type === "FEN_GENERATED") {
        await prisma.gameAnalysisJob.update({ where: { id: jobId }, data: { phase: "engine_search" } });
      }
      if (type === "POSITION_START") {
        const match = message.match(/ply (\\d+)/);
        if (match) {
          await prisma.gameAnalysisJob.update({
            where: { id: jobId },
            data: { currentPlyIndex: Number(match[1]) }
          });
        }
      }
    });
    await logEvent(jobId, "ENGINE_READY", "Stockfish analysis completed");

    await prisma.gameAnalysisResult.upsert({
      where: { gameId: job.gameId },
      update: {
        analysisPolicyVersion: summary.analysisPolicyVersion,
        engineBuildId: summary.engineBuildId,
        mode: summary.mode,
        blunders: summary.blunders,
        mistakes: summary.mistakes,
        inaccuracies: summary.inaccuracies,
        worstEvalDrop: summary.worstEvalDrop,
        analyzedAt: new Date(),
        criticalMoments: {
          deleteMany: {}
        }
      },
      create: {
        gameId: job.gameId,
        analysisPolicyVersion: summary.analysisPolicyVersion,
        engineBuildId: summary.engineBuildId,
        mode: summary.mode,
        blunders: summary.blunders,
        mistakes: summary.mistakes,
        inaccuracies: summary.inaccuracies,
        worstEvalDrop: summary.worstEvalDrop,
        analyzedAt: new Date(),
        criticalMoments: {
          create: summary.criticalMoments.map((moment) => ({
            ply: moment.ply,
            moveNumber: moment.moveNumber,
            san: moment.san,
            fenBefore: moment.fenBefore,
            fenAfter: moment.fenAfter,
            evalBefore: moment.evalBefore,
            evalAfter: moment.evalAfter,
            evalDrop: moment.evalDrop,
            bestMove: moment.bestMove,
            pv: moment.pv,
            phase: moment.phase
          }))
        }
      }
    });

    await prisma.gameAnalysisJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        phase: "persisting",
        finishedAt: new Date()
      }
    });
    await logEvent(jobId, "JOB_DONE", "Analysis persisted");
    await recomputeWeaknessProfile(job.game.profileId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.toLowerCase().includes("pgn")) {
      await logEvent(jobId, "PGN_PARSE_FAILED", message);
    }
    await prisma.gameAnalysisJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        phase: "engine_search",
        finishedAt: new Date()
      }
    });
    await logEvent(jobId, "JOB_FAILED", message);
  } finally {
    clearTimeout(timeout);
    clearInterval(heartbeat);
    await updateBatchCounts(job.batchRunId);
  }
}

async function recoverStaleJobs(batchId: string) {
  const runningJob = await prisma.gameAnalysisJob.findFirst({
    where: { batchRunId: batchId, status: "running" }
  });

  if (runningJob?.lastEventAt) {
    const staleness = Date.now() - new Date(runningJob.lastEventAt).getTime();
    if (staleness > 15000) {
      await prisma.gameAnalysisJob.update({
        where: { id: runningJob.id },
        data: { status: "failed", finishedAt: new Date() }
      });
      await logEvent(runningJob.id, "JOB_FAILED", "Job stalled; marked failed");
    }
  }

  const hasRunning = await prisma.gameAnalysisJob.count({
    where: { batchRunId: batchId, status: "running" }
  });

  if (hasRunning === 0) {
    const queuedJob = await prisma.gameAnalysisJob.findFirst({
      where: { batchRunId: batchId, status: "queued" },
      orderBy: { updatedAt: "asc" }
    });

    if (queuedJob) {
      await runJob(queuedJob.id);
    } else {
      const pendingCount = await prisma.gameAnalysisJob.count({
        where: { batchRunId: batchId, status: "pending" }
      });

      if (pendingCount === 0) {
        const batch = await prisma.batchRun.update({
          where: { id: batchId },
          data: { status: "completed", updatedAt: new Date(), currentGameId: null }
        });
        const sampleGame = await prisma.game.findFirst({ where: { analysisJob: { batchRunId: batchId } } });
        if (sampleGame) {
          await recomputeWeaknessProfile(sampleGame.profileId);
          await generateDailyPlan(sampleGame.profileId, batch.planMinutes ?? 30);
        }
      }
    }
  }
}

async function runnerTick() {
  const batch = await prisma.batchRun.findFirst({
    where: { status: { in: ["queued", "running"] } },
    orderBy: { updatedAt: "desc" }
  });

  if (!batch) return;

  await prisma.batchRun.update({
    where: { id: batch.id },
    data: { updatedAt: new Date() }
  });

  if (batch.status === "queued") {
    const queuedJobs = await prisma.gameAnalysisJob.count({
      where: { batchRunId: batch.id, status: "queued" }
    });
    const hasRunning = await prisma.gameAnalysisJob.count({
      where: { batchRunId: batch.id, status: "running" }
    });
    const lagMs = Date.now() - new Date(batch.updatedAt).getTime();
    if (queuedJobs > 0 && hasRunning === 0 && lagMs > 2000) {
      await prisma.batchRun.update({
        where: { id: batch.id },
        data: { status: "failed", updatedAt: new Date() }
      });
      return;
    }
  }

  await recoverStaleJobs(batch.id);
}

export function startRunner() {
  if (global.analysisRunner) return;

  global.analysisRunner = setInterval(() => {
    runnerTick().catch((error) => {
      console.error("Runner error", error);
    });
  }, RUNNER_INTERVAL_MS);
}
