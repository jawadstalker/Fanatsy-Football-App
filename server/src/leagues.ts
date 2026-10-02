import { Router } from "express";
import { nanoid } from "nanoid";
import { createLeague, getLeague, joinLeague, setTeamPoints, getStandings, updateTeamSquad, RosterPlayerSnapshot } from "./store";
import { calculateServerGameweekPoints, calculateSquadTotal } from "./scoring";
import { requireAuth } from "./auth";

export const leaguesRouter = Router();

leaguesRouter.post("/", requireAuth, (req, res) => {
  const { name } = req.body as { name?: string };
  const normalized = name?.trim();
  if (!normalized) return res.status(400).json({ error: "name is required" });
  if (normalized.length > 40) return res.status(400).json({ error: "name must be 40 characters or fewer" });

  const code = nanoid(6).toUpperCase();
  res.status(201).json(createLeague(code, normalized));
});

leaguesRouter.get("/:code", (req, res) => {
  const league = getLeague(req.params.code.toUpperCase());
  if (!league) return res.status(404).json({ error: "League not found" });
  res.json(league);
});

leaguesRouter.post("/:code/join", requireAuth, (req, res) => {
  const { managerName } = req.body as { managerName?: string };
  const normalized = managerName?.trim();
  if (!normalized) return res.status(400).json({ error: "managerName is required" });
  if (normalized.length > 30) return res.status(400).json({ error: "managerName must be 30 characters or fewer" });

  const code = req.params.code.toUpperCase();
  if (!getLeague(code)) return res.status(404).json({ error: "League not found" });

  res.status(201).json(joinLeague(nanoid(10), code, normalized, req.userId!));
});

