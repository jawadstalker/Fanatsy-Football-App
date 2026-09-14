import { useEffect, useRef, useState } from "react";
import { fetchPlayersByLeague } from "@/api/players";
import { mapPlayersResponse } from "@/api/mappers";
import { hasApiKey } from "@/api/config";
import { MARKET } from "@/data/sample";
import { LeagueId, MarketPlayer } from "@/types";

interface UsePlayersResult {
  players: MarketPlayer[];
  loading: boolean;
  error: string | null;
  usingSampleData: boolean;
  refetch: () => void;
}

// Simple in-memory cache so switching league tabs back and forth doesn't
// refire the network request every time. Cleared on app restart.
const cache = new Map<LeagueId, MarketPlayer[]>();

export function usePlayers(league: LeagueId): UsePlayersResult {
  const [players, setPlayers] = useState<MarketPlayer[]>(
    () => cache.get(league) ?? MARKET.filter((p) => p.league === league)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(!hasApiKey());
  const requestId = useRef(0);

  const load = () => {
    if (!hasApiKey()) {
      setUsingSampleData(true);
      setPlayers(MARKET.filter((p) => p.league === league));
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    fetchPlayersByLeague(league)
      .then(({ players: raw }) => {
        if (id !== requestId.current) return; // a newer request superseded this one
        const mapped = mapPlayersResponse(raw, league);
        cache.set(league, mapped);
        setPlayers(mapped);
        setUsingSampleData(false);
      })
      .catch((err: Error) => {
        if (id !== requestId.current) return;
        setError(err.message);
        setUsingSampleData(true);
        setPlayers(MARKET.filter((p) => p.league === league));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  };

  useEffect(() => {
    const fromCache = cache.get(league);
    if (fromCache) {
      setPlayers(fromCache);
      setUsingSampleData(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league]);

  return { players, loading, error, usingSampleData, refetch: load };
}
