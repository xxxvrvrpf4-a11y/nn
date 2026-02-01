CREATE TABLE "PlayerProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "avatarUrl" TEXT,
  "country" TEXT,
  "joinedAt" DATETIME,
  "lastOnline" DATETIME,
  "title" TEXT,
  "status" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "RatingStat" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "category" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "best" INTEGER,
  "last" INTEGER,
  "profileId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("profileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Game" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameId" TEXT NOT NULL UNIQUE,
  "pgn" TEXT NOT NULL,
  "endTime" DATETIME NOT NULL,
  "timeControl" TEXT NOT NULL,
  "rated" BOOLEAN NOT NULL,
  "rules" TEXT NOT NULL,
  "white" TEXT NOT NULL,
  "black" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("profileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "BatchRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "status" TEXT NOT NULL DEFAULT 'idle',
  "totalGames" INTEGER NOT NULL DEFAULT 0,
  "doneGames" INTEGER NOT NULL DEFAULT 0,
  "failedGames" INTEGER NOT NULL DEFAULT 0,
  "skippedGames" INTEGER NOT NULL DEFAULT 0,
  "currentGameId" TEXT,
  "planMinutes" INTEGER NOT NULL DEFAULT 30,
  "startedAt" DATETIME,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "GameAnalysisJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "phase" TEXT NOT NULL DEFAULT 'parsing',
  "gameId" TEXT NOT NULL UNIQUE,
  "batchRunId" TEXT,
  "startedAt" DATETIME,
  "updatedAt" DATETIME NOT NULL,
  "finishedAt" DATETIME,
  "currentPlyIndex" INTEGER,
  "lastEventMessage" TEXT,
  "lastEventAt" DATETIME,
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("batchRunId") REFERENCES "BatchRun"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "GameAnalysisResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameId" TEXT NOT NULL UNIQUE,
  "analysisPolicyVersion" TEXT NOT NULL,
  "engineBuildId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "blunders" INTEGER NOT NULL,
  "mistakes" INTEGER NOT NULL,
  "inaccuracies" INTEGER NOT NULL,
  "worstEvalDrop" INTEGER NOT NULL,
  "analyzedAt" DATETIME NOT NULL,
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CriticalMoment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameAnalysisId" TEXT NOT NULL,
  "ply" INTEGER NOT NULL,
  "moveNumber" INTEGER NOT NULL,
  "san" TEXT NOT NULL,
  "fenBefore" TEXT NOT NULL,
  "fenAfter" TEXT,
  "evalBefore" INTEGER NOT NULL,
  "evalAfter" INTEGER NOT NULL,
  "evalDrop" INTEGER NOT NULL,
  "bestMove" TEXT NOT NULL,
  "pv" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  FOREIGN KEY ("gameAnalysisId") REFERENCES "GameAnalysisResult"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WeaknessProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "tactics" INTEGER NOT NULL,
  "opening" INTEGER NOT NULL,
  "endgame" INTEGER NOT NULL,
  "strategy" INTEGER NOT NULL,
  "evalHistogram" TEXT NOT NULL,
  "patterns" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("profileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DailyPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "minutes" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("profileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DailyPlanItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "planId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "minutes" INTEGER NOT NULL,
  "payload" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY ("planId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Puzzle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fen" TEXT NOT NULL,
  "moves" TEXT NOT NULL,
  "themes" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PuzzleAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "puzzleId" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "LeitnerBox" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "puzzleId" TEXT NOT NULL UNIQUE,
  "box" INTEGER NOT NULL DEFAULT 1,
  "lastReviewed" DATETIME,
  "nextReview" DATETIME,
  FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EndgameDrill" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "fen" TEXT NOT NULL,
  "solution" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EndgameAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "drillId" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("drillId") REFERENCES "EndgameDrill"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "JobEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("jobId") REFERENCES "GameAnalysisJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ApiCache" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "url" TEXT NOT NULL UNIQUE,
  "etag" TEXT,
  "lastModified" TEXT,
  "body" TEXT NOT NULL,
  "status" INTEGER NOT NULL,
  "updatedAt" DATETIME NOT NULL
);
