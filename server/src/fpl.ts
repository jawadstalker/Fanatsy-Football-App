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
