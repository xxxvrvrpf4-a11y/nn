import { getGameById } from "@/src/lib/data";
import { FenBoard } from "@/src/app/games/[id]/FenBoard";
import { Chess } from "chess.js";

export default async function GameDetailPage({ params }: { params: { id: string } }) {
  const game = await getGameById(params.id);
  if (!game) {
    return <div className="card">Game not found.</div>;
  }

  const chess = new Chess();
  chess.loadPgn(game.pgn);
  const boardFen = game.analysis?.criticalMoments[0]?.fenBefore ?? new Chess().fen();
  const moves = chess.history();

  return (
    <div className="grid gap-6">
      <section className="card">
        <h2 className="text-lg font-semibold">{game.white} vs {game.black}</h2>
        <p className="mt-2 text-sm text-slate-400">Result: {game.result}</p>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Board</h3>
        <div className="mt-3">
          <FenBoard fen={boardFen} />
        </div>
        <div className="mt-3 grid gap-1 text-xs text-slate-400">
          {moves.length ? (
            moves.map((move, index) => (
              <span key={`${move}-${index}`}>{index + 1}. {move}</span>
            ))
          ) : (
            <span>No moves parsed yet.</span>
          )}
        </div>
        <pre className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
          {game.pgn}
        </pre>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Critical moments</h3>
        {game.analysis?.criticalMoments.length ? (
          <div className="mt-3 grid gap-3 text-sm">
            {game.analysis.criticalMoments.map((moment) => (
              <div key={moment.id} className="rounded-md border border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <div>Move {moment.moveNumber}: {moment.san}</div>
                  <span className="badge">{moment.phase}</span>
                </div>
                <div className="mt-2 text-slate-400">
                  Eval drop: {moment.evalDrop} | Best: {moment.bestMove}
                </div>
                <div className="mt-1 text-xs text-slate-500">PV: {moment.pv}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Analysis pending.</p>
        )}
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Job event log</h3>
        {game.analysisJob?.events?.length ? (
          <ul className="mt-3 grid gap-1 text-sm text-slate-400">
            {game.analysisJob.events.map((event) => (
              <li key={event.id}>
                {new Date(event.createdAt).toLocaleTimeString()} — {event.type}: {event.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No job events yet.</p>
        )}
      </section>
    </div>
  );
}
