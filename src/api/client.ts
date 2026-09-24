import { getBackendUrl } from "@/config/backend";

export class ApiFootballError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiFootballError";
    this.status = status;
  }
}

function buildQuery(params: Record<string, string | number>): string {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();
}

export function hasFootballBackend(): boolean {
  return Boolean(getBackendUrl());
}

export async function apiFootballGet<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const base = getBackendUrl();
  if (!base) {
    throw new ApiFootballError("Football backend is not configured. Set EXPO_PUBLIC_BACKEND_URL.");
  }

  const query = buildQuery(params);
  const url = `${base.replace(/\/$/, "")}/api/football${path}${query ? `?${query}` : ""}`;
  const res = await fetch(url);

  if (!res.ok) {
    let message = `Football API request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {}
    throw new ApiFootballError(message, res.status);
  }

  return (await res.json()) as T;
}