import { useEffect, useState } from "react";
import { calculateFixturePoints, PlayerFixturePoints } from "@/scoring/calculateFixturePoints";

export function useFixturePoints(fixtureId: number | null) {
  const [data, setData] = useState<PlayerFixturePoints[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixtureId === null) {
      setData([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    calculateFixturePoints(fixtureId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fixtureId]);

  return { data, loading, error };
}
