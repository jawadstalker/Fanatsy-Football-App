import { Router } from "express";

export const footballRouter = Router();

const API_HOST = "api-football-v1.p.rapidapi.com";
const API_BASE_URL = `https://${API_HOST}/v3`;

// Only proxy the endpoints the app actually needs — an open passthrough
// would let anyone use your RapidAPI quota for arbitrary requests.
const ALLOWED_PATHS = new Set(["/players", "/fixtures", "/fixtures/players"]);

footballRouter.get("/*", async (req, res) => {
  const apiPath = req.path; // e.g. "/players"
  if (!ALLOWED_PATHS.has(apiPath)) {
    return res.status(404).json({ error: "Unsupported endpoint" });
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return res.status(500).json({ error: "RAPIDAPI_KEY is not set on the server" });
  }

  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const url = `${API_BASE_URL}${apiPath}${query ? `?${query}` : ""}`;

  try {
    const upstream = await fetch(url, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": API_HOST },
    });
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ error: "Upstream request failed", detail: (err as Error).message });
  }
});
