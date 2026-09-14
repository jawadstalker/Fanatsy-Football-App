// Update these before each gameweek (e.g. from a fixtures API, or by hand).
export const CURRENT_GAMEWEEK = 6;

// ISO 8601. Transfers, captaincy, substitutions, and chips lock once this
// passes, matching how FPL locks squads at kickoff of the gameweek's first match.
export const GAMEWEEK_DEADLINE = "2026-09-20T10:30:00Z";

export function isGameweekLocked(): boolean {
  return Date.now() > new Date(GAMEWEEK_DEADLINE).getTime();
}
