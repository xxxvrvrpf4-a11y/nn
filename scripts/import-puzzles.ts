import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: tsx scripts/import-puzzles.ts <lichess_puzzles.csv>");
  process.exit(1);
}

async function main() {
  const stream = createReadStream(filePath);
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    if (line.startsWith("PuzzleId,")) continue;
    const [id, fen, moves, rating, _, __, themes] = line.split(",");
    if (!id || !fen) continue;

    await prisma.puzzle.upsert({
      where: { id },
      update: { fen, moves, rating: Number(rating), themes },
      create: { id, fen, moves, rating: Number(rating), themes }
    });
    count += 1;
    if (count % 500 === 0) {
      console.log(`Imported ${count} puzzles`);
    }
  }

  console.log(`Imported ${count} puzzles total`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
