import { Position } from "@/types";

export interface MatchStats {
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheet: boolean; // team conceded 0 while this player was on the pitch
  goalsConceded: number; // team goals conceded while on the pitch (GK/DEF only matters)
  saves: number; // goalkeeper saves
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  bonus?: number; // 0-3, computed separately from match BPS if you implement it
}

export interface PointsBreakdown {
  total: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: number;
  saves: number;
  penalties: number;
  goalsConceded: number;
  cards: number;
  ownGoals: number;
  bonus: number;
}

const GOAL_POINTS: Record<Position, number> = {
  GK: 6,
  DEF: 6,
  MID: 5,
  FWD: 4,
};

const CLEAN_SHEET_POINTS: Record<Position, number> = {
  GK: 4,
  DEF: 4,
  MID: 1,
  FWD: 0,
};

const ASSIST_POINTS = 3;
const YELLOW_CARD_POINTS = -1;
const RED_CARD_POINTS = -3;
const OWN_GOAL_POINTS = -2;
const PENALTY_SAVE_POINTS = 5;
const PENALTY_MISS_POINTS = -2;
const SAVES_PER_POINT = 3; // GK: 1 point per 3 saves
const GOALS_CONCEDED_PER_PENALTY = 2; // GK/DEF: -1 point per 2 goals conceded

export function calculatePoints(stats: MatchStats, position: Position): PointsBreakdown {
  const played60Plus = stats.minutesPlayed >= 60;
  const minutes = stats.minutesPlayed > 0 ? (played60Plus ? 2 : 1) : 0;

  const goals = stats.goals * GOAL_POINTS[position];
  const assists = stats.assists * ASSIST_POINTS;

  const cleanSheet =
    stats.cleanSheet && played60Plus ? CLEAN_SHEET_POINTS[position] : 0;

  const saves =
    position === "GK" ? Math.floor(stats.saves / SAVES_PER_POINT) : 0;

  const penalties =
    stats.penaltiesSaved * PENALTY_SAVE_POINTS +
    stats.penaltiesMissed * PENALTY_MISS_POINTS;

  const goalsConceded =
    position === "GK" || position === "DEF"
      ? -Math.floor(stats.goalsConceded / GOALS_CONCEDED_PER_PENALTY)
      : 0;

  const cards = stats.yellowCards * YELLOW_CARD_POINTS + stats.redCards * RED_CARD_POINTS;
  const ownGoals = stats.ownGoals * OWN_GOAL_POINTS;
  const bonus = stats.bonus ?? 0;

  const total =
    minutes + goals + assists + cleanSheet + saves + penalties + goalsConceded + cards + ownGoals + bonus;

  return {
    total,
    minutes,
    goals,
    assists,
    cleanSheet,
    saves,
    penalties,
    goalsConceded,
    cards,
    ownGoals,
    bonus,
  };
}

/*
Usage example:

const points = calculatePoints(
  {
    minutesPlayed: 90,
    goals: 2,
    assists: 1,
    cleanSheet: false,
    goalsConceded: 1,
    saves: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    yellowCards: 1,
    redCards: 0,
    ownGoals: 0,
  },
  "FWD"
);
// points.total === 2 (mins) + 8 (2 goals) + 3 (assist) - 1 (yellow) = 12
*/
