import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const puzzles = await prisma.puzzle.findMany({
    take: 10,
    orderBy: { rating: "asc" }
  });

  return NextResponse.json({ puzzles });
}
