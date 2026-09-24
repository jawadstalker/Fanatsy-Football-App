import { Router } from "express";
import { nanoid } from "nanoid";
import { createLeague, getLeague, joinLeague, setTeamPoints, getStandings } from "./store";
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

  res.status(201).json(joinLeague(nanoid(10), code, normalized));
});

leaguesRouter.post("/:code/teams/:teamId/points", requireAuth, (req, res) => {
  const { gameweek, gwPoints } = req.body as { gameweek?: number; gwPoints?: number };
  if (!Number.isInteger(gameweek) || gameweek < 1 || gameweek > 100) {
    return res.status(400).json({ error: "gameweek must be an integer between 1 and 100" });
  }
  if (typeof gwPoints !== "number" || !Number.isFinite(gwPoints)) {
    return res.status(400).json({ error: "gwPoints must be a finite number" });
  }

  const result = setTeamPoints(req.params.teamId, gameweek, gwPoints);
  if (!result.team) return res.status(404).json({ error: "Team not found" });
  if (result.duplicate) return res.status(409).json({ error: `Points already submitted for gameweek ${gameweek}`, team: result.team });

  res.json(result.team);
});

leaguesRouter.get("/:code/standings", (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!getLeague(code)) return res.status(404).json({ error: "League not found" });
  res.json(getStandings(code));
});
