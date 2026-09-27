import { getBackendUrl } from "@/config/backend";
import { BackendLeague, BackendTeam } from "@/types";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const base = getBackendUrl();
  if (!base) throw new Error("No backend configured.");
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Request failed (${res.status})`);
  return body as T;
}
export function createLeague(name:string, token:string):Promise<BackendLeague>{return request("/api/leagues",{method:"POST",body:JSON.stringify({name})},token)}
export function getLeague(code:string, token:string):Promise<BackendLeague>{return request(`/api/leagues/${encodeURIComponent(code)}`,{},token)}
export function joinLeague(code:string, managerName:string, token:string):Promise<BackendTeam>{return request(`/api/leagues/${encodeURIComponent(code)}/join`,{method:"POST",body:JSON.stringify({managerName})},token)}
export function saveSquad(
  code: string,
  teamId: string,
  squadPlayerIds: number[],
  captainId: number | null,
  viceCaptainId: number | null,
  activeChips: string[],
  token: string
): Promise<BackendTeam> {
  return request(
    `/api/leagues/${encodeURIComponent(code)}/teams/${encodeURIComponent(teamId)}/squad`,
    {
      method: "PUT",
      body: JSON.stringify({ squadPlayerIds, captainId, viceCaptainId, activeChips }),
    },
    token
  );
}

export function calculateAndSubmitPoints(code:string,teamId:string,gameweek:number,token:string):Promise<BackendTeam>{return request(`/api/leagues/${encodeURIComponent(code)}/teams/${encodeURIComponent(teamId)}/calculate-points`,{method:"POST",body:JSON.stringify({gameweek})},token)}
export function getStandings(code:string, token:string):Promise<BackendTeam[]>{return request(`/api/leagues/${encodeURIComponent(code)}/standings`,{},token)}
