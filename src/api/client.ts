import { API_BASE_URL, API_HOST, getApiKey } from "./config";

export class ApiFootballError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiFootballError";
    this.status = status;
  }
}

export async function apiFootballGet<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const key = getApiKey();
  if (!key) {
    throw new ApiFootballError(
      "EXPO_PUBLIC_RAPIDAPI_KEY is not set — see .env.example."
    );
  }

  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();

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
