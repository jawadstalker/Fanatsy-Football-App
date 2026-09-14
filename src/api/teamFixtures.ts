import { apiFootballGet } from "./client";
import { ApiFixtureResponse } from "./types";

export async function fetchLastFixtureIdForTeam(teamId: number): Promise<number | null> {
  const data = await apiFootballGet<ApiFixtureResponse>("/fixtures", {
    team: teamId,
    last: 1,
  });
  return data.response[0]?.fixture.id ?? null;
}
