export type RatingCategory = "rapid" | "blitz" | "bullet" | "daily";

export function extractRatings(stats: Record<string, any>) {
  const mapping: Record<RatingCategory, string> = {
    rapid: "chess_rapid",
    blitz: "chess_blitz",
    bullet: "chess_bullet",
    daily: "chess_daily"
  };

  return Object.entries(mapping).map(([category, key]) => {
    const entry = stats[key];
    return {
      category,
      rating: entry?.last?.rating ?? 0,
      best: entry?.best?.rating ?? null,
      last: entry?.last?.rating ?? null
    };
  });
}

export function normalizeGame(game: any) {
  return {
    gameId: game.url,
    endTime: new Date(game.end_time * 1000),
    timeControl: game.time_control ?? "",
    rated: Boolean(game.rated),
    rules: game.rules ?? "chess",
    white: game.white?.username ?? "",
    black: game.black?.username ?? "",
    result: game.white?.result === "win" ? "white" : game.black?.result === "win" ? "black" : game.white?.result ?? "draw",
    pgn: game.pgn ?? ""
  };
}
