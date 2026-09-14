// Points at the Express server in /server. Leave unset to keep using the
// sample leaderboard in the League tab — real private leagues need a
// running, reachable backend (see server/README.md).
//
// Example: EXPO_PUBLIC_BACKEND_URL=https://your-server.example.com
export function getBackendUrl(): string | null {
  return process.env.EXPO_PUBLIC_BACKEND_URL ?? null;
}

export function hasBackend(): boolean {
  return Boolean(getBackendUrl());
}
