import { create } from "zustand";
import { STARTING, BENCH } from "@/data/sample";
import { MarketPlayer, SquadPlayer, TransferResult } from "@/types";
import { PlayerFixturePoints } from "@/scoring/calculateFixturePoints";
import { assignPitchCoordinates, isValidFormation, FormationCheck } from "@/lib/formation";

export const TOTAL_BUDGET = 105.0;
const INITIAL_FREE_TRANSFERS = 2;

function buildInitialSquad(): SquadPlayer[] {
  const starting: SquadPlayer[] = assignPitchCoordinates(
    STARTING.map((p) => ({ ...p, isStarting: true }))
  );
  const bench: SquadPlayer[] = BENCH.map((p) => ({ ...p, isStarting: false }));
  return [...starting, ...bench];
}

// Recomputes pitch x/y for whichever squad's starting XI just changed —
// call this after any edit that adds/removes/swaps a starter.
function relayout(squad: SquadPlayer[]): SquadPlayer[] {
  const starting = assignPitchCoordinates(squad.filter((p) => p.isStarting));
  const bench = squad.filter((p) => !p.isStarting);
  return [...starting, ...bench];
}

// MarketPlayer has no `pts`/`isStarting` (it's a transfer-market listing,
// not a squad member yet) — build the SquadPlayer explicitly instead of
// spreading, so we don't leak MarketPlayer's `form` field or silently
// miss required SquadPlayer fields.
function toSquadPlayer(
  market: MarketPlayer,
  overrides: Pick<SquadPlayer, "isStarting" | "x" | "y">
): SquadPlayer {
  return {
    id: market.id,
    name: market.name,
    club: market.club,
    clubId: market.clubId,
    pos: market.pos,
    league: market.league,
    price: market.price,
    pts: 0,
    ...overrides,
  };
}

interface TeamState {
  squad: SquadPlayer[];
  captainId: number;
  freeTransfers: number;
  transfersMadeThisWeek: number;

  bank: () => number;
  squadValue: () => number;
  pointsHit: () => number; // -4 per transfer beyond the free ones
  gameweekTotal: () => number; // starting XI, captain doubled
  isInSquad: (playerId: number) => boolean;

  addPlayer: (market: MarketPlayer) => TransferResult;
  removePlayer: (playerId: number) => void;
  setCaptain: (playerId: number) => void;
  swapPlayers: (benchId: number, startingId: number) => FormationCheck;
  applyFixturePoints: (results: PlayerFixturePoints[]) => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  squad: buildInitialSquad(),
  captainId: 9, // Haaland, matches the sample data's captain flag
  freeTransfers: INITIAL_FREE_TRANSFERS,
  transfersMadeThisWeek: 0,

  squadValue: () => get().squad.reduce((sum, p) => sum + p.price, 0),
  bank: () => Math.round((TOTAL_BUDGET - get().squadValue()) * 10) / 10,
  pointsHit: () => Math.max(0, get().transfersMadeThisWeek - INITIAL_FREE_TRANSFERS) * 4,
  isInSquad: (playerId) => get().squad.some((p) => p.id === playerId),

  gameweekTotal: () => {
    const { squad, captainId, pointsHit } = get();
    const raw = squad
      .filter((p) => p.isStarting)
      .reduce((sum, p) => sum + (p.id === captainId ? p.pts * 2 : p.pts), 0);
    return raw - pointsHit();
  },

  addPlayer: (market) => {
    const { squad, bank } = get();

    if (squad.some((p) => p.id === market.id)) {
      return { ok: false, reason: "exists" };
    }

    if (squad.length < 15) {
      if (bank() < market.price) return { ok: false, reason: "budget" };
      set((s) => ({
        squad: [...s.squad, toSquadPlayer(market, { isStarting: false })],
        transfersMadeThisWeek: s.transfersMadeThisWeek + 1,
        freeTransfers: Math.max(0, s.freeTransfers - 1),
      }));
      return { ok: true };
    }

    // Full squad: swap out the cheapest player in the same position, so
    // position counts (2 GK / 5 DEF / 5 MID / 3 FWD) stay valid.
    const candidate = squad
      .filter((p) => p.pos === market.pos)
      .sort((a, b) => a.price - b.price)[0];

    if (!candidate) return { ok: false, reason: "no-replacement" };

    const cost = market.price - candidate.price;
    if (bank() < cost) return { ok: false, reason: "budget" };

    set((s) => ({
      squad: relayout(
        s.squad.map((p) =>
          p.id === candidate.id
            ? toSquadPlayer(market, { isStarting: candidate.isStarting, x: candidate.x, y: candidate.y })
            : p
        )
      ),
      transfersMadeThisWeek: s.transfersMadeThisWeek + 1,
      freeTransfers: Math.max(0, s.freeTransfers - 1),
      captainId: s.captainId === candidate.id ? market.id : s.captainId,
    }));

    return { ok: true, replaced: candidate.name };
  },

  removePlayer: (playerId) => {
    set((s) => ({ squad: s.squad.filter((p) => p.id !== playerId) }));
  },

  setCaptain: (playerId) => {
    const player = get().squad.find((p) => p.id === playerId);
    if (!player?.isStarting) return; // FPL rule: captain must be in the starting XI
    set({ captainId: playerId });
  },

  // Swaps a bench player into the starting XI (and its counterpart onto
  // the bench), rejecting the swap if the resulting XI would be an
  // illegal formation (wrong GK count, too few/many DEF/MID/FWD, etc.).
  swapPlayers: (benchId, startingId) => {
    const { squad, captainId } = get();
    const benchPlayer = squad.find((p) => p.id === benchId);
    const startingPlayer = squad.find((p) => p.id === startingId);

    if (!benchPlayer || !startingPlayer) {
      return { ok: false, reason: "Player not found" };
    }
    if (benchPlayer.isStarting || !startingPlayer.isStarting) {
      return { ok: false, reason: "Pick one bench player and one starting player" };
    }

    const proposedStarting = squad
      .filter((p) => p.isStarting)
      .map((p) => (p.id === startingId ? { ...p, isStarting: false } : p))
      .filter((p) => p.isStarting)
      .concat({ ...benchPlayer, isStarting: true });

    const check = isValidFormation(proposedStarting);
    if (!check.ok) return check;

    set({
      squad: relayout(
        squad.map((p) => {
          if (p.id === benchId) return { ...p, isStarting: true };
          if (p.id === startingId) return { ...p, isStarting: false };
          return p;
        })
      ),
      // If we just benched the captain, hand the armband to whoever came on.
      captainId: captainId === startingId ? benchId : captainId,
    });

    return { ok: true };
  },

  applyFixturePoints: (results) => {
    set((s) => ({
      squad: s.squad.map((p) => {
        const match = results.find((r) => r.playerId === p.id);
        return match ? { ...p, pts: match.points.total } : p;
      }),
    }));
  },
}));

