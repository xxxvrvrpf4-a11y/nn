import { Chess } from "chess.js";

export type FenPosition = {
  ply: number;
  moveNumber: number;
  san: string;
  fenBefore: string;
  fenAfter: string;
  flags: string;
};

export function pgnToFenList(pgn: string) {
  const chess = new Chess();
  const loaded = chess.loadPgn(pgn);
  if (!loaded) {
    throw new Error("PGN parse failed");
  }

  const moves = chess.history({ verbose: true });
  const list: FenPosition[] = [];
  chess.reset();

  moves.forEach((move, index) => {
    const fenBefore = chess.fen();
    const san = move.san;
    const moveNumber = Math.ceil((index + 1) / 2);
    const flags = move.flags;

    chess.move(move);
    const fenAfter = chess.fen();

    list.push({
      ply: index + 1,
      moveNumber,
      san,
      fenBefore,
      fenAfter,
      flags
    });
  });

  return list;
}
