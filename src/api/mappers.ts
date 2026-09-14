import { ApiPlayerEntry } from "./types";
import { LeagueId, MarketPlayer, Position } from "@/types";

const API_POSITION_TO_APP: Record<string, Position> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Attacker: "FWD",
};

// API-Football has no concept of a fantasy "price" — that's each fantasy
// provider's own invention. This is a starting heuristic: base price per
// position, nudged up by match rating and minutes played (proxy for
// importance to the team). Tune freely, or replace with your own model
// once you have a full season of stats to calibrate against.
const BASE_PRICE: Record<Position, number> = {
  GK: 4.5,
  DEF: 4.5,
  MID: 5.5,
  FWD: 6.0,
};

export function estimatePrice(rating: number, minutes: number, pos: Position): number {
  const ratingBoost = Math.max(0, rating - 6.0) * 1.8;
  const minutesBoost = Math.min(minutes / 1000, 3) * 0.6;
  const price = BASE_PRICE[pos] + ratingBoost + minutesBoost;
  return Math.round(price * 2) / 2; // round to nearest 0.5, like FPL prices
}

export function mapToMarketPlayer(
  entry: ApiPlayerEntry,
  league: LeagueId
): MarketPlayer | null {
  const stats = entry.statistics[0];
  if (!stats) return null;

  const pos = API_POSITION_TO_APP[stats.games.position];
  if (!pos) return null; // skip positions we don't model (e.g. coach entries)

  const rating = parseFloat(stats.games.rating ?? "6.0") || 6.0;
  const minutes = stats.games.minutes ?? 0;

  return {
    id: entry.player.id,
    name: entry.player.name,
    club: stats.team.name,
    clubId: stats.team.id,
    pos,
    league,
    price: estimatePrice(rating, minutes, pos),
    form: Math.round(rating * 10) / 10,
  };
}

export function mapPlayersResponse(
  entries: ApiPlayerEntry[],
  league: LeagueId
): MarketPlayer[] {
  return entries
    .map((e) => mapToMarketPlayer(e, league))
    .filter((p): p is MarketPlayer => p !== null);
}
