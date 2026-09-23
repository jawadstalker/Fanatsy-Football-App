import { getBackendUrl } from "@/config/backend";
import { GameweekConfig } from "@/config/gameweek";

export async function fetchGameweekConfig(): Promise<GameweekConfig | null> {
  const base = getBackendUrl();
  if (!base) return null;

  const res = await fetch(`${base.replace(/\/$/, "")}/api/football/gameweek`);
  if (!res.ok) throw new Error(`Gameweek sync failed (${res.status})`);
  return (await res.json()) as GameweekConfig;
}
