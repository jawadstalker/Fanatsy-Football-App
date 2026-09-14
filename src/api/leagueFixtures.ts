import { apiFootballGet } from "./client";
import { ApiFixtureResponse, ApiFixtureEntry } from "./types";
import { LEAGUE_API_IDS, CURRENT_SEASON } from "./leagues";
import { Fixture, FixtureStatus, LeagueId } from "@/types";

const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);
const LIVE_CODES = new Set(["1H", "2H", "HT", "ET", "P", "BT"]);

function mapStatus(shortCode: string): FixtureStatus {
  if (FINISHED_CODES.has(shortCode)) return "finished";
  if (LIVE_CODES.has(shortCode)) return "live";
  return "scheduled";
}

function mapFixture(entry: ApiFixtureEntry, league: LeagueId): Fixture {
  return {
    id: entry.fixture.id,
    league,
    homeTeam: entry.teams.home.name,
    awayTeam: entry.teams.away.name,
    homeGoals: entry.goals.home,
    awayGoals: entry.goals.away,
    date: entry.fixture.date,
    status: mapStatus(entry.fixture.status.short),
  };
}

// `mode: "last"` returns the most recent finished fixtures, `"next"`
// returns upcoming ones. API-Football scopes each request to one league.
export async function fetchLeagueFixtures(
  league: LeagueId,
  mode: "last" | "next" = "last",
  count: number = 10
): Promise<Fixture[]> {
  const data = await apiFootballGet<ApiFixtureResponse>("/fixtures", {
    league: LEAGUE_API_IDS[league],
    season: CURRENT_SEASON,
    [mode]: count,
  });
  return data.response.map((entry) => mapFixture(entry, league));
}
