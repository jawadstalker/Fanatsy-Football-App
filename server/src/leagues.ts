import { Router } from "express";
import { nanoid } from "nanoid";
import { createLeague, getLeague, joinLeague, setTeamPoints, getStandings } from "./store";

export const leaguesRouter = Router();

leaguesRouter.post("/", (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name) return res.status(400).json({ error: "name is required" });

  const code = nanoid(6).toUpperCase();
  const league = createLeague(code, name);
  res.status(201).json(league);
});

leaguesRouter.get("/:code", (req, res) => {
  const league = getLeague(req.params.code);
  if (!league) return res.status(404).json({ error: "League not found" });
  res.json(league);
});

leaguesRouter.post("/:code/join", (req, res) => {
  const { managerName } = req.body as { managerName?: string };
  if (!managerName) return res.status(400).json({ error: "managerName is required" });

  const league = getLeague(req.params.code);
  if (!league) return res.status(404).json({ error: "League not found" });

  const team = joinLeague(nanoid(10), league.code, managerName);
  res.status(201).json(team);
});

leaguesRouter.post("/:code/teams/:teamId/points", (req, res) => {
  const { gwPoints } = req.body as { gwPoints?: number };
  if (typeof gwPoints !== "number") return res.status(400).json({ error: "gwPoints must be a number" });

  const team = setTeamPoints(req.params.teamId, gwPoints);
  if (!team) return res.status(404).json({ error: "Team not found" });
  res.json(team);
});

leaguesRouter.get("/:code/standings", (req, res) => {
  const league = getLeague(req.params.code);
  if (!league) return res.status(404).json({ error: "League not found" });
  res.json(getStandings(req.params.code));
});
