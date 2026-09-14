import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STARTING, BENCH } from "@/data/sample";
import { MarketPlayer, SquadPlayer, TransferResult, ChipId, ChipStatus } from "@/types";
import { PlayerFixturePoints } from "@/scoring/calculateFixturePoints";
import { assignPitchCoordinates, isValidFormation, FormationCheck } from "@/lib/formation";
import { isGameweekLocked, CURRENT_GAMEWEEK } from "@/config/gameweek";

export const TOTAL_BUDGET = 105.0;
const INITIAL_FREE_TRANSFERS = 2;
const LOCKED_RESULT: TransferResult = { ok: false, reason: "locked" };
const LOCKED_FORMATION_CHECK: FormationCheck = { ok: false, reason: "Gameweek is locked" };

function buildInitialSquad(): SquadPlayer[] {
  const starting: SquadPlayer[] = assignPitchCoordinates(
    STARTING.map((p) => ({ ...p, isStarting: true }))
  );
  const bench: SquadPlayer[] = BENCH.map((p) => ({ ...p, isStarting: false }));
  return [...starting, ...bench];
}

function relayout(squad: SquadPlayer[]): SquadPlayer[] {
  const starting = assignPitchCoordinates(squad.filter((p) => p.isStarting));
  const bench = squad.filter((p) => !p.isStarting);
  return [...starting, ...bench];
}

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

interface FreeHitSnapshot {
  squad: SquadPlayer[];
  captainId: number;
  viceCaptainId: number | null;
}

interface TeamState {
  squad: SquadPlayer[];
  captainId: number;
  viceCaptainId: number | null;
  freeTransfers: number;
  transfersMadeThisWeek: number;
  chips: Record<ChipId, ChipStatus>;
  lastSeenGameweek: number;
  freeHitSnapshot: FreeHitSnapshot | null;

  bank: () => number;
  squadValue: () => number;
  pointsHit: () => number;
  gameweekTotal: () => number;
  isInSquad: (playerId: number) => boolean;
  isLocked: () => boolean;

  addPlayer: (market: MarketPlayer) => TransferResult;
  removePlayer: (playerId: number) => void;
  setCaptain: (playerId: number) => void;
  setViceCaptain: (playerId: number) => void;
  swapPlayers: (benchId: number, startingId: number) => FormationCheck;
  activateChip: (chip: ChipId) => void;
  cancelChip: (chip: ChipId) => void;
  applyFixturePoints: (results: PlayerFixturePoints[]) => void;
  // Call once on app start with the current gameweek number (e.g. from
  // config, or a fixtures API). If it has advanced since last time, this
  // rolls transfers/chips forward one gameweek. There's no automatic
  // per-gameweek scheduler here — see README for the production approach.
  syncGameweek: (currentGameweek: number) => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      squad: buildInitialSquad(),
      captainId: 9, // Haaland
      viceCaptainId: 5, // Bellingham
      freeTransfers: INITIAL_FREE_TRANSFERS,
      transfersMadeThisWeek: 0,
      chips: {
        wildcard: "available",
        benchBoost: "available",
        tripleCaptain: "available",
        freeHit: "available",
      },
      lastSeenGameweek: CURRENT_GAMEWEEK,
      freeHitSnapshot: null,

      isLocked: () => isGameweekLocked(),

      squadValue: () => get().squad.reduce((sum, p) => sum + p.price, 0),
      bank: () => Math.round((TOTAL_BUDGET - get().squadValue()) * 10) / 10,

      pointsHit: () => {
        const { chips } = get();
        if (chips.wildcard === "active" || chips.freeHit === "active") return 0;
        return Math.max(0, get().transfersMadeThisWeek - INITIAL_FREE_TRANSFERS) * 4;
      },

      isInSquad: (playerId) => get().squad.some((p) => p.id === playerId),

      gameweekTotal: () => {
        const { squad, captainId, viceCaptainId, chips, pointsHit } = get();
        const starting = squad.filter((p) => p.isStarting);
        const captain = starting.find((p) => p.id === captainId);

        // If the captain didn't play (0 points), the armband effect
        // passes to the vice-captain instead — same as real FPL.
        const armbandId = captain && captain.pts > 0 ? captainId : viceCaptainId ?? captainId;
        const multiplier = chips.tripleCaptain === "active" ? 3 : 2;

        const scored = chips.benchBoost === "active" ? squad : starting;
        const raw = scored.reduce((sum, p) => {
          if (p.id === armbandId) return sum + p.pts * multiplier;
          return sum + p.pts;
        }, 0);

        return raw - pointsHit();
      },

