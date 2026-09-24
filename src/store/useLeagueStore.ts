import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as backend from "@/api/backendClient";
import { BackendTeam } from "@/types";
import { getCurrentGameweek } from "@/config/gameweek";
import { useAuthStore } from "@/store/useAuthStore";

interface LeagueState {
  managerName: string | null;
  leagueCode: string | null;
  leagueName: string | null;
  teamId: string | null;
  standings: BackendTeam[];
  loading: boolean;
  error: string | null;

  createLeague: (leagueName: string, managerName: string) => Promise<boolean>;
  joinLeague: (code: string, managerName: string) => Promise<boolean>;
  refreshStandings: () => Promise<void>;
  submitPoints: (gwPoints: number) => Promise<void>;
  leaveLeague: () => void;
}

export const useLeagueStore = create<LeagueState>()(
  persist(
    (set, get) => ({
      managerName: null,
      leagueCode: null,
      leagueName: null,
      teamId: null,
      standings: [],
      loading: false,
      error: null,

      createLeague: async (leagueName, managerName) => {
        const token = useAuthStore.getState().token;
        if (!token) { set({ error: "Please sign in first." }); return false; }
        set({ loading: true, error: null });
        try {
          const league = await backend.createLeague(leagueName, token);
          const team = await backend.joinLeague(league.code, managerName, token);
          set({
            leagueCode: league.code,
            leagueName: league.name,
            managerName,
            teamId: team.id,
            standings: [team],
            loading: false,
          });
          return true;
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
          return false;
        }
      },

      joinLeague: async (code, managerName) => {
        const token = useAuthStore.getState().token;
        if (!token) { set({ error: "Please sign in first." }); return false; }
        set({ loading: true, error: null });
        try {
          const league = await backend.getLeague(code, token);
          const team = await backend.joinLeague(code, managerName, token);
          const standings = await backend.getStandings(code, token);
          set({
            leagueCode: league.code,
            leagueName: league.name,
            managerName,
            teamId: team.id,
            standings,
            loading: false,
          });
          return true;
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
          return false;
        }
      },

      refreshStandings: async () => {
        const { leagueCode } = get();
        const token = useAuthStore.getState().token;
        if (!leagueCode || !token) return;
        set({ loading: true, error: null });
        try {
          const standings = await backend.getStandings(leagueCode, token);
          set({ standings, loading: false });
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
        }
      },

      submitPoints: async (gwPoints) => {
        const { leagueCode, teamId } = get();
        const token = useAuthStore.getState().token;
        if (!leagueCode || !teamId || !token) return;
        set({ loading: true, error: null });
        try {
          await backend.submitPoints(leagueCode, teamId, getCurrentGameweek(), gwPoints, token);
          const standings = await backend.getStandings(leagueCode, token);
          set({ standings, loading: false });
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
        }
      },

      leaveLeague: () => {
        // Only clears local membership — the team/points stay on the
        // backend in case the user rejoins with the same code.
        set({ leagueCode: null, leagueName: null, teamId: null, standings: [], error: null });
      },
    }),
    {
      name: "league-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        managerName: state.managerName,
        leagueCode: state.leagueCode,
        leagueName: state.leagueName,
        teamId: state.teamId,
      }),
    }
  )
);
