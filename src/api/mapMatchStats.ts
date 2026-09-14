import { MatchStats } from "@/scoring/calculatePoints";
import { Position } from "@/types";
import { ApiFixturePlayerStats } from "./types";

const API_POSITION_TO_APP: Record<string, Position> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Attacker: "FWD",
};

export function mapApiPositionToApp(apiPosition: string): Position | null {
  return API_POSITION_TO_APP[apiPosition] ?? null;
}

// `goalsConcededByTeam` is the fixture's final goals-against count for this
// player's team. The scoring engine only uses it for GK/DEF, and only if
// the player was on the pitch 60+ minutes (handled inside calculatePoints
// via cleanSheet/minutes, but goalsConceded itself isn't minute-gated here —
// good enough for a full-match dataset; refine later with substitution
// timestamps if you need per-minute accuracy).
export function mapFixtureStatsToMatchStats(
  stats: ApiFixturePlayerStats,
  goalsConcededByTeam: number
): MatchStats {
  const minutesPlayed = stats.games.minutes ?? 0;

  return {
    minutesPlayed,
    goals: stats.goals.total ?? 0,
    assists: stats.goals.assists ?? 0,
    cleanSheet: goalsConcededByTeam === 0,
    goalsConceded: goalsConcededByTeam,
    saves: stats.goals.saves ?? 0,
    penaltiesSaved: stats.penalty.saved ?? 0,
    penaltiesMissed: stats.penalty.missed ?? 0,
    yellowCards: stats.cards.yellow ?? 0,
    redCards: stats.cards.red ?? 0,
    ownGoals: 0, // API-Football doesn't expose own goals on this endpoint
  };
}
