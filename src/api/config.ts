// RapidAPI credentials are server-only.
// The Expo app must use EXPO_PUBLIC_BACKEND_URL for live football data.
export const API_HOST = "api-football-v1.p.rapidapi.com";
export const API_BASE_URL = `https://${API_HOST}/v3`;

export function getApiKey(): undefined {
  return undefined;
}

export function hasApiKey(): boolean {
  return false;
}