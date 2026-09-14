import { LeagueId } from "@/types";

// League IDs as used by API-Football (api-sports.io / RapidAPI).
// These are stable, documented IDs for the top division of each country.
export const LEAGUE_API_IDS: Record<LeagueId, number> = {
  epl: 39, // Premier League (England)
  laliga: 140, // La Liga (Spain)
  seriea: 135, // Serie A (Italy)
  bundesliga: 78, // Bundesliga (Germany)
  ligue1: 61, // Ligue 1 (France)
};

// Update at the start of each season (e.g. 2026 for the 2026/27 season).
export const CURRENT_SEASON = 2025;
