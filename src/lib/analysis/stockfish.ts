import { spawn } from "node:child_process";

export type StockfishResult = {
  bestMove: string;
  evalCp: number;
  pv: string;
};

const DEFAULT_TIMEOUT_MS = 15000;

export async function analyzePosition(fen: string, movetimeMs: number): Promise<StockfishResult> {
  const stockfishPath = process.env.STOCKFISH_PATH ?? "stockfish";

  return new Promise((resolve, reject) => {
    const engine = spawn(stockfishPath, [], { stdio: "pipe" });
    let resolved = false;
    let latestScore = 0;
    let latestPv = "";

    const timeout = setTimeout(() => {
      if (!resolved) {
        engine.kill();
        reject(new Error("Stockfish timeout"));
      }
    }, DEFAULT_TIMEOUT_MS);

    function send(cmd: string) {
      engine.stdin.write(`${cmd}\n`);
    }

    engine.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("info")) {
          const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
          if (scoreMatch) {
            const type = scoreMatch[1];
            const value = Number(scoreMatch[2]);
            latestScore = type === "mate" ? Math.sign(value) * 10000 : value;
          }
          const pvMatch = line.match(/ pv (.+)$/);
          if (pvMatch) {
            latestPv = pvMatch[1];
          }
        }
        if (line.startsWith("bestmove")) {
          const [, move] = line.split(" ");
          resolved = true;
          clearTimeout(timeout);
          engine.kill();
          resolve({ bestMove: move, evalCp: latestScore, pv: latestPv });
        }
      }
    });

    engine.stderr.on("data", (data) => {
      if (!resolved) {
        clearTimeout(timeout);
        engine.kill();
        reject(new Error(`Stockfish error: ${data.toString()}`));
      }
    });

    send("uci");
    send("isready");
    send("ucinewgame");
    send(`position fen ${fen}`);
    send(`go movetime ${movetimeMs}`);
  });
}
