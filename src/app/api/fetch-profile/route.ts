import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { fetchProfile, fetchStats } from "@/src/lib/chesscom/client";
import { extractRatings } from "@/src/lib/chesscom/normalize";

export async function POST(request: Request) {
  const { username } = await request.json();
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const profileResponse = await fetchProfile(username);
  const statsResponse = await fetchStats(username);

  const profile = await prisma.playerProfile.upsert({
    where: { username },
    update: {
      avatarUrl: profileResponse.data.avatar ?? null,
      country: profileResponse.data.country ?? null,
      joinedAt: profileResponse.data.joined ? new Date(profileResponse.data.joined * 1000) : null,
      lastOnline: profileResponse.data.last_online ? new Date(profileResponse.data.last_online * 1000) : null,
      title: profileResponse.data.title ?? null,
      status: profileResponse.data.status ?? null
    },
    create: {
      username,
      avatarUrl: profileResponse.data.avatar ?? null,
      country: profileResponse.data.country ?? null,
      joinedAt: profileResponse.data.joined ? new Date(profileResponse.data.joined * 1000) : null,
      lastOnline: profileResponse.data.last_online ? new Date(profileResponse.data.last_online * 1000) : null,
      title: profileResponse.data.title ?? null,
      status: profileResponse.data.status ?? null
    }
  });

  const ratings = extractRatings(statsResponse.data);
  for (const rating of ratings) {
    await prisma.ratingStat.upsert({
      where: { id: `${profile.id}-${rating.category}` },
      update: {
        category: rating.category,
        rating: rating.rating,
        best: rating.best ?? null,
        last: rating.last ?? null
      },
      create: {
        id: `${profile.id}-${rating.category}`,
        profileId: profile.id,
        category: rating.category,
        rating: rating.rating,
        best: rating.best ?? null,
        last: rating.last ?? null
      }
    });
  }

  return NextResponse.json({ profileId: profile.id });
}
