import { apiFootballGet } from "./client";
import {
  ApiFixtureResponse,
  ApiFixturePlayersResponse,
  ApiFixtureEntry,
  ApiFixtureTeamPlayers,
} from "./types";

export async function fetchFixture(fixtureId: number): Promise<ApiFixtureEntry | null> {
  const data = await apiFootballGet<ApiFixtureResponse>("/fixtures", { id: fixtureId });
  return data.response[0] ?? null;
}

export async function fetchFixturePlayerStats(
  fixtureId: number
): Promise<ApiFixtureTeamPlayers[]> {
  const data = await apiFootballGet<ApiFixturePlayersResponse>("/fixtures/players", {
    fixture: fixtureId,
  });
  return data.response;
}
