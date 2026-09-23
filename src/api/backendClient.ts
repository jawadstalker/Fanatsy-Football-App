import { getBackendUrl } from "@/config/backend";
import { BackendLeague, BackendTeam } from "@/types";

class BackendError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getBackendUrl();
  if (!base) throw new BackendError("No backend configured (EXPO_PUBLIC_BACKEND_URL is unset)");

  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new BackendError((body && body.error) || `Request failed (${res.status})`);
  }
  return body as T;
}

export function createLeague(name: string): Promise<BackendLeague> {
  return request<BackendLeague>("/api/leagues", {
    method: "POST",
    body: JSON.stringify({ name: name.trim() }),
  });
}

export function getLeague(code: string): Promise<BackendLeague> {
  return request<BackendLeague>(`/api/leagues/${encodeURIComponent(code)}`);
}

export function joinLeague(code: string, managerName: string): Promise<BackendTeam> {
  return request<BackendTeam>(`/api/leagues/${encodeURIComponent(code)}/join`, {
    method: "POST",
    body: JSON.stringify({ managerName: managerName.trim() }),
  });
}

export function submitPoints(
  code: string,
  teamId: string,
  gameweek: number,
  gwPoints: number
): Promise<BackendTeam> {
  return request<BackendTeam>(
    `/api/leagues/${encodeURIComponent(code)}/teams/${encodeURIComponent(teamId)}/points`,
    {
      method: "POST",
      body: JSON.stringify({ gameweek, gwPoints }),
    }
  );
}

export function getStandings(code: string): Promise<BackendTeam[]> {
  return request<BackendTeam[]>(`/api/leagues/${encodeURIComponent(code)}/standings`);
}
