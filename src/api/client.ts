import { API_BASE_URL, API_HOST, getApiKey } from "./config";
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
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    )
  ).toString();
}

export async function apiFootballGet<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const query = buildQuery(params);
  const backendUrl = getBackendUrl();

  // Production-safe path: the RapidAPI key stays on the Express server.
  if (backendUrl) {
    const base = backendUrl.replace(/\/$/, "");
    const url = `${base}/api/football${path}${query ? `?${query}` : ""}`;

    const res = await fetch(url);

    if (!res.ok) {
      let message = `Football API request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // Keep the HTTP status message when the server does not return JSON.
      }
      throw new ApiFootballError(message, res.status);
    }

    return (await res.json()) as T;
  }

  // Development fallback: direct RapidAPI access remains supported.
  const key = getApiKey();
  if (!key) {
    throw new ApiFootballError(
      "No football API configured. Set EXPO_PUBLIC_BACKEND_URL or EXPO_PUBLIC_RAPIDAPI_KEY."
    );
  }

  const url = `${API_BASE_URL}${path}${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": API_HOST,
    },
  });

  if (!res.ok) {
    throw new ApiFootballError(`Request failed (${res.status})`, res.status);
  }

  return (await res.json()) as T;
}
