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
  team.squadPlayerIds = [...squadPlayerIds];
  team.squadPlayers = squadPlayers.map((player) => ({ ...player }));
  team.captainId = captainId;
  team.viceCaptainId = viceCaptainId;
  team.activeChips = [...activeChips];
  team.startingPlayerIds = [...startingPlayerIds];
  const previousIds = team.squadPlayerIds ?? [];
  const incomingCount = squadPlayerIds.filter((id) => !previousIds.includes(id)).length;
  const chip = activeChips[0] ?? null;
  team.chipUsage = team.chipUsage ?? {};
  if (chip === "freeHit" && team.activeChips?.[0] !== "freeHit") {
    team.freeHitSnapshot = {
      squadPlayerIds: [...previousIds],
      squadPlayers: (team.squadPlayers ?? []).map((player) => ({ ...player })),
      startingPlayerIds: [...(team.startingPlayerIds ?? [])],
      captainId: team.captainId ?? null,
      viceCaptainId: team.viceCaptainId ?? null,
    };
  }
  if (team.activeChips?.[0] && team.activeChips[0] !== chip) {
    team.chipUsage[team.activeChips[0]] = team.chipUsage[team.activeChips[0]] ?? 1;
  }
  if (chip && team.activeChips?.[0] !== chip) team.chipUsage[chip] = (team.chipUsage[chip] ?? 0) + 1;
  if (chip !== "wildcard" && chip !== "freeHit") {
    team.transfersThisWeek = (team.transfersThisWeek ?? 0) + incomingCount;
    const free = team.freeTransfers ?? 1;
    team.pointsHit = Math.max(0, (team.transfersThisWeek ?? 0) - free) * 4;
    team.freeTransfers = Math.max(0, free - incomingCount);
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
