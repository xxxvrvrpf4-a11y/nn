import { prisma } from "@/src/lib/prisma";

const BASE_URL = "https://api.chess.com/pub";

type FetchResult<T> = {
  data: T;
  cached: boolean;
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithCache<T>(path: string): Promise<FetchResult<T>> {
  const url = `${BASE_URL}${path}`;
  const cache = await prisma.apiCache.findUnique({ where: { url } });

  const headers: Record<string, string> = {
    "User-Agent": process.env.CHESSCOM_USER_AGENT ?? "ChessCoach/0.1 (+https://example.local)"
  };

  if (cache?.etag) {
    headers["If-None-Match"] = cache.etag;
  }
  if (cache?.lastModified) {
    headers["If-Modified-Since"] = cache.lastModified;
  }

  let attempts = 0;
  while (attempts < 3) {
    const response = await fetch(url, { headers });
    if (response.status === 429) {
      attempts += 1;
      await sleep(500 * attempts);
      continue;
    }

    if (response.status === 304 && cache) {
      return { data: JSON.parse(cache.body) as T, cached: true };
    }

    const bodyText = await response.text();
    await prisma.apiCache.upsert({
      where: { url },
      update: {
        etag: response.headers.get("etag"),
        lastModified: response.headers.get("last-modified"),
        body: bodyText,
        status: response.status
      },
      create: {
        url,
        etag: response.headers.get("etag"),
        lastModified: response.headers.get("last-modified"),
        body: bodyText,
        status: response.status
      }
    });

    return { data: JSON.parse(bodyText) as T, cached: false };
  }

  throw new Error("Chess.com rate limit exceeded. Please try again later.");
}

export async function fetchProfile(username: string) {
  return fetchWithCache(`/player/${username}`);
}

export async function fetchStats(username: string) {
  return fetchWithCache(`/player/${username}/stats`);
}

export async function fetchArchives(username: string) {
  return fetchWithCache<{ archives: string[] }>(`/player/${username}/games/archives`);
}

export async function fetchArchiveGames(archiveUrl: string) {
  const trimmed = archiveUrl.replace(BASE_URL, "");
  return fetchWithCache<{ games: any[] }>(trimmed);
}
