// API-Football configuration.
//
// For production, set EXPO_PUBLIC_BACKEND_URL and let the Express server
// proxy football requests. This keeps the RapidAPI key out of the app bundle.
//
// Direct RapidAPI access is retained only as a development fallback.

export const API_HOST = "api-football-v1.p.rapidapi.com";
export const API_BASE_URL = `https://${API_HOST}/v3`;

export function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}
