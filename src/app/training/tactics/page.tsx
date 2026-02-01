import { getTacticsSession } from "@/src/lib/data";
import { TacticsClient } from "@/src/app/training/tactics/TacticsClient";

export default async function TacticsPage() {
  const puzzles = await getTacticsSession();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Tactics session</h2>
      <p className="mt-2 text-sm text-slate-400">Real puzzles from Lichess Open Database subset.</p>
      <TacticsClient puzzles={puzzles} />
    </div>
  );
}
