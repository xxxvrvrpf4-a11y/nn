import { getLatestProfile } from "@/src/lib/data";

export default async function HomePage() {
  const profile = await getLatestProfile();

  return (
    <div className="grid gap-6">
      <section className="card">
        <h1 className="text-2xl font-semibold">Chess Coach (MVP → scalable)</h1>
        <p className="mt-2 text-sm text-slate-300">
          Import your Chess.com games, analyze with Stockfish, and generate a targeted daily training
          plan using real puzzles and endgames.
        </p>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Start a new analysis</h2>
        <form action="/dashboard" method="get" className="mt-4 grid gap-3">
          <label className="text-sm">
            Chess.com username
            <input
              name="username"
              defaultValue={profile?.username ?? ""}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
              placeholder="e.g. hikaru"
              required
            />
          </label>
          <label className="text-sm">
            Number of latest games
            <input
              name="games"
              type="number"
              min={5}
              max={50}
              defaultValue={20}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Daily plan duration
            <select
              name="plan"
              defaultValue={"30"}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
            >
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn">
              Fetch + Analyze
            </button>
            <a href="/dashboard?demo=1" className="btn-outline">
              Demo mode
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}
