export type LeagueId = "epl" | "laliga" | "seriea" | "bundesliga" | "ligue1";

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface League {
  id: LeagueId;
  label: string;
  color: string;
}

export interface Player {
  id: number;
  name: string;
  club: string;
  clubId?: number; // API-Football team id, needed to look up that club's fixtures
  pos: Position;
  league: LeagueId;
  price: number;
  pts: number;
  captain?: boolean;
}

export interface PitchPlayer extends Player {
  x: number; // percentage from left, 0-100
  y: number; // percentage from top, 0-100
}

export interface MarketPlayer {
  id: number;
  name: string;
  club: string;
  clubId?: number;
  pos: Position;
  league: LeagueId;
  price: number;
  form: number;
}

export interface RankingRow {
  rank: number;
  prev: number;
  name: string;
  pts: number;
  gw: number;
}

export interface SquadPlayer extends Player {
  isStarting: boolean;
  x?: number; // pitch position, only meaningful when isStarting
  y?: number;
}

export interface TransferResult {
  ok: boolean;
  reason?: "exists" | "budget" | "no-replacement" | "full";
  replaced?: string; // name of the player who was dropped, if any
}

export interface GwBreakdown {
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: number;
  cards: number;
  bonus: number;
}

export interface PlayerSeasonStats {
  seasonPoints: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  last5: number[]; // points for the last 5 gameweeks, oldest first
  gwBreakdown: GwBreakdown; // current gameweek's point split
}
