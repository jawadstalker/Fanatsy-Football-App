import { Router } from "express";

export const footballRouter = Router();

const API_HOST = "api-football-v1.p.rapidapi.com";
const API_BASE_URL = `https://${API_HOST}/v3`;

// Only proxy the endpoints the app actually needs — an open passthrough
// would let anyone use your RapidAPI quota for arbitrary requests.
const ALLOWED_PATHS = new Set(["/players", "/fixtures", "/fixtures/players"]);

import { getAuthoritativeGameweekState } from "./gameweek";

const CURRENT_SEASON = 2026;

footballRouter.get("/gameweek", async (_req, res) => {
  try {
    return res.json(await getAuthoritativeGameweekState());
  } catch (err) {
    return res.status(503).json({ error: "Authoritative gameweek unavailable; changes are disabled", detail: (err as Error).message });
  }
});

type AuthoritativePlayer = {
  id: number;
  name: string;
  clubId: number;
  club: string;
  pos: "GK" | "DEF" | "MID" | "FWD";
  league: "epl" | "laliga" | "seriea" | "bundesliga" | "ligue1";
  price: number;
};

const LEAGUE_BY_API_ID: Record<number, AuthoritativePlayer["league"]> = {
  39: "epl",
  140: "laliga",
  135: "seriea",
  78: "bundesliga",
  61: "ligue1",
};

const API_POSITION_TO_APP: Record<string, AuthoritativePlayer["pos"]> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Attacker: "FWD",
};

const BASE_PRICE: Record<AuthoritativePlayer["pos"], number> = {
  GK: 4.5,
  DEF: 4.5,
  MID: 5.5,
  FWD: 6.0,
};

const playerCache = new Map<number, { expiresAt: number; player: AuthoritativePlayer }>();

function estimateFantasyPrice(rating: number, minutes: number, pos: AuthoritativePlayer["pos"]): number {
  const ratingBoost = Math.max(0, rating - 6.0) * 1.8;
  const minutesBoost = Math.min(minutes / 1000, 3) * 0.6;
  return Math.round((BASE_PRICE[pos] + ratingBoost + minutesBoost) * 2) / 2;
}

export async function getAuthoritativePlayer(playerId: number): Promise<AuthoritativePlayer | null> {
  const cached = playerCache.get(playerId);
  if (cached && cached.expiresAt > Date.now()) return cached.player;

  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY is not set on the server");

  const query = new URLSearchParams({
    id: String(playerId),
    season: String(CURRENT_SEASON),
  }).toString();

  const upstream = await fetch(`${API_BASE_URL}/players?${query}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": API_HOST },
  });
  const body = await upstream.json() as {
    response?: Array<{
      player?: { id?: number; name?: string };
      statistics?: Array<{
        team?: { id?: number; name?: string };
        league?: { id?: number };
        games?: { position?: string; rating?: string | null; minutes?: number | null };
      }>;
    }>;
  };

  if (!upstream.ok) throw new Error(`Player lookup failed with status ${upstream.status}`);

  const entry = body.response?.[0];
  const stats = entry?.statistics?.[0];
  if (!entry?.player?.id || !entry.player.name || !stats?.team?.id || !stats.team.name || !stats.league?.id || !stats.games?.position) {
    return null;
  }

  const league = LEAGUE_BY_API_ID[stats.league.id];
  const pos = API_POSITION_TO_APP[stats.games.position];
  if (!league || !pos) return null;

  const rating = Number.parseFloat(stats.games.rating ?? "6.0") || 6.0;
  const minutes = stats.games.minutes ?? 0;
  const player: AuthoritativePlayer = {
    id: entry.player.id,
    name: entry.player.name,
    clubId: stats.team.id,
    club: stats.team.name,
    pos,
    league,
    price: estimateFantasyPrice(rating, minutes, pos),
  };

  playerCache.set(playerId, { expiresAt: Date.now() + 60 * 60 * 1000, player });
  return player;
}

footballRouter.get("/players/:id", async (req, res) => {
  const playerId = Number(req.params.id);
  if (!Number.isInteger(playerId) || playerId <= 0) {
    return res.status(400).json({ error: "Player id must be a positive integer" });
  }

  try {
    const player = await getAuthoritativePlayer(playerId);
    if (!player) return res.status(404).json({ error: "Player not found in the current fantasy leagues" });
    return res.json(player);
  } catch (err) {
    return res.status(502).json({ error: "Player lookup failed", detail: (err as Error).message });
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
