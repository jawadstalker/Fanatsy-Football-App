const FPL_BASE_URL = "https://fantasy.premierleague.com/api";

export interface FplGameweekEvent {
  id: number;
  deadline_time: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
}

let cache: { expiresAt: number; events: FplGameweekEvent[] } | null = null;

export async function getOfficialFplGameweeks(): Promise<FplGameweekEvent[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.events;

  const response = await fetch(`${FPL_BASE_URL}/bootstrap-static/`);
  if (!response.ok) {
    throw new Error(`Official FPL gameweek lookup failed with status ${response.status}`);
  }

  const body = await response.json() as { events?: FplGameweekEvent[] };
  if (!Array.isArray(body.events)) {
    throw new Error("Official FPL response did not contain gameweek events");
  }

  const events = body.events.filter((event) =>
    Number.isInteger(event.id) &&
    event.id > 0 &&
    typeof event.deadline_time === "string" &&
    Number.isFinite(new Date(event.deadline_time).getTime()) &&
    typeof event.finished === "boolean" &&
    typeof event.is_current === "boolean" &&
    typeof event.is_next === "boolean"
  );

  if (!events.length) throw new Error("Official FPL returned no valid gameweek events");

  cache = { expiresAt: Date.now() + 60_000, events };
  return events;
}

export async function getOfficialFplDeadline(gameweek: number): Promise<string> {
  const events = await getOfficialFplGameweeks();
  const event = events.find((item) => item.id === gameweek);
  if (!event) throw new Error(`Official FPL deadline not found for gameweek ${gameweek}`);
  return new Date(event.deadline_time).toISOString();
}

export interface FplLivePlayerStats {
  id: number;
  name: string;
  webName: string;
  teamName: string;
  bps: number | null;
  bonus: number | null;
  totalPoints: number | null;
  minutes: number | null;
}

let livePlayersCache: { expiresAt: number; gameweek: number; players: FplLivePlayerStats[] } | null = null;

export async function getOfficialFplLivePlayers(): Promise<{ gameweek: number; players: FplLivePlayerStats[] }> {
  if (livePlayersCache && livePlayersCache.expiresAt > Date.now()) {
    return { gameweek: livePlayersCache.gameweek, players: livePlayersCache.players };
  }

  const events = await getOfficialFplGameweeks();
  const event = events.find((item) => item.is_current) ?? events.find((item) => item.is_next);
  if (!event) throw new Error("Official FPL current gameweek is unavailable");

  const [bootstrapResponse, liveResponse] = await Promise.all([
    fetch(`${FPL_BASE_URL}/bootstrap-static/`),
    fetch(`${FPL_BASE_URL}/event/${event.id}/live/`),
  ]);
  if (!bootstrapResponse.ok) throw new Error(`Official FPL player lookup failed with status ${bootstrapResponse.status}`);
  if (!liveResponse.ok) throw new Error(`Official FPL live stats failed with status ${liveResponse.status}`);

  const bootstrap = await bootstrapResponse.json() as {
    elements?: Array<{ id: number; first_name?: string; second_name?: string; web_name?: string; team: number }>;
    teams?: Array<{ id: number; name: string }>;
  };
  const live = await liveResponse.json() as {
    elements?: Array<{ id: number; stats?: { bps?: number; bonus?: number; total_points?: number; minutes?: number } }>;
  };
  if (!Array.isArray(bootstrap.elements) || !Array.isArray(bootstrap.teams) || !Array.isArray(live.elements)) {
    throw new Error("Official FPL live response has an unexpected shape");
  }

  const teams = new Map(bootstrap.teams.map((team) => [team.id, team.name]));
  const liveById = new Map(live.elements.map((item) => [item.id, item.stats ?? {}]));
  const players = bootstrap.elements.flatMap((player): FplLivePlayerStats[] => {
    const teamName = teams.get(player.team);
    if (!teamName) return [];
    const stats = liveById.get(player.id) ?? {};
    return [{
      id: player.id,
      name: `${player.first_name ?? ""} ${player.second_name ?? ""}`.trim(),
      webName: player.web_name ?? "",
      teamName,
      bps: typeof stats.bps === "number" ? stats.bps : null,
      bonus: typeof stats.bonus === "number" ? stats.bonus : null,
      totalPoints: typeof stats.total_points === "number" ? stats.total_points : null,
      minutes: typeof stats.minutes === "number" ? stats.minutes : null,
    }];
  });

  livePlayersCache = { expiresAt: Date.now() + 2 * 60 * 1000, gameweek: event.id, players };
  return { gameweek: event.id, players };
}
