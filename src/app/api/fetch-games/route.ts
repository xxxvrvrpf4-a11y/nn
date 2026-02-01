import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { fetchArchives, fetchArchiveGames } from "@/src/lib/chesscom/client";
import { normalizeGame } from "@/src/lib/chesscom/normalize";

export async function POST(request: Request) {
  const { username, count } = await request.json();
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }
  const targetCount = Number(count ?? 20);

  const profile = await prisma.playerProfile.findUnique({ where: { username } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const archiveResponse = await fetchArchives(username);
  const archives = archiveResponse.data.archives.slice().reverse();

  const games: any[] = [];
  for (const archiveUrl of archives) {
    if (games.length >= targetCount) break;
    const archive = await fetchArchiveGames(archiveUrl);
    for (const game of archive.data.games) {
      if (games.length >= targetCount) break;
      if (game.pgn) games.push(game);
    }
  }

  const createdIds: string[] = [];
  for (const game of games) {
    const normalized = normalizeGame(game);
    const record = await prisma.game.upsert({
      where: { gameId: normalized.gameId },
      update: {
        pgn: normalized.pgn,
        endTime: normalized.endTime,
        timeControl: normalized.timeControl,
        rated: normalized.rated,
        rules: normalized.rules,
        white: normalized.white,
        black: normalized.black,
        result: normalized.result,
        profileId: profile.id
      },
      create: {
        ...normalized,
        profileId: profile.id
      }
    });
    createdIds.push(record.id);
  }

  return NextResponse.json({ games: createdIds, total: createdIds.length });
}
