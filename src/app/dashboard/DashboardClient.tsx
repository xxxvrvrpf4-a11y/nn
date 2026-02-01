"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardProps = {
  username?: string;
  games?: number;
  planMinutes?: number;
  demoMode?: boolean;
};

export function DashboardClient({ username, games, planMinutes, demoMode }: DashboardProps) {
  const [status, setStatus] = useState<string>("idle");
  const [batch, setBatch] = useState<any>(null);
  const [currentJob, setCurrentJob] = useState<any>(null);

  const shouldStart = useMemo(() => Boolean(username || demoMode), [username, demoMode]);

  useEffect(() => {
    if (!shouldStart) return;

    async function run() {
      try {
        setStatus("Fetching profile...");
        const target = demoMode ? "demo_user" : username;
        if (!target) return;

        if (!demoMode) {
          await fetch("/api/fetch-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: target })
          });

          setStatus("Fetching games...");
          const gamesResponse = await fetch("/api/fetch-games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: target, count: games ?? 20 })
          });
          const gamesData = await gamesResponse.json();

          setStatus("Starting analysis...");
          await fetch("/api/start-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameIds: gamesData.games, planMinutes })
          });
        } else {
          const demoResponse = await fetch("/api/demo-games");
          const demoData = await demoResponse.json();
          setStatus("Starting demo batch...");
          await fetch("/api/start-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameIds: demoData.games, planMinutes })
          });
        }
      } catch (error) {
        console.error(error);
        setStatus("Failed to start batch");
      }
    }

    run();
  }, [shouldStart, username, games, planMinutes, demoMode]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch("/api/batch-status");
      const data = await response.json();
      if (data.batch) {
        setBatch(data.batch);
        setCurrentJob(data.currentJob);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold">Batch status</h3>
      <p className="mt-1 text-sm text-slate-300">{status}</p>
      {batch && (
        <div className="mt-3 grid gap-1 text-sm">
          <div>Status: {batch.status}</div>
          <div>
            Done {batch.doneGames} / {batch.totalGames} (failed {batch.failedGames})
          </div>
          <div>Last update: {new Date(batch.updatedAt).toLocaleTimeString()}</div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="btn-outline"
          type="button"
          onClick={() =>
            fetch("/api/batch-control", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "resume" })
            })
          }
        >
          Start/Resume
        </button>
        <button
          className="btn-outline"
          type="button"
          onClick={() =>
            fetch("/api/batch-control", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "pause" })
            })
          }
        >
          Pause
        </button>
        <button
          className="btn-outline"
          type="button"
          onClick={() =>
            fetch("/api/batch-control", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "cancel" })
            })
          }
        >
          Cancel
        </button>
        <button
          className="btn-outline"
          type="button"
          onClick={() =>
            fetch("/api/batch-control", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "reset" })
            })
          }
        >
          Reset stuck jobs
        </button>
      </div>
      {currentJob && (
        <div className="mt-3 text-sm text-slate-300">
          <div>Current game: {currentJob.gameId}</div>
          <div>Phase: {currentJob.phase}</div>
          <div>Last event: {currentJob.lastEventMessage}</div>
          {currentJob.events?.length ? (
            <ul className="mt-2 text-xs text-slate-500">
              {currentJob.events.map((event: any) => (
                <li key={event.id}>
                  {event.type}: {event.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
