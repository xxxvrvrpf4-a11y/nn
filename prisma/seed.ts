import { PrismaClient } from "@prisma/client";
import puzzles from "./seed-data/puzzles.json";
import endgames from "./seed-data/endgames.json";
import demoGames from "./seed-data/demo-games.json";

const prisma = new PrismaClient();

async function main() {
  for (const puzzle of puzzles) {
    await prisma.puzzle.upsert({
      where: { id: puzzle.id },
      update: {
        fen: puzzle.fen,
        moves: puzzle.moves,
        themes: puzzle.themes,
        rating: puzzle.rating
      },
      create: {
        id: puzzle.id,
        fen: puzzle.fen,
        moves: puzzle.moves,
        themes: puzzle.themes,
        rating: puzzle.rating
      }
    });
  }

  await prisma.endgameDrill.deleteMany();
  for (const drill of endgames) {
    await prisma.endgameDrill.create({
      data: drill
    });
  }

  const profile = await prisma.playerProfile.upsert({
    where: { username: "demo_user" },
    update: {
      avatarUrl: "https://images.chesscomfiles.com/uploads/v1/user/1.12345.abcdef.jpeg",
      country: "https://api.chess.com/pub/country/US",
      joinedAt: new Date("2021-01-01T00:00:00Z"),
      lastOnline: new Date(),
      status: "premium"
    },
    create: {
      username: "demo_user",
      avatarUrl: "https://images.chesscomfiles.com/uploads/v1/user/1.12345.abcdef.jpeg",
      country: "https://api.chess.com/pub/country/US",
      joinedAt: new Date("2021-01-01T00:00:00Z"),
      lastOnline: new Date(),
      status: "premium"
    }
  });

  const ratings = [
    { category: "rapid", rating: 1520 },
    { category: "blitz", rating: 1480 },
    { category: "bullet", rating: 1400 },
    { category: "daily", rating: 1600 }
  ];

  for (const rating of ratings) {
    await prisma.ratingStat.upsert({
      where: { id: `${profile.id}-${rating.category}` },
      update: rating,
      create: {
        id: `${profile.id}-${rating.category}`,
        profileId: profile.id,
        ...rating
      }
    });
  }

  for (const game of demoGames) {
    await prisma.game.upsert({
      where: { gameId: game.gameId },
      update: {
        pgn: game.pgn,
        endTime: new Date(game.endTime),
        timeControl: game.timeControl,
        rated: game.rated,
        rules: game.rules,
        white: game.white,
        black: game.black,
        result: game.result
      },
      create: {
        gameId: game.gameId,
        pgn: game.pgn,
        endTime: new Date(game.endTime),
        timeControl: game.timeControl,
        rated: game.rated,
        rules: game.rules,
        white: game.white,
        black: game.black,
        result: game.result,
        profileId: profile.id
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
