import { fetchFixture, fetchFixturePlayerStats } from "@/api/fixtures";
import { mapApiPositionToApp, mapFixtureStatsToMatchStats } from "@/api/mapMatchStats";
import { calculatePoints, PointsBreakdown } from "./calculatePoints";

export interface PlayerFixturePoints {
  playerId: number;
  name: string;
  team: string;
  points: PointsBreakdown;
}

export async function calculateFixturePoints(
  fixtureId: number
): Promise<PlayerFixturePoints[]> {
  const [fixture, teamPlayerStats] = await Promise.all([
    fetchFixture(fixtureId),
    fetchFixturePlayerStats(fixtureId),
  ]);

  if (!fixture) return [];

  const concededByTeam: Record<number, number> = {
    [fixture.teams.home.id]: fixture.goals.away ?? 0,
    [fixture.teams.away.id]: fixture.goals.home ?? 0,
  };

  const results: PlayerFixturePoints[] = [];

  for (const teamBlock of teamPlayerStats) {
    const conceded = concededByTeam[teamBlock.team.id] ?? 0;

    for (const entry of teamBlock.players) {
      const raw = entry.statistics[0];
      if (!raw) continue;

      const position = mapApiPositionToApp(raw.games.position);
      if (!position) continue;
      if ((raw.games.minutes ?? 0) === 0) continue; // didn't play

      const matchStats = mapFixtureStatsToMatchStats(raw, conceded);
      const points = calculatePoints(matchStats, position);

      results.push({
        playerId: entry.player.id,
        name: entry.player.name,
        team: teamBlock.team.name,
        points,
      });
    }
  }

  return results.sort((a, b) => b.points.total - a.points.total);
}
