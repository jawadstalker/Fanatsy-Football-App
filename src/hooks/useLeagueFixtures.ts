import { useEffect, useState } from "react";
import { fetchLeagueFixtures } from "@/api/leagueFixtures";
import { hasApiKey } from "@/api/config";
import { SAMPLE_FIXTURES } from "@/data/sampleFixtures";
import { Fixture, LeagueId } from "@/types";

interface UseFixturesResult {
  fixtures: Fixture[];
  loading: boolean;
  error: string | null;
  usingSampleData: boolean;
  refetch: () => void;
}

const cache = new Map<LeagueId, Fixture[]>();

export function useLeagueFixtures(league: LeagueId): UseFixturesResult {
  const sampleForLeague = () =>
    SAMPLE_FIXTURES.filter((f) => f.league === league).sort((a, b) => a.date.localeCompare(b.date));

  const [fixtures, setFixtures] = useState<Fixture[]>(() => cache.get(league) ?? sampleForLeague());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(!hasApiKey());

  const load = () => {
    if (!hasApiKey()) {
      setUsingSampleData(true);
      setFixtures(sampleForLeague());
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([fetchLeagueFixtures(league, "last", 5), fetchLeagueFixtures(league, "next", 5)])
      .then(([recent, upcoming]) => {
        const merged = [...recent, ...upcoming].sort((a, b) => a.date.localeCompare(b.date));
        cache.set(league, merged);
        setFixtures(merged);
        setUsingSampleData(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setUsingSampleData(true);
        setFixtures(sampleForLeague());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const cached = cache.get(league);
    if (cached) {
      setFixtures(cached);
      setUsingSampleData(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league]);

  return { fixtures, loading, error, usingSampleData, refetch: load };
}
