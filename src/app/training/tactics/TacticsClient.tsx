"use client";

import { useState } from "react";

type Puzzle = {
  id: string;
  fen: string;
  moves: string;
  themes: string;
  rating: number;
};

type Props = {
  puzzles: Puzzle[];
};

export function TacticsClient({ puzzles }: Props) {
  const [status, setStatus] = useState<Record<string, string>>({});

  async function record(puzzleId: string, success: boolean) {
    const response = await fetch("/api/training/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId, success })
    });
    const data = await response.json();
    setStatus((prev) => ({ ...prev, [puzzleId]: `Box ${data.box}` }));
  }

  return (
    <div className="mt-4 grid gap-3 text-sm">
      {puzzles.map((puzzle) => (
        <div key={puzzle.id} className="rounded-md border border-slate-800 p-3">
          <div className="flex items-center justify-between">
            <span>{puzzle.id}</span>
            <span className="badge">{puzzle.rating}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">FEN: {puzzle.fen}</div>
          <div className="mt-1 text-xs text-slate-500">Moves: {puzzle.moves}</div>
          <div className="mt-1 text-xs text-slate-500">Themes: {puzzle.themes}</div>
          <div className="mt-3 flex gap-2">
            <button className="btn-outline" onClick={() => record(puzzle.id, true)}>
              Solved
            </button>
            <button className="btn-outline" onClick={() => record(puzzle.id, false)}>
              Missed
            </button>
            {status[puzzle.id] && <span className="text-xs text-slate-400">{status[puzzle.id]}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
