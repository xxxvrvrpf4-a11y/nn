# Chess Coach (MVP → scalable)

Chess Coach imports Chess.com public data, analyzes recent games with Stockfish, and builds a daily training plan using real puzzles and endgame positions.

## Features (MVP)
- Chess.com PubAPI profile + rating import (rapid/blitz/bullet/daily).
- Latest N games fetch (default 20) via archives flow with ETag/Last-Modified caching.
- Automatic batch analysis pipeline with persisted job state, heartbeat, and event logs.
- Deterministic Stockfish analysis policy (deep mode by default).
- Weakness profile + auto-generated daily plan (30 or 60 minutes).
- Training modules using real Lichess Open Database puzzles (seeded subset), Leitner-box spacing, and curated endgame drills.
- Demo mode with seeded data.

## Prerequisites
- Node.js 20+
- SQLite (bundled with Node Prisma)
- Stockfish engine:
  - macOS: `brew install stockfish`
  - Ubuntu: `sudo apt-get install stockfish`
  - Or use Docker:
    ```bash
    docker run --rm -it --name stockfish -p 8080:8080 ghcr.io/official-stockfish/stockfish
    ```

## Environment Variables
Copy `.env.example` to `.env` and adjust:

```bash
DATABASE_URL="file:./dev.db"
CHESSCOM_USER_AGENT="ChessCoach/0.1 (+https://example.local)"
STOCKFISH_PATH="stockfish"
```

## Install + Run
```bash
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Demo Mode
Click **Demo mode** on the home page or visit:
```
http://localhost:3000/dashboard?demo=1
```
This uses seeded data (demo user + PGN + puzzles).

## Analysis Pipeline
- Fetch profile + stats.
- Fetch latest N games (archives flow, serial fetch, rate-limit backoff).
- Create analysis jobs and a batch run.
- Server runner processes queued jobs and writes progress events.

Batch status is visible on `/dashboard`, and job event logs are visible in `/games` and `/games/[id]`.

## Training Content
- **Tactics**: seeded Lichess puzzle subset (`prisma/seed-data/puzzles.json`).
- **Endgame drills**: curated real positions with provenance in `prisma/seed-data/endgames.json`.

### Importing a larger puzzle subset
Add a CSV file from the Lichess Open Database and run a custom import:
```bash
npm run import:puzzles -- path/to/lichess_db_puzzle.csv
```
(See `scripts/` for a template if you extend the importer.)

## Tests
```bash
npm test
```

Additional consistency check:
```bash
npm run check:consistency
```

## Limitations
- Chess.com PubAPI data can be cached up to ~12 hours.
- API requests are read-only and rate-limited; 429 is handled with backoff.
- Stockfish must be installed locally for analysis.

## How to verify
1. Run `npm run prisma:migrate` and `npm run prisma:seed`.
2. Start the app with `npm run dev`.
3. On `/`, enter a Chess.com username and click **Fetch + Analyze**.
4. On `/dashboard`, confirm batch progress updates and last event messages.
5. On `/games`, confirm analysis status and job events show.
6. On `/training/tactics` and `/training/endgame`, confirm real puzzles/drills render.

## Repo structure
```
src/app/                 Next.js App Router pages + API routes
src/lib/                 Data layer, analysis runner, Stockfish integration
prisma/                  Schema, migrations, seed data
scripts/                 Consistency check + tooling
tests/                   Unit tests
```
