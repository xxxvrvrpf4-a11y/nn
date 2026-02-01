import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { analyzeGame } from "@/src/lib/analysis/analyze-game";

const stockfishPath = process.env.STOCKFISH_PATH ?? "stockfish";
const hasStockfish = spawnSync("which", [stockfishPath]).status === 0;

if (!hasStockfish) {
  console.warn("Stockfish not found; skipping consistency check.");
  process.exit(0);
}

const demo = JSON.parse(readFileSync("./prisma/seed-data/demo-games.json", "utf-8"));
const pgn = demo[0].pgn as string;

async function run() {
  const first = await analyzeGame(pgn);
  const second = await analyzeGame(pgn);

  const firstPlies = first.criticalMoments.map((m) => m.ply);
  const secondPlies = second.criticalMoments.map((m) => m.ply);

  const mismatch = firstPlies.some((ply, idx) => ply !== secondPlies[idx]);
  if (mismatch) {
    console.error("Consistency check failed", firstPlies, secondPlies);
    process.exit(1);
  }

  console.log("Consistency check passed");
}

run();
