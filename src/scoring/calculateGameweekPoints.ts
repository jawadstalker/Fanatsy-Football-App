import { fetchFixturePlayerStats, fetchLeagueRoundFixtures } from "@/api/fixtures";
import { mapApiPositionToApp, mapFixtureStatsToMatchStats } from "@/api/mapMatchStats";
import { calculatePoints, PointsBreakdown } from "@/scoring/calculatePoints";
import { LEAGUE_API_IDS, CURRENT_SEASON } from "@/api/leagues";

export interface GameweekPlayerPoints {
  playerId: number;
  name: string;
  teamId: number;
  team: string;
  points: PointsBreakdown;
}

export async function calculateLeagueGameweekPoints(
  leagueId: keyof typeof LEAGUE_API_IDS,
  round: string
): Promise<GameweekPlayerPoints[]> {
  const fixtures = await fetchLeagueRoundFixtures(
    LEAGUE_API_IDS[leagueId],
    CURRENT_SEASON,
    round
  );

  const totals = new Map<number, GameweekPlayerPoints>();

  await Promise.all(
    fixtures.map(async (fixture) => {
      const statsBlocks = await fetchFixturePlayerStats(fixture.fixture.id);
      const concededByTeam: Record<number, number> = {
        [fixture.teams.home.id]: fixture.goals.away ?? 0,
        [fixture.teams.away.id]: fixture.goals.home ?? 0,
      };

      for (const block of statsBlocks) {
        const conceded = concededByTeam[block.team.id] ?? 0;
        for (const entry of block.players) {
          const raw = entry.statistics[0];
          if (!raw || (raw.games.minutes ?? 0) === 0) continue;

          const position = mapApiPositionToApp(raw.games.position);
          if (!position) continue;

          const points = calculatePoints(
            mapFixtureStatsToMatchStats(raw, conceded),
            position
          );
          const previous = totals.get(entry.player.id);

          if (previous) {
            previous.points.total += points.total;
            previous.points.minutes += points.minutes;
            previous.points.goals += points.goals;
            previous.points.assists += points.assists;
            previous.points.cleanSheet += points.cleanSheet;
            previous.points.saves += points.saves;
            previous.points.penalties += points.penalties;
            previous.points.goalsConceded += points.goalsConceded;
            previous.points.cards += points.cards;
            previous.points.ownGoals += points.ownGoals;
            previous.points.bonus += points.bonus;
          } else {
            totals.set(entry.player.id, {
              playerId: entry.player.id,
              name: entry.player.name,
              teamId: block.team.id,
              team: block.team.name,
              points: { ...points },
            });
          }
        }
      }
    })
  );

  return [...totals.values()].sort((a, b) => b.points.total - a.points.total);
}
