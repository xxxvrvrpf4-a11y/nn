import { getDashboardData } from "@/src/lib/data";
import { DashboardClient } from "@/src/app/dashboard/DashboardClient";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { username?: string; games?: string; plan?: string; demo?: string };
}) {
  const username = searchParams.username;
  const games = Number(searchParams.games ?? "20");
  const planMinutes = Number(searchParams.plan ?? "30");
  const demoMode = searchParams.demo === "1";

  const data = await getDashboardData(username);

  return (
    <div className="grid gap-6">
      <DashboardClient username={username} games={games} planMinutes={planMinutes} demoMode={demoMode} />

      <section className="card">
        <h2 className="text-lg font-semibold">Profile</h2>
        {data.profile ? (
          <div className="mt-3 flex items-center gap-4">
            {data.profile.avatarUrl && (
              <img src={data.profile.avatarUrl} alt="avatar" className="h-16 w-16 rounded-full" />
            )}
            <div>
              <div className="text-xl font-semibold">{data.profile.username}</div>
              <div className="text-sm text-slate-400">{data.profile.country ?? "Unknown country"}</div>
              <div className="mt-2 flex gap-2">
                {data.profile.ratingStats.map((stat) => (
                  <span key={stat.id} className="badge">
                    {stat.category}: {stat.rating}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No profile loaded yet.</p>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Weakness summary</h2>
        {data.weakness ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>Tactics: {data.weakness.tactics}</div>
            <div>Opening: {data.weakness.opening}</div>
            <div>Endgame: {data.weakness.endgame}</div>
            <div>Strategy: {data.weakness.strategy}</div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No analysis yet.</p>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Today&apos;s plan</h2>
        {data.plan ? (
          <ul className="mt-3 grid gap-2 text-sm">
            {data.plan.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span>{item.title}</span>
                <span className="text-slate-400">{item.minutes} min</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Plan will be generated after analysis.</p>
        )}
      </section>
    </div>
  );
}
