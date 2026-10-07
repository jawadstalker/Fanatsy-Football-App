import fs from "fs";
import path from "path";

export type FplPlayer = {
  id: number;
  first_name?: string;
  second_name?: string;
  web_name?: string;
  team?: number;
};

export type FplTeam = {
  id: number;
  name?: string;
  short_name?: string;
};

type MappingDb = Record<string, number>;

const MAP_FILE = path.resolve(process.env.FPL_PLAYER_MAP_FILE ?? "./fpl-player-map.json");
let mappingCache: MappingDb | null = null;
let fplPlayersCache: FplPlayer[] | null = null;
let fplTeamsCache: FplTeam[] | null = null;

export function normalizeMappingName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function readMapping(): MappingDb {
  if (mappingCache) return mappingCache;
  if (!fs.existsSync(MAP_FILE)) {
    mappingCache = {};
    return mappingCache;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8")) as MappingDb;
    mappingCache = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    mappingCache = {};
  }
  return mappingCache;
}

function writeMapping(mapping: MappingDb): void {
  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  const tempFile = `${MAP_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(mapping, null, 2), "utf-8");
  fs.renameSync(tempFile, MAP_FILE);
  mappingCache = mapping;
}

export function getStoredFplPlayerId(apiFootballPlayerId: number): number | undefined {
  return readMapping()[String(apiFootballPlayerId)];
}

export function storeFplPlayerMapping(apiFootballPlayerId: number, fplPlayerId: number): void {
  const mapping = { ...readMapping(), [String(apiFootballPlayerId)]: fplPlayerId };
  writeMapping(mapping);
}

async function fetchFplBootstrap(): Promise<{ elements: FplPlayer[]; teams: FplTeam[] }> {
  if (fplPlayersCache && fplTeamsCache) {
    return { elements: fplPlayersCache, teams: fplTeamsCache };
  }

  const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
  if (!response.ok) throw new Error(`FPL bootstrap failed with status ${response.status}`);

  const body = await response.json() as { elements?: FplPlayer[]; teams?: FplTeam[] };
  if (!Array.isArray(body.elements) || !Array.isArray(body.teams)) {
    throw new Error("FPL bootstrap response is missing players or teams");
  }

  fplPlayersCache = body.elements;
  fplTeamsCache = body.teams;
  return { elements: body.elements, teams: body.teams };
}

function fplPlayerNames(player: FplPlayer): string[] {
  return [
    `${player.first_name ?? ""} ${player.second_name ?? ""}`,
    player.web_name ?? "",
  ].filter(Boolean).map(normalizeMappingName);
}

export function findFplPlayerId(
  players: FplPlayer[],
  fplTeams: FplTeam[],
  apiPlayerName: string,
  apiTeamName?: string,
): number | undefined {
  const name = normalizeMappingName(apiPlayerName);
  const teamName = apiTeamName ? normalizeMappingName(apiTeamName) : "";

  const candidates = players.filter((player) => fplPlayerNames(player).includes(name));
  if (!teamName) {
    return candidates.length === 1 ? candidates[0].id : undefined;
  }

  const matchingTeamIds = new Set(
    fplTeams
      .filter((team) => normalizeMappingName(team.name ?? "") === teamName)
      .map((team) => team.id),
  );
  const teamMatches = candidates.filter((player) => player.team != null && matchingTeamIds.has(player.team));
  return teamMatches.length === 1 ? teamMatches[0].id : undefined;
}

export async function resolveFplPlayerId(
  apiFootballPlayerId: number,
  apiPlayerName: string,
  apiTeamName?: string,
): Promise<number | undefined> {
  const stored = getStoredFplPlayerId(apiFootballPlayerId);
  if (stored != null) return stored;

  const { elements, teams } = await fetchFplBootstrap();
  const resolved = findFplPlayerId(elements, teams, apiPlayerName, apiTeamName);
  if (resolved == null) return undefined;

  storeFplPlayerMapping(apiFootballPlayerId, resolved);
  return resolved;
}
