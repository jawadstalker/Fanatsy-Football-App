const API_HOST = "api-football-v1.p.rapidapi.com";
const API_BASE_URL = `https://${API_HOST}/v3`;
const PREMIER_LEAGUE_ID = 39;
const CURRENT_SEASON = 2026;

export interface GameweekState {
  currentGameweek: number;
  deadline: string;
  kickoff: string;
  lastKickoff: string;
  finalizationAt: string;
  locked: boolean;
}

/**
 * API-Football provides fixture kick-off times, not the official FPL deadline.
 * By default we conservatively lock 90 minutes before the earliest kick-off.
 * Override GAMEWEEK_DEADLINE_OFFSET_MINUTES if your game's rules differ.
 */
export async function getAuthoritativeGameweekState(now = new Date()): Promise<GameweekState> {
  return getGameweekState(undefined, now);
}

export async function getGameweekState(gameweek?: number, now = new Date()): Promise<GameweekState> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY is not set on the server");

  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 35);
  const to = new Date(now);
  to.setUTCDate(to.getUTCDate() + 35);
  const query = new URLSearchParams({
    league: String(PREMIER_LEAGUE_ID),
    season: String(CURRENT_SEASON),
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  });

  const upstream = await fetch(`${API_BASE_URL}/fixtures?${query}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": API_HOST },
  });
  const body = await upstream.json() as {
    response?: Array<{ fixture?: { date?: string; round?: string | null } }>;
  };
  if (!upstream.ok) throw new Error(`Gameweek lookup failed with status ${upstream.status}`);

  const grouped = new Map<number, number[]>();
  for (const item of body.response ?? []) {
    const roundText = item.fixture?.round;
    const dateText = item.fixture?.date;
    if (!roundText || !dateText) continue;
    const match = roundText.match(/(\d+)\s*$/);
    const kickoffMs = new Date(dateText).getTime();
    if (!match || !Number.isFinite(kickoffMs)) continue;
    const round = Number(match[1]);
    const dates = grouped.get(round) ?? [];
    dates.push(kickoffMs);
    grouped.set(round, dates);
  }

  const rounds = [...grouped.entries()]
    .map(([round, dates]) => ({
      round,
      first: Math.min(...dates),
      last: Math.max(...dates),
    }))
    .filter((entry) => Number.isFinite(entry.first) && Number.isFinite(entry.last))
    .sort((a, b) => a.round - b.round);

  if (!rounds.length) throw new Error("No valid fixtures found; refusing to guess the current gameweek");

  const nowMs = now.getTime();
  const active = rounds.find((entry) => entry.first <= nowMs && entry.last >= nowMs);
  const upcoming = rounds
    .filter((entry) => entry.first > nowMs)
    .sort((a, b) => a.first - b.first)[0];
  const latestPast = [...rounds]
    .filter((entry) => entry.last < nowMs)
    .sort((a, b) => b.last - a.last)[0];

  const finalizationAtFor = (entry: { last: number }) => {
    const londonParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(entry.last));
    const year = Number(londonParts.find((part) => part.type === "year")?.value);
    const month = Number(londonParts.find((part) => part.type === "month")?.value);
    const day = Number(londonParts.find((part) => part.type === "day")?.value);
    return Date.UTC(year, month - 1, day + 1, 9, 0, 0);
  };

  // Between the final whistle and 09:00 UK the next morning, keep the
  // just-finished gameweek authoritative so its points can be finalized.
  const latestPastStillFinalizing = latestPast && nowMs < finalizationAtFor(latestPast)
    ? latestPast
    : undefined;

  const selected = gameweek != null
    ? rounds.find((entry) => entry.round === gameweek)
    : active ?? latestPastStillFinalizing ?? upcoming ?? latestPast;
  if (!selected) throw new Error("Could not determine requested gameweek; refusing to guess");

  const rawOffset = Number(process.env.GAMEWEEK_DEADLINE_OFFSET_MINUTES ?? 90);
  const offsetMinutes = Number.isFinite(rawOffset) && rawOffset >= 0 && rawOffset <= 1440
    ? rawOffset
    : 90;
  const deadlineMs = selected.first - offsetMinutes * 60_000;
  // FPL final points are confirmed at 09:00 UK time on the day after the
  // gameweek's final match. Intl handles GMT/BST correctly for the date.
  const finalizationAt = new Date(finalizationAtFor(selected)).toISOString();

  return {
    currentGameweek: selected.round,
    kickoff: new Date(selected.first).toISOString(),
    lastKickoff: new Date(selected.last).toISOString(),
    finalizationAt,
    deadline: new Date(deadlineMs).toISOString(),
    locked: nowMs >= deadlineMs,
  };
}
