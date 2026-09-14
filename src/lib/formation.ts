import { Position, SquadPlayer } from "@/types";

export interface FormationCheck {
  ok: boolean;
  reason?: string;
}

const LIMITS: Record<Position, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

const LABELS: Record<Position, string> = {
  GK: "goalkeeper",
  DEF: "defender",
  MID: "midfielder",
  FWD: "forward",
};

export function countByPosition(players: SquadPlayer[]): Record<Position, number> {
  return {
    GK: players.filter((p) => p.pos === "GK").length,
    DEF: players.filter((p) => p.pos === "DEF").length,
    MID: players.filter((p) => p.pos === "MID").length,
    FWD: players.filter((p) => p.pos === "FWD").length,
  };
}

// Validates a proposed starting XI: exactly 11 players, 1 GK, 3-5 DEF,
// 2-5 MID, 1-3 FWD (the same shape rules real FPL enforces).
export function isValidFormation(starting: SquadPlayer[]): FormationCheck {
  if (starting.length !== 11) {
    return { ok: false, reason: `Starting XI must have 11 players (has ${starting.length})` };
  }

  const counts = countByPosition(starting);

  for (const pos of Object.keys(LIMITS) as Position[]) {
    const { min, max } = LIMITS[pos];
    const count = counts[pos];
    if (count < min) return { ok: false, reason: `Need at least ${min} ${LABELS[pos]}${min > 1 ? "s" : ""}` };
    if (count > max) return { ok: false, reason: `Max ${max} ${LABELS[pos]}s allowed` };
  }

  return { ok: true };
}

const ROW_Y: Record<Position, number> = { GK: 92, DEF: 72, MID: 48, FWD: 22 };
const ROW_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];
const MARGIN = 14;

// Lays a starting XI out on the pitch: one horizontal row per position,
// players spread evenly across that row. Works for any legal formation
// shape (3-4-3, 4-3-3, 4-4-2, 5-3-2, ...).
export function assignPitchCoordinates(starting: SquadPlayer[]): SquadPlayer[] {
  const byPos: Record<Position, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of starting) byPos[p.pos].push(p);

  const positioned: SquadPlayer[] = [];
  for (const pos of ROW_ORDER) {
    const row = byPos[pos];
    const y = ROW_Y[pos];
    row.forEach((p, i) => {
      const x = row.length === 1 ? 50 : MARGIN + (i * (100 - 2 * MARGIN)) / (row.length - 1);
      positioned.push({ ...p, x, y });
    });
  }
  return positioned;
}
