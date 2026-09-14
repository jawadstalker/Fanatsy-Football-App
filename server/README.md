# Server

A minimal Express + TypeScript backend for two things the mobile app
can't safely or fully do on its own:

1. Proxying API-Football requests, so the RapidAPI key lives here
   instead of inside the compiled app bundle (`EXPO_PUBLIC_*` variables
   are visible to anyone who inspects the app).
2. Private mini-leagues among friends — creating a league, joining one,
   submitting a team's gameweek points, and reading standings.

This is a starting point, not a production backend. In particular,
`src/store.ts` persists to a single JSON file on disk. That's enough to
develop against locally, but you'll want a real database (Postgres,
SQLite, etc.) plus authentication before letting real users depend on
it.

## Setup

```bash
cd server
npm install
cp .env.example .env   # add your RapidAPI key
npm run dev
```

## Endpoints

### Football data (proxied to API-Football)

```
GET /api/football/players?league=39&season=2025&page=1
GET /api/football/fixtures?id=12345
GET /api/football/fixtures/players?fixture=12345
```

Only these three paths are allowed through; see `ALLOWED_PATHS` in
`src/footballProxy.ts`. Query parameters are passed through unchanged
to API-Football.

### Private leagues

```
POST /api/leagues                          { name }              -> { code, name, createdAt }
GET  /api/leagues/:code                                          -> { code, name, createdAt }
POST /api/leagues/:code/join               { managerName }       -> { id, leagueCode, managerName, gwPoints, totalPoints }
POST /api/leagues/:code/teams/:teamId/points  { gwPoints }       -> updated team
GET  /api/leagues/:code/standings                                -> team[], sorted by totalPoints desc
```

## Connecting the mobile app

Football-data proxying: point the app's `API_BASE_URL` (in
`src/api/config.ts`) at `http://<your-server>/api/football` and drop
the `x-rapidapi-*` headers from `src/api/client.ts` — the server
attaches those itself. This isn't done by default; the app talks to
RapidAPI directly during development.

Private leagues: set `EXPO_PUBLIC_BACKEND_URL` in the app's `.env` to
this server's URL (e.g. `http://localhost:4000`). The League tab
switches from sample data to the real create/join/standings flow as
soon as that's set — see `src/store/useLeagueStore.ts` and
`src/api/backendClient.ts` in the app.
