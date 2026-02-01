import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

const REVIEW_DAYS = [1, 2, 4, 7, 14];

export async function POST(request: Request) {
  const { puzzleId, success } = await request.json();
  if (!puzzleId) {
    return NextResponse.json({ error: "puzzleId required" }, { status: 400 });
  }

  await prisma.puzzleAttempt.create({
    data: {
      puzzleId,
      success: Boolean(success)
    }
  });

  const existing = await prisma.leitnerBox.findUnique({ where: { puzzleId } });
  const nextBox = success ? Math.min((existing?.box ?? 1) + 1, 5) : 1;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + REVIEW_DAYS[nextBox - 1]);

  await prisma.leitnerBox.upsert({
    where: { puzzleId },
    update: {
      box: nextBox,
      lastReviewed: new Date(),
      nextReview
    },
    create: {
      puzzleId,
      box: nextBox,
      lastReviewed: new Date(),
      nextReview
    }
  });

  return NextResponse.json({ status: "ok", box: nextBox, nextReview });
}
