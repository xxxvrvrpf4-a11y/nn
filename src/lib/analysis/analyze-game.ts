import { Chess } from "chess.js";
import {
  ANALYSIS_POLICY_VERSION,
  COARSE_MOVETIME_MS,
  CRITICAL_SWING_CP,
  DEEP_MOVETIME_MS,
  ENGINE_BUILD_ID,
  MAX_CRITICAL_MOMENTS
} from "@/src/lib/analysis/config";
import { analyzePosition } from "@/src/lib/analysis/stockfish";
import { pgnToFenList } from "@/src/lib/analysis/pgn";

export type CriticalMomentInput = {
  ply: number;
  moveNumber: number;
  san: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number;
  evalAfter: number;
  evalDrop: number;
  bestMove: string;
  pv: string;
  phase: string;
};

export type GameAnalysisSummary = {
  analysisPolicyVersion: string;
  engineBuildId: string;
  mode: string;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  worstEvalDrop: number;
  criticalMoments: CriticalMomentInput[];
};

function determinePhase(moveNumber: number): string {
  if (moveNumber <= 12) return "opening";
  if (moveNumber <= 35) return "middlegame";
  return "endgame";
}

function isSpecialMove(flags: string, san: string) {
  return flags.includes("c") || flags.includes("p") || flags.includes("k") || flags.includes("q") || san.includes("+");
}

export async function analyzeGame(
  pgn: string,
  onEvent?: (type: string, message: string) => Promise<void> | void
): Promise<GameAnalysisSummary> {
  const positions = pgnToFenList(pgn);
  if (onEvent) {
    await onEvent("FEN_GENERATED", `Generated ${positions.length} positions`);
  }
  const coarseIndices: number[] = [];

  positions.forEach((pos, idx) => {
    if (idx % 2 === 0 || isSpecialMove(pos.flags, pos.san)) {
      coarseIndices.push(idx);
    }
  });

  const coarseEval: Record<number, number> = {};
  for (const idx of coarseIndices) {
    const result = await analyzePosition(positions[idx].fenBefore, COARSE_MOVETIME_MS);
    coarseEval[idx] = result.evalCp;
  }

  const candidates = new Set<number>();
  for (let i = 1; i < positions.length; i += 1) {
    const prevIdx = i - 1;
    const prevEval = coarseEval[prevIdx] ?? coarseEval[prevIdx - 1] ?? 0;
    const nextEval = coarseEval[i] ?? prevEval;
    const swing = Math.abs(nextEval - prevEval);
    if (swing >= CRITICAL_SWING_CP) {
      candidates.add(i);
    }
  }

  const topSwing = [...candidates].slice(0, MAX_CRITICAL_MOMENTS);
  if (positions.length > 0) {
    topSwing.push(positions.length - 1);
  }

  const uniqueCandidates = Array.from(new Set(topSwing));
  const criticalMoments: CriticalMomentInput[] = [];

  for (const idx of uniqueCandidates) {
    const pos = positions[idx];
    if (onEvent) {
      await onEvent("POSITION_START", `Analyzing ply ${pos.ply}`);
    }
    const before = await analyzePosition(pos.fenBefore, DEEP_MOVETIME_MS);
    const after = await analyzePosition(pos.fenAfter, DEEP_MOVETIME_MS);
    if (onEvent) {
      await onEvent("BESTMOVE_RECEIVED", `Best move ${before.bestMove} at ply ${pos.ply}`);
    }

    const chess = new Chess(pos.fenBefore);
    const turn = chess.turn();
    const evalDrop = turn === "w" ? before.evalCp - after.evalCp : after.evalCp - before.evalCp;

    criticalMoments.push({
      ply: pos.ply,
      moveNumber: pos.moveNumber,
      san: pos.san,
      fenBefore: pos.fenBefore,
      fenAfter: pos.fenAfter,
      evalBefore: before.evalCp,
      evalAfter: after.evalCp,
      evalDrop,
      bestMove: before.bestMove,
      pv: before.pv,
      phase: determinePhase(pos.moveNumber)
    });
    if (onEvent) {
      await onEvent("POSITION_DONE", `Finished ply ${pos.ply}`);
    }
  }

  const sorted = criticalMoments.sort((a, b) => Math.abs(b.evalDrop) - Math.abs(a.evalDrop));
  const blunders = sorted.filter((m) => m.evalDrop >= 300).length;
  const mistakes = sorted.filter((m) => m.evalDrop >= 150 && m.evalDrop < 300).length;
  const inaccuracies = sorted.filter((m) => m.evalDrop >= 60 && m.evalDrop < 150).length;

  return {
    analysisPolicyVersion: ANALYSIS_POLICY_VERSION,
    engineBuildId: ENGINE_BUILD_ID,
    mode: "deep",
    blunders,
    mistakes,
    inaccuracies,
    worstEvalDrop: sorted[0]?.evalDrop ?? 0,
    criticalMoments: sorted.slice(0, MAX_CRITICAL_MOMENTS)
  };
}
