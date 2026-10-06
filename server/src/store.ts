import { calculateTransferAccounting } from "./transferRules";
import fs from "fs";
import path from "path";

export interface User { id: string; username: string; passwordHash: string; createdAt: string; }

export interface League {
  code: string;
  name: string;
  createdAt: string;
}

export interface RosterPlayerSnapshot {
  id: number;
  clubId?: number;
  club: string;
  pos: "GK" | "DEF" | "MID" | "FWD";
  price: number;
  league: string;
}

export interface Team {
  squadPlayers?: RosterPlayerSnapshot[];
  squadPlayerIds?: number[];
  captainId?: number | null;
  viceCaptainId?: number | null;
  activeChips?: string[];
  startingPlayerIds?: number[];
  chipUsage?: Record<string, number>;
  transfersThisWeek?: number;
  freeTransfers?: number;
  pointsHit?: number;
  freeHitSnapshot?: {
    squadPlayerIds: number[];
    squadPlayers: RosterPlayerSnapshot[];
    startingPlayerIds: number[];
    captainId: number | null;
    viceCaptainId: number | null;
  } | null;
  id: string;
  leagueCode: string;
  managerName: string;
  gwPoints: number;
  totalPoints: number;
  submittedGameweeks: number[];
  userId?: string;
}

interface DbShape {
  leagues: Record<string, League>;
  teams: Record<string, Team>;
  users: Record<string, User>;
}

const DATA_FILE = path.resolve(process.env.DATA_FILE ?? "./data.json");

function readDb(): DbShape {
  if (!fs.existsSync(DATA_FILE)) return { leagues: {}, teams: {}, users: {} };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as DbShape;
  } catch {
    return { leagues: {}, teams: {}, users: {} };
  }
}

function writeDb(db: DbShape): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tempFile, DATA_FILE);
}

function normalizeTeam(team: Team): Team {
  return {
    ...team,
    submittedGameweeks: Array.isArray(team.submittedGameweeks) ? team.submittedGameweeks : [],
  };
}

export function createLeague(code: string, name: string): League {
  const db = readDb();
  const league: League = { code, name: name.trim(), createdAt: new Date().toISOString() };
  db.leagues[code] = league;
  writeDb(db);
  return league;
}

export function getLeague(code: string): League | null {
  return readDb().leagues[code] ?? null;
}

export function joinLeague(id: string, leagueCode: string, managerName: string, userId: string): Team {
  const db = readDb();
  const existing = Object.values(db.teams).find(
    (team) => team.leagueCode === leagueCode && team.userId === userId
  );
  if (existing) return normalizeTeam(existing);
  const team: Team = {
    id,
    leagueCode,
    managerName: managerName.trim(),
    userId,
    gwPoints: 0,
    totalPoints: 0,
    submittedGameweeks: [],
  };
  db.teams[id] = team;
  writeDb(db);
  return team;
}

export function updateTeamSquad(
  teamId: string,
  squadPlayerIds: number[],
  captainId: number | null,
  viceCaptainId: number | null,
  activeChips: string[],
  startingPlayerIds: number[],
  squadPlayers: RosterPlayerSnapshot[]
): Team | null {
  const db = readDb();
  const stored = db.teams[teamId];
  if (!stored) return null;

  const team = normalizeTeam(stored);
  const previousIds = [...(team.squadPlayerIds ?? [])];
  const previousPlayers = (team.squadPlayers ?? []).map((player) => ({ ...player }));
  const previousStartingIds = [...(team.startingPlayerIds ?? [])];
  const previousCaptainId = team.captainId ?? null;
  const previousViceCaptainId = team.viceCaptainId ?? null;
  const previousActiveChips = [...(team.activeChips ?? [])];
  const incomingCount = previousIds.length === 15
    ? squadPlayerIds.filter((id) => !previousIds.includes(id)).length
    : 0;
  const chip = activeChips[0] ?? null;
  team.chipUsage = team.chipUsage ?? {};
  if (chip === "freeHit" && previousActiveChips[0] !== "freeHit") {
    team.freeHitSnapshot = {
      squadPlayerIds: previousIds,
      squadPlayers: previousPlayers,
      startingPlayerIds: previousStartingIds,
      captainId: previousCaptainId,
      viceCaptainId: previousViceCaptainId,
    };
  }
  if (previousActiveChips[0] && previousActiveChips[0] !== chip) {
    team.chipUsage[previousActiveChips[0]] = team.chipUsage[previousActiveChips[0]] ?? 1;
  }
  if (chip && previousActiveChips[0] !== chip) team.chipUsage[chip] = (team.chipUsage[chip] ?? 0) + 1;
  if (incomingCount > 0) {
    const accounting = calculateTransferAccounting(
      incomingCount,
      team.freeTransfers ?? 1,
      team.pointsHit ?? 0,
      team.transfersThisWeek ?? 0,
      chip === "wildcard" || chip === "freeHit"
    );
    team.transfersThisWeek = accounting.transfersThisWeek;
    team.freeTransfers = accounting.freeTransfers;
    team.pointsHit = accounting.pointsHit;
  }
  team.squadPlayerIds = [...squadPlayerIds];
  team.squadPlayers = squadPlayers.map((player) => ({ ...player }));
  team.captainId = captainId;
  team.viceCaptainId = viceCaptainId;
  team.activeChips = [...activeChips];
  team.startingPlayerIds = [...startingPlayerIds];
  db.teams[teamId] = team;
  writeDb(db);
  return team;
}

export function setTeamPoints(teamId: string, gameweek: number, gwPoints: number): { team: Team | null; duplicate: boolean } {
  const db = readDb();
  const stored = db.teams[teamId];
  if (!stored) return { team: null, duplicate: false };

  const team = normalizeTeam(stored);
  if (team.submittedGameweeks.includes(gameweek)) return { team, duplicate: true };

  team.gwPoints = gwPoints;
  team.totalPoints += gwPoints;
  team.submittedGameweeks.push(gameweek);
  team.submittedGameweeks.sort((a, b) => a - b);

  // A gameweek submission finalizes weekly transfer/chip state.
  if (team.activeChips?.[0] === "freeHit" && team.freeHitSnapshot) {
    team.squadPlayerIds = [...team.freeHitSnapshot.squadPlayerIds];
    team.squadPlayers = team.freeHitSnapshot.squadPlayers.map((player) => ({ ...player }));
    team.startingPlayerIds = [...team.freeHitSnapshot.startingPlayerIds];
    team.captainId = team.freeHitSnapshot.captainId;
    team.viceCaptainId = team.freeHitSnapshot.viceCaptainId;
    team.freeHitSnapshot = null;
  }
  team.activeChips = [];
  team.transfersThisWeek = 0;
  team.pointsHit = 0;
  team.freeTransfers = Math.min(5, (team.freeTransfers ?? 1) + 1);

  db.teams[teamId] = team;
  writeDb(db);
  return { team, duplicate: false };
}

export function getStandings(leagueCode: string): Team[] {
  const db = readDb();
  return Object.values(db.teams)
    .filter((team) => team.leagueCode === leagueCode)
    .map(normalizeTeam)
    .sort((a, b) => b.totalPoints - a.totalPoints);
}
