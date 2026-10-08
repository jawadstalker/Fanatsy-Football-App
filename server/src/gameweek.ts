import { getOfficialFplGameweeks } from "./fpl";

const API_HOST = "api-football-v1.p.rapidapi.com";
const API_BASE_URL = `https://${API_HOST}/v3`;
const PREMIER_LEAGUE_ID = 39;
const CURRENT_SEASON = 2026;

export type GameweekPhase = "upcoming" | "active" | "finalizing" | "finished";

export interface GameweekState {
  currentGameweek: number;
  phase: GameweekPhase;
  deadline: string;
  kickoff: string;
  lastKickoff: string;
  finalizationAt: string;
  locked: boolean;
}

export function deriveGameweekPhase(
  nowMs: number,
  deadlineMs: number,
  kickoffMs: number,
  finalizationMs: number,
  finishedByFpl = false,
): GameweekPhase {
  if (nowMs < deadlineMs) return "upcoming";
  if (nowMs < kickoffMs) return "active";
  if (nowMs < finalizationMs || !finishedByFpl) return "finalizing";
  return "finished";
}

function finalizationAtFor(lastKickoffMs: number): number {
  const londonParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(lastKickoffMs));
  const year = Number(londonParts.find((part) => part.type === "year")?.value);
  const month = Number(londonParts.find((part) => part.type === "month")?.value);
  const day = Number(londonParts.find((part) => part.type === "day")?.value);
  return Date.UTC(year, month - 1, day + 1, 9, 0, 0);
}

/**
 * FPL is authoritative for gameweek identity/deadline.
 * API-Football is used only to obtain EPL fixture kickoff boundaries.
 */
export async function getAuthoritativeGameweekState(now = new Date()): Promise<GameweekState> {
  return getGameweekState(undefined, now);
}

export async function getGameweekState(gameweek?: number, now = new Date()): Promise<GameweekState> {
  const events = await getOfficialFplGameweeks();
  const nowMs = now.getTime();

  const selectedEvent = gameweek != null
    ? events.find((event) => event.id === gameweek)
    : events.find((event) => event.is_current) ??
      events.find((event) => event.is_next) ??
      [...events].filter((event) => new Date(event.deadline_time).getTime() <= nowMs).sort((a, b) => b.id - a.id)[0];

  if (!selectedEvent) throw new Error("Could not determine authoritative FPL gameweek; refusing to guess");

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
  if (!upstream.ok) throw new Error(`Gameweek fixture lookup failed with status ${upstream.status}`);

  const dates: number[] = [];
  for (const item of body.response ?? []) {
    const roundText = item.fixture?.round;
    const dateText = item.fixture?.date;
    const match = roundText?.match(/(\d+)\s*$/);
    const kickoffMs = dateText ? new Date(dateText).getTime() : NaN;
    if (match && Number(match[1]) === selectedEvent.id && Number.isFinite(kickoffMs)) dates.push(kickoffMs);
  }

  if (!dates.length) {
    throw new Error(`No valid EPL fixtures found for authoritative FPL gameweek ${selectedEvent.id}`);
  }

  const kickoffMs = Math.min(...dates);
  const lastKickoffMs = Math.max(...dates);
  const deadlineMs = new Date(selectedEvent.deadline_time).getTime();
  const finalizationMs = finalizationAtFor(lastKickoffMs);
  const phase = deriveGameweekPhase(nowMs, deadlineMs, kickoffMs, finalizationMs, selectedEvent.finished);

  return {
    currentGameweek: selectedEvent.id,
    phase,
    deadline: new Date(deadlineMs).toISOString(),
    kickoff: new Date(kickoffMs).toISOString(),
    lastKickoff: new Date(lastKickoffMs).toISOString(),
    finalizationAt: new Date(finalizationMs).toISOString(),
    locked: phase !== "upcoming",
  };
}
