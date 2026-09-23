import { Router } from "express";

export const footballRouter = Router();

const API_HOST = "api-football-v1.p.rapidapi.com";
const API_BASE_URL = `https://${API_HOST}/v3`;

// Only proxy the endpoints the app actually needs — an open passthrough
// would let anyone use your RapidAPI quota for arbitrary requests.
const ALLOWED_PATHS = new Set(["/players", "/fixtures", "/fixtures/players"]);

const LEAGUE_ID = 39;
const CURRENT_SEASON = 2026;

function toDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function roundNumber(round?: string | null): number | null {
  if (!round) return null;
  const match = round.match(/(\\d+)\\s*$/);
  return match ? Number(match[1]) : null;
}

footballRouter.get("/gameweek", async (_req, res) => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY is not set on the server" });

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 21);
  const to = new Date(now);
  to.setUTCDate(to.getUTCDate() + 21);

  const query = new URLSearchParams({
    league: String(LEAGUE_ID),
    season: String(CURRENT_SEASON),
    from: toDate(from),
    to: toDate(to),
  }).toString();

  try {
    const upstream = await fetch(`${API_BASE_URL}/fixtures?${query}`, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": API_HOST },
    });
    const body = await upstream.json() as {
      response?: Array<{
        fixture: { date: string; status: { short: string }; round?: string | null };
      }>;
    };

    if (!upstream.ok) return res.status(upstream.status).json(body);

    const fixtures = body.response ?? [];
    const grouped = new Map<number, string[]>();

    for (const item of fixtures) {
      const round = roundNumber(item.fixture.round);
      if (round === null) continue;
      const dates = grouped.get(round) ?? [];
      dates.push(item.fixture.date);
      grouped.set(round, dates);
    }

    const currentMs = now.getTime();
    const activeRounds = Array.from(grouped.entries())
      .map(([round, dates]) => ({
        round,
        dates: dates.map((date) => new Date(date).getTime()).filter(Number.isFinite),
      }))
      .filter((entry) => entry.dates.some((date) => date <= currentMs) && entry.dates.some((date) => date >= currentMs));

    let currentGameweek: number;
    let deadlineMs: number;

    if (activeRounds.length > 0) {
      const active = activeRounds.sort((a, b) => a.round - b.round)[0];
      currentGameweek = active.round;
      deadlineMs = Math.min(...active.dates);
    } else {
      const latestStarted = Array.from(grouped.entries())
        .map(([round, dates]) => ({ round, latest: Math.max(...dates.map((d) => new Date(d).getTime())) }))
        .filter((entry) => entry.latest <= currentMs)
        .sort((a, b) => b.round - a.round)[0];

      const nextRound = Array.from(grouped.entries())
        .map(([round, dates]) => ({ round, first: Math.min(...dates.map((d) => new Date(d).getTime())) }))
        .filter((entry) => entry.first > currentMs)
        .sort((a, b) => a.round - b.round)[0];

      const selected = nextRound ?? latestStarted;
      if (!selected) return res.status(502).json({ error: "Could not determine current gameweek" });

      currentGameweek = selected.round;
      deadlineMs = nextRound ? selected.first : selected.latest;
    }

    res.json({
      currentGameweek,
      deadline: new Date(deadlineMs).toISOString(),
    });
  } catch (err) {
    res.status(502).json({ error: "Gameweek lookup failed", detail: (err as Error).message });
  }
});

footballRouter.get("/*", async (req, res) => {
  const apiPath = req.path; // e.g. "/players"
  if (!ALLOWED_PATHS.has(apiPath)) {
    return res.status(404).json({ error: "Unsupported endpoint" });
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return res.status(500).json({ error: "RAPIDAPI_KEY is not set on the server" });
  }

  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const url = `${API_BASE_URL}${apiPath}${query ? `?${query}` : ""}`;

  try {
    const upstream = await fetch(url, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": API_HOST },
    });
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ error: "Upstream request failed", detail: (err as Error).message });
  }
});
