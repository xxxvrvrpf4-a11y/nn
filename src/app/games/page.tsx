import { getGames } from "@/src/lib/data";

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Games</h2>
      <div className="mt-4 grid gap-3 text-sm">
        {games.map((game) => (
          <a key={game.id} href={`/games/${game.id}`} className="rounded-md border border-slate-800 p-3 hover:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                {game.white} vs {game.black}
              </div>
              <span className="badge">{game.analysis?.mode ?? game.analysisJob?.status ?? "pending"}</span>
            </div>
            <div className="mt-2 text-slate-400">
              Worst drop: {game.analysis?.worstEvalDrop ?? "-"} | Blunders: {game.analysis?.blunders ?? 0}
            </div>
            {game.analysisJob?.events?.length ? (
              <ul className="mt-2 text-xs text-slate-500">
                {game.analysisJob.events.map((event) => (
                  <li key={event.id}>
                    {event.type}: {event.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </a>
        ))}
      </div>
    </div>
  );
}
