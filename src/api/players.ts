import { apiFootballGet } from "./client";
import { ApiPlayersResponse, ApiPlayerEntry } from "./types";
import { LEAGUE_API_IDS, CURRENT_SEASON } from "./leagues";
import { LeagueId } from "@/types";

// API-Football paginates players 20-at-a-time. `page` lets callers walk
// through the full league squad list.
export async function fetchPlayersByLeague(
  league: LeagueId,
  page: number = 1
): Promise<{ players: ApiPlayerEntry[]; totalPages: number }> {
  const data = await apiFootballGet<ApiPlayersResponse>("/players", {
    league: LEAGUE_API_IDS[league],
    season: CURRENT_SEASON,
    page,
  });

  return {
    players: data.response,
    totalPages: data.paging?.total ?? 1,
  };
}
