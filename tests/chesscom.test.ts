import { describe, expect, it, beforeEach, vi } from "vitest";
import nock from "nock";

const cacheStore = new Map<string, any>();

vi.mock("@/src/lib/prisma", () => {
  return {
    prisma: {
      apiCache: {
        findUnique: async ({ where }: any) => cacheStore.get(where.url) ?? null,
        upsert: async ({ where, create, update }: any) => {
          const existing = cacheStore.get(where.url);
          const value = existing ? { ...existing, ...update } : create;
          cacheStore.set(where.url, value);
          return value;
        }
      }
    }
  };
});

beforeEach(() => {
  cacheStore.clear();
  nock.cleanAll();
});

describe("chess.com archives", () => {
  it("fetches archives list and caches it", async () => {
    nock("https://api.chess.com")
      .get("/pub/player/demo/games/archives")
      .reply(200, { archives: ["https://api.chess.com/pub/player/demo/games/2024/01"] }, { etag: "abc" });

    const { fetchArchives } = await import("@/src/lib/chesscom/client");
    const response = await fetchArchives("demo");

    expect(response.data.archives).toHaveLength(1);
    expect(cacheStore.size).toBe(1);
  });
});
