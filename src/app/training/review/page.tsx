import { getGames } from "@/src/lib/data";

export default async function ReviewPage() {
  const games = await getGames();
  const moments = games.flatMap((game) => game.analysis?.criticalMoments ?? []);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Review critical moments</h2>
      <p className="mt-2 text-sm text-slate-400">Focus on your biggest evaluation drops.</p>
      <div className="mt-4 grid gap-3 text-sm">
        {moments.length ? (
          moments.slice(0, 6).map((moment) => (
            <div key={moment.id} className="rounded-md border border-slate-800 p-3">
              <div>Move {moment.moveNumber}: {moment.san}</div>
              <div className="text-xs text-slate-500">Eval drop: {moment.evalDrop}</div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No analyzed moments yet.</p>
        )}
      </div>
    </div>
  );
}
