import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { analyzePosition } from "@/src/lib/analysis/stockfish";

function hasStockfish(path: string) {
  const result = spawnSync("which", [path]);
  return result.status === 0;
}

describe("stockfish", () => {
  it("returns a best move for a known FEN", async () => {
    const path = process.env.STOCKFISH_PATH ?? "stockfish";
    if (!hasStockfish(path)) {
      return;
    }

    const result = await analyzePosition("rn1qkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 3", 200);
    expect(result.bestMove.length).toBeGreaterThan(0);
  }, 20000);
});
