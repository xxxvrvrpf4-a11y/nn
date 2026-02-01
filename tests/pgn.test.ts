import { describe, expect, it } from "vitest";
import { pgnToFenList } from "@/src/lib/analysis/pgn";

const SIMPLE_PGN = `[Event "Test"]
[Site "Local"]
[Date "2024.01.01"]
[Round "-"]
[White "White"]
[Black "Black"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 1-0`;

describe("pgnToFenList", () => {
  it("generates expected FEN for first move", () => {
    const list = pgnToFenList(SIMPLE_PGN);
    expect(list[0].fenBefore).toContain("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(list[0].fenAfter).toContain("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
  });
});