      addPlayer: (market) => {
        if (isGameweekLocked()) return LOCKED_RESULT;
        const { squad, bank, chips } = get();

        if (squad.some((p) => p.id === market.id)) return { ok: false, reason: "exists" };

        const unlimitedTransfers = chips.wildcard === "active" || chips.freeHit === "active";

        if (squad.length < 15) {
          if (bank() < market.price) return { ok: false, reason: "budget" };
          set((s) => ({
            squad: [...s.squad, toSquadPlayer(market, { isStarting: false })],
            transfersMadeThisWeek: unlimitedTransfers ? s.transfersMadeThisWeek : s.transfersMadeThisWeek + 1,
            freeTransfers: unlimitedTransfers ? s.freeTransfers : Math.max(0, s.freeTransfers - 1),
          }));
          return { ok: true };
        }

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
          transfersMadeThisWeek: unlimitedTransfers ? s.transfersMadeThisWeek : s.transfersMadeThisWeek + 1,
          freeTransfers: unlimitedTransfers ? s.freeTransfers : Math.max(0, s.freeTransfers - 1),
          captainId: s.captainId === candidate.id ? market.id : s.captainId,
          viceCaptainId: s.viceCaptainId === candidate.id ? market.id : s.viceCaptainId,
        }));

        return { ok: true, replaced: candidate.name };
      },

      removePlayer: (playerId) => {
        if (isGameweekLocked()) return;
        set((s) => ({ squad: s.squad.filter((p) => p.id !== playerId) }));
      },

      setCaptain: (playerId) => {
        if (isGameweekLocked()) return;
        const { squad, viceCaptainId } = get();
        const player = squad.find((p) => p.id === playerId);
        if (!player?.isStarting) return;
        set({
          captainId: playerId,
          // Captain and vice-captain can't be the same player.
          viceCaptainId: viceCaptainId === playerId ? null : viceCaptainId,
        });
      },

      setViceCaptain: (playerId) => {
        if (isGameweekLocked()) return;
        const { squad, captainId } = get();
        const player = squad.find((p) => p.id === playerId);
        if (!player?.isStarting || playerId === captainId) return;
        set({ viceCaptainId: playerId });
      },

      swapPlayers: (benchId, startingId) => {
        if (isGameweekLocked()) return LOCKED_FORMATION_CHECK;
        const { squad, captainId, viceCaptainId } = get();
        const benchPlayer = squad.find((p) => p.id === benchId);
        const startingPlayer = squad.find((p) => p.id === startingId);

        if (!benchPlayer || !startingPlayer) return { ok: false, reason: "Player not found" };
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
          captainId: captainId === startingId ? benchId : captainId,
          viceCaptainId: viceCaptainId === startingId ? benchId : viceCaptainId,
        });

        return { ok: true };
      },

      activateChip: (chip) => {
        if (isGameweekLocked()) return;
        const { chips, squad, captainId, viceCaptainId } = get();
        if (chips[chip] !== "available") return;
        if (Object.values(chips).some((status) => status === "active")) return; // one chip at a time

        const update: Partial<TeamState> = { chips: { ...chips, [chip]: "active" } };
        if (chip === "freeHit") {
          // Snapshot the squad so it can be restored once this gameweek ends.
          update.freeHitSnapshot = { squad, captainId, viceCaptainId };
        }
        set(update);
      },

      cancelChip: (chip) => {
        if (isGameweekLocked()) return;
        const { chips, freeHitSnapshot } = get();
        if (chips[chip] !== "active") return;

        const update: Partial<TeamState> = { chips: { ...chips, [chip]: "available" } };
        if (chip === "freeHit" && freeHitSnapshot) {
          // Backing out of Free Hit before the deadline restores the squad
          // exactly as it was before the chip was activated.
          update.squad = freeHitSnapshot.squad;
          update.captainId = freeHitSnapshot.captainId;
          update.viceCaptainId = freeHitSnapshot.viceCaptainId;
          update.freeHitSnapshot = null;
        }
        set(update);
      },

      applyFixturePoints: (results) => {
        set((s) => ({
          squad: s.squad.map((p) => {
            const match = results.find((r) => r.playerId === p.id);
            return match ? { ...p, pts: match.points.total } : p;
          }),
        }));
      },

      syncGameweek: (currentGameweek) => {
        const { lastSeenGameweek, chips, freeTransfers, freeHitSnapshot } = get();
        if (currentGameweek <= lastSeenGameweek) return;

        const rolledChips = { ...chips };
        (Object.keys(rolledChips) as ChipId[]).forEach((chip) => {
          if (rolledChips[chip] === "active") rolledChips[chip] = "used";
        });

        const update: Partial<TeamState> = {
          lastSeenGameweek: currentGameweek,
          transfersMadeThisWeek: 0,
          freeTransfers: Math.min(freeTransfers + 1, INITIAL_FREE_TRANSFERS),
          chips: rolledChips,
        };

        // Free Hit's transfers were only for this gameweek — snap the
        // squad back once it ends.
        if (chips.freeHit === "active" && freeHitSnapshot) {
          update.squad = freeHitSnapshot.squad;
          update.captainId = freeHitSnapshot.captainId;
          update.viceCaptainId = freeHitSnapshot.viceCaptainId;
          update.freeHitSnapshot = null;
        }

        set(update);
      },
    }),
    {
      name: "team-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        squad: state.squad,
        captainId: state.captainId,
        viceCaptainId: state.viceCaptainId,
        freeTransfers: state.freeTransfers,
        transfersMadeThisWeek: state.transfersMadeThisWeek,
        chips: state.chips,
        lastSeenGameweek: state.lastSeenGameweek,
        freeHitSnapshot: state.freeHitSnapshot,
      }),
    }
  )
);
