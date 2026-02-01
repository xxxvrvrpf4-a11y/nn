type FenBoardProps = {
  fen: string;
};

const pieceMap: Record<string, string> = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  P: "♙",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔"
};

export function FenBoard({ fen }: FenBoardProps) {
  const board = fen.split(" ")[0];
  const rows = board.split("/").map((row) => {
    const cells: string[] = [];
    for (const char of row) {
      if (Number.isInteger(Number(char))) {
        const count = Number(char);
        for (let i = 0; i < count; i += 1) {
          cells.push("");
        }
      } else {
        cells.push(pieceMap[char] ?? "");
      }
    }
    return cells;
  });

  return (
    <div className="grid grid-cols-8 border border-slate-700">
      {rows.flat().map((cell, idx) => {
        const row = Math.floor(idx / 8);
        const col = idx % 8;
        const isDark = (row + col) % 2 === 1;
        return (
        <div
          key={idx}
          className={`flex h-9 w-9 items-center justify-center text-lg ${
            isDark ? "bg-slate-700" : "bg-slate-800"
          }`}
        >
          {cell}
        </div>
        );
      })}
    </div>
  );
}
