import { useState } from "react";
import { fetchLastFixtureIdForTeam } from "@/api/teamFixtures";
import { calculateFixturePoints, PlayerFixturePoints } from "@/scoring/calculateFixturePoints";
import { useTeamStore } from "@/store/useTeamStore";

export function useGameweekSync() {
  const squad = useTeamStore((s) => s.squad);
  const applyFixturePoints = useTeamStore((s) => s.applyFixturePoints);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = async () => {
    setSyncing(true);
    setError(null);

    try {
      // Only players added from the live API carry a clubId (sample/demo
      // players don't, since they aren't real API-Football ids) — so this
      // naturally scores whatever part of the squad is "real".
      const clubIds = Array.from(
        new Set(squad.map((p) => p.clubId).filter((id): id is number => Boolean(id)))
      );

      if (clubIds.length === 0) {
        setError("No live players (from API) in your squad to sync points for");
        return;
      }

      const fixtureIds = await Promise.all(clubIds.map(fetchLastFixtureIdForTeam));
      const uniqueFixtureIds = Array.from(
        new Set(fixtureIds.filter((id): id is number => id !== null))
      );

      const perFixture = await Promise.all(uniqueFixtureIds.map(calculateFixturePoints));
      const allResults: PlayerFixturePoints[] = perFixture.flat();

      applyFixturePoints(allResults);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return { sync, syncing, error };
}
