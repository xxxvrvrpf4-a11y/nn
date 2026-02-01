import { getEndgameDrills } from "@/src/lib/data";

export default async function EndgamePage() {
  const drills = await getEndgameDrills();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Endgame drills</h2>
      <div className="mt-4 grid gap-3 text-sm">
        {drills.map((drill) => (
          <div key={drill.id} className="rounded-md border border-slate-800 p-3">
            <div className="font-semibold">{drill.title}</div>
            <div className="mt-2 text-xs text-slate-500">FEN: {drill.fen}</div>
            <div className="mt-1 text-xs text-slate-500">Solution: {drill.solution}</div>
            <div className="mt-1 text-xs text-slate-500">Source: {drill.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
