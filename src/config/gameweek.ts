export interface GameweekConfig {
  currentGameweek: number;
  deadline: string;
}

// Fallback values are used only while the app is offline or before the
// backend metadata request completes.
let currentConfig: GameweekConfig = {
  currentGameweek: 6,
  deadline: "2026-09-20T10:30:00Z",
};

export const CURRENT_GAMEWEEK = currentConfig.currentGameweek;

export function getGameweekConfig(): GameweekConfig {
  return currentConfig;
}

export function configureGameweek(config: GameweekConfig): void {
  if (!Number.isInteger(config.currentGameweek) || config.currentGameweek < 1) return;
  const deadlineMs = new Date(config.deadline).getTime();
  if (!Number.isFinite(deadlineMs)) return;

  currentConfig = {
    currentGameweek: config.currentGameweek,
    deadline: config.deadline,
  };
}

export function isGameweekLocked(): boolean {
  return Date.now() > new Date(currentConfig.deadline).getTime();
}
