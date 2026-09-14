// API-Football via RapidAPI. Get a key at:
// https://rapidapi.com/api-sports/api/api-football
//
// Set it as EXPO_PUBLIC_RAPIDAPI_KEY in a `.env` file at the project root
// (see `.env.example`). Expo inlines EXPO_PUBLIC_* vars into the JS bundle
// at build time — no extra config needed, but never put secrets that must
// stay server-only behind this prefix. For a shipped app, proxy requests
// through your own backend instead of calling RapidAPI directly from the
// client, so the key isn't embedded in the app binary.

export const API_HOST = "api-football-v1.p.rapidapi.com";
export const API_BASE_URL = `https://${API_HOST}/v3`;

export function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}
