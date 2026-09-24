import { getBackendUrl } from "@/config/backend";
import { BackendUser } from "@/types";

class AuthError extends Error {}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const base = getBackendUrl();
  if (!base) throw new AuthError("Backend is not configured.");

  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new AuthError((body && body.error) || `Request failed (${res.status})`);
  return body as T;
}

export function register(username: string, password: string): Promise<BackendUser> {
  return request("/api/auth/register", { method: "POST", body: JSON.stringify({ username, password }) });
}

export function login(username: string, password: string): Promise<BackendUser> {
  return request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export function me(token: string): Promise<BackendUser> {
  return request("/api/auth/me", {}, token);
}

export { AuthError };
