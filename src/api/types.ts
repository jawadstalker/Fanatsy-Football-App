// Trimmed down to the fields this app uses. API-Football returns much
// more per player; extend these as new stats are needed.

export interface ApiFootballEnvelope<T> {
  response: T[];
  errors?: unknown;
  paging?: { current: number; total: number };
}

export interface ApiPlayerStatistics {
  team: { id: number; name: string; logo: string };
  games: {
    position: string; // "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"
    minutes: number | null;
    rating: string | null; // decimal string, e.g. "7.421"
  };
  goals: {
    total: number | null;
    assists: number | null;
    conceded: number | null;
    saves: number | null;
  };
  cards: {
    yellow: number | null;
    red: number | null;
  };
  penalty: {
    scored: number | null;
    missed: number | null;
    saved: number | null;
  };
}

export interface ApiPlayerEntry {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: ApiPlayerStatistics[];
}

export type ApiPlayersResponse = ApiFootballEnvelope<ApiPlayerEntry>;

// ---- /fixtures ----
export interface ApiFixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface ApiFixtureEntry {
  fixture: { id: number; date: string; status: { short: string }; round?: string | null };
  teams: { home: ApiFixtureTeam; away: ApiFixtureTeam };
  goals: { home: number | null; away: number | null };
}

export type ApiFixtureResponse = ApiFootballEnvelope<ApiFixtureEntry>;

// ---- /fixtures/players ----
export interface ApiFixturePlayerStats {
  games: {
    minutes: number | null;
    position: string;
    rating: string | null;
    captain: boolean;
    substitute: boolean;
  };
  goals: {
    total: number | null;
    assists: number | null;
    saves: number | null;
  };
  cards: { yellow: number | null; red: number | null };
  penalty: { scored: number | null; missed: number | null; saved: number | null };
}

export interface ApiFixturePlayerEntry {
  player: { id: number; name: string; photo: string };
  statistics: ApiFixturePlayerStats[];
}

export interface ApiFixtureTeamPlayers {
  team: { id: number; name: string; logo: string };
  players: ApiFixturePlayerEntry[];
}

export type ApiFixturePlayersResponse = ApiFootballEnvelope<ApiFixtureTeamPlayers>;