leaguesRouter.put("/:code/teams/:teamId/squad", requireAuth, (req, res) => {
  const { squadPlayerIds, startingPlayerIds, squadPlayers, captainId, viceCaptainId, activeChips } = req.body as {
    squadPlayerIds?: unknown;
    captainId?: unknown;
    viceCaptainId?: unknown;
    activeChips?: unknown;
    startingPlayerIds?: unknown;
    squadPlayers?: unknown;
  };

  if (!Array.isArray(squadPlayerIds) || squadPlayerIds.length !== 15 || !squadPlayerIds.every((id) => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ error: "squadPlayerIds must contain exactly 15 positive integer player IDs" });
  }

  if (!Array.isArray(startingPlayerIds) || startingPlayerIds.length !== 11 || !startingPlayerIds.every((id) => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ error: "startingPlayerIds must contain exactly 11 positive integer player IDs" });
  }

  const uniqueIds = new Set(squadPlayerIds as number[]);
  const uniqueStartingIds = new Set(startingPlayerIds as number[]);
  if (uniqueIds.size !== 15) {
    return res.status(400).json({ error: "squadPlayerIds must contain 15 unique players" });
  }

  if (!Array.isArray(squadPlayers) || squadPlayers.length !== 15) {
    return res.status(400).json({ error: "squadPlayers must contain 15 player snapshots" });
  }
  const snapshots = squadPlayers as RosterPlayerSnapshot[];
  const validPositions = new Set(["GK", "DEF", "MID", "FWD"]);
  if (!snapshots.every((p) =>
    p && Number.isInteger(p.id) && p.id > 0 &&
    typeof p.club === "string" && p.club.trim().length > 0 &&
    validPositions.has(p.pos) &&
    typeof p.price === "number" && Number.isFinite(p.price) && p.price > 0 &&
    typeof p.league === "string"
  )) return res.status(400).json({ error: "Each player snapshot must include valid id, club, position, price, and league" });
  if (new Set(snapshots.map((p) => p.id)).size !== 15 || snapshots.some((p) => !uniqueIds.has(p.id))) {
    return res.status(400).json({ error: "Player snapshots must match the 15 unique squad IDs" });
  }
  const positionCounts = snapshots.reduce<Record<string, number>>((counts, player) => {
    counts[player.pos] = (counts[player.pos] ?? 0) + 1;
    return counts;
  }, {});
  if (positionCounts.GK !== 2 || positionCounts.DEF !== 5 || positionCounts.MID !== 5 || positionCounts.FWD !== 3) {
    return res.status(400).json({ error: "Squad must contain 2 GK, 5 DEF, 5 MID, and 3 FWD players" });
  }
  const clubCounts = new Map<string, number>();
  for (const player of snapshots) {
    const key = player.clubId != null ? String(player.clubId) : player.club.trim().toLowerCase();
    clubCounts.set(key, (clubCounts.get(key) ?? 0) + 1);
  }
  if ([...clubCounts.values()].some((count) => count > 3)) {
    return res.status(400).json({ error: "A maximum of 3 players per club is allowed" });
  }
  if (snapshots.reduce((sum, player) => sum + player.price, 0) > 105) {
    return res.status(400).json({ error: "Squad exceeds the 105.0 budget" });
  }

  if (uniqueStartingIds.size !== 11 || [...uniqueStartingIds].some((id) => !uniqueIds.has(id))) {
    return res.status(400).json({ error: "startingPlayerIds must contain 11 unique players from the squad" });
  }

  if (captainId !== null && (!Number.isInteger(captainId) || !uniqueIds.has(captainId as number))) {
    return res.status(400).json({ error: "captainId must be null or a player in the squad" });
  }

  if (viceCaptainId !== null && (!Number.isInteger(viceCaptainId) || !uniqueIds.has(viceCaptainId as number))) {
    return res.status(400).json({ error: "viceCaptainId must be null or a player in the squad" });
  }

  if (captainId !== null && viceCaptainId !== null && captainId === viceCaptainId) {
    return res.status(400).json({ error: "captainId and viceCaptainId must be different" });
  }

  const allowedChips = new Set(["wildcard", "benchBoost", "tripleCaptain", "freeHit"]);
  if (!Array.isArray(activeChips) || activeChips.length > 1 || !activeChips.every((chip) => typeof chip === "string" && allowedChips.has(chip))) {
    return res.status(400).json({ error: "activeChips must contain at most one valid chip" });
  }

  const code = req.params.code.toUpperCase();
  if (!getLeague(code)) return res.status(404).json({ error: "League not found" });
  const currentTeam = getStandings(code).find((team) => team.id === req.params.teamId);
  if (!currentTeam || currentTeam.userId !== req.userId) {
    return res.status(403).json({ error: "You do not own this team" });
  }

  const team = updateTeamSquad(
    req.params.teamId,
    squadPlayerIds as number[],
    captainId as number | null,
    viceCaptainId as number | null,
    activeChips as string[],
    startingPlayerIds as number[],
    snapshots
  );
  if (!team) return res.status(404).json({ error: "Team not found" });
  res.json(team);
});

leaguesRouter.post("/:code/teams/:teamId/calculate-points", requireAuth, async (req, res) => {
  const { gameweek } = req.body as { gameweek?: number };
  if (!Number.isInteger(gameweek) || gameweek < 1 || gameweek > 100) return res.status(400).json({ error: "gameweek must be an integer between 1 and 100" });
  const code=req.params.code.toUpperCase();
  const team=getStandings(code).find(t=>t.id===req.params.teamId);
  if(!team||team.userId!==req.userId)return res.status(403).json({error:"You do not own this team"});
  if(!team.squadPlayerIds||team.squadPlayerIds.length!==15)return res.status(400).json({error:"Save a complete 15-player squad before calculating points"});
  try{
    const points=await calculateServerGameweekPoints(team.squadPlayerIds,gameweek);
    const total=calculateSquadTotal(
      points,
      team.squadPlayerIds,
      team.captainId,
      team.viceCaptainId,
      team.activeChips ?? [],
      team.startingPlayerIds ?? []
    );
    const result=setTeamPoints(team.id,gameweek,total);
    if(!result.team)return res.status(404).json({error:"Team not found"});
    if(result.duplicate)return res.status(409).json({error:`Points already submitted for gameweek ${gameweek}`,team:result.team});
    return res.json(result.team);
  }catch(err){return res.status(502).json({error:"Gameweek scoring failed",detail:(err as Error).message});}
});

leaguesRouter.get("/:code/standings", (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!getLeague(code)) return res.status(404).json({ error: "League not found" });
  res.json(getStandings(code));
});
