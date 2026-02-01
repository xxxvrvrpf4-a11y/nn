import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const profile = await prisma.playerProfile.findUnique({ where: { username: "demo_user" } });
  if (!profile) {
    return NextResponse.json({ games: [] });
  }

  const games = await prisma.game.findMany({ where: { profileId: profile.id } });
  return NextResponse.json({ games: games.map((game) => game.id) });
}
