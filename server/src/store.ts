import fs from "fs";
import path from "path";

export interface League {
  code: string;
  name: string;
  createdAt: string;
}

export interface Team {
  id: string;
  leagueCode: string;
  managerName: string;
  gwPoints: number;
  totalPoints: number;
}

interface DbShape {
  leagues: Record<string, League>;
  teams: Record<string, Team>;
}

const DATA_FILE = path.resolve(process.env.DATA_FILE ?? "./data.json");

function readDb(): DbShape {
  if (!fs.existsSync(DATA_FILE)) {
    return { leagues: {}, teams: {} };
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw) as DbShape;
  } catch {
    return { leagues: {}, teams: {} };
  }
}

function writeDb(db: DbShape): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Every exported function re-reads and re-writes the whole file. That's
// fine for a handful of private leagues in development; a real deployment
// should replace this module with a proper database and keep the same
// function signatures so the routes in leagues.ts don't need to change.

export function createLeague(code: string, name: string): League {
  const db = readDb();
  const league: League = { code, name, createdAt: new Date().toISOString() };
  db.leagues[code] = league;
  writeDb(db);
  return league;
}

export function getLeague(code: string): League | null {
  return readDb().leagues[code] ?? null;
}

export function joinLeague(id: string, leagueCode: string, managerName: string): Team {
  const db = readDb();
  const team: Team = { id, leagueCode, managerName, gwPoints: 0, totalPoints: 0 };
  db.teams[id] = team;
  writeDb(db);
  return team;
}

export function setTeamPoints(teamId: string, gwPoints: number): Team | null {
  const db = readDb();
  const team = db.teams[teamId];
  if (!team) return null;
  team.gwPoints = gwPoints;
  team.totalPoints += gwPoints;
  writeDb(db);
  return team;
}

export function getStandings(leagueCode: string): Team[] {
  const db = readDb();
  return Object.values(db.teams)
    .filter((t) => t.leagueCode === leagueCode)
    .sort((a, b) => b.totalPoints - a.totalPoints);
}
