import React, { useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { ChevronUp, ChevronDown, Minus, Copy } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { LeagueSetupForm } from "@/components/LeagueSetupForm";
import { colors } from "@/theme/tokens";
import { RANKINGS } from "@/data/sample";
import { hasBackend } from "@/config/backend";
import { useLeagueStore } from "@/store/useLeagueStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useAuthStore } from "@/store/useAuthStore";
import { RankingRow, BackendTeam } from "@/types";

export function LeagueScreen() {
  if (!hasBackend()) return <SampleLeagueView />;
  return <RealLeagueView />;
}

// Shown when EXPO_PUBLIC_BACKEND_URL isn't set — same as before, but
// clearly labeled as sample data instead of pretending it's live.
function SampleLeagueView() {
  return (
    <View className="flex-1">
      <TopBar title="My League" sub="Sample leaderboard — no backend connected" />
      <View className="mx-4 rounded-xl overflow-hidden border" style={{ borderColor: colors.line }}>
        <FlatList
          data={RANKINGS}
          keyExtractor={(r) => String(r.rank)}
          renderItem={({ item, index }) => <SampleRankRow row={item} index={index} />}
        />
      </View>
    </View>
  );
}

function SampleRankRow({ row: r, index }: { row: RankingRow; index: number }) {
  const delta = r.prev - r.rank;
  return (
    <View
      className="flex-row items-center justify-between px-3 py-2.5"
      style={{
        backgroundColor: index % 2 === 0 ? colors.surface : colors.base,
        borderBottomWidth: index !== RANKINGS.length - 1 ? 1 : 0,
        borderBottomColor: colors.line,
      }}
    >
      <View className="flex-row items-center gap-3">
        <Text className="w-6 text-center text-sm font-display-bold text-ink">{r.rank}</Text>
        <View>
          <Text className="text-sm font-body text-ink">{r.name}</Text>
          <Text className="text-[10px] font-body text-muted">GW: {r.gw} pts</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-display-bold" style={{ color: colors.gold }}>
          {r.pts}
        </Text>
        {delta > 0 && <ChevronUp size={14} color={colors.turf} />}
        {delta < 0 && <ChevronDown size={14} color={colors.danger} />}
        {delta === 0 && <Minus size={14} color={colors.muted} />}
      </View>
    </View>
  );
}

// Shown when a backend is configured: real create/join flow, live
// standings, and a button to submit this gameweek's points.
function RealLeagueView() {
  const [mode, setMode] = useState<"create" | "join">("join");
  const league = useLeagueStore();
  const gameweekTotal = useTeamStore((s) => s.gameweekTotal());
  const username = useAuthStore((s) => s.username);
  const authLoading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);

  if (!useAuthStore.getState().token) {
    return <AuthLeagueView />;
  }

  if (!league.leagueCode) {
    return (
      <View className="flex-1">
        <TopBar title="My League" sub="Create or join a private league" />
        <View className="flex-row px-4 gap-2 mb-4">
          {(["join", "create"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className="flex-1 rounded-lg py-2 items-center border"
              style={{
                backgroundColor: mode === m ? colors.elevated : colors.surface,
                borderColor: mode === m ? colors.turf : colors.line,
              }}
            >
              <Text className="text-xs font-body-medium text-ink">
                {m === "join" ? "Join League" : "Create League"}
              </Text>
            </Pressable>
          ))}
        </View>
        <LeagueSetupForm
          mode={mode}
          loading={league.loading}
          error={league.error}
          onSubmit={(primaryValue, managerName) =>
            mode === "create"
              ? league.createLeague(primaryValue, managerName)
              : league.joinLeague(primaryValue.toUpperCase(), managerName)
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <TopBar title={league.leagueName ?? "My League"} sub={`Playing as ${league.managerName}`} />
      <Pressable onPress={logout} disabled={authLoading} className="mx-4 mb-3 flex-row items-center justify-center gap-2">
        <LogOut size={13} color={colors.muted} />
        <Text className="text-[11px] font-body text-muted">Sign out {username ? `(${username})` : ""}</Text>
      </Pressable>

      <Pressable
        className="mx-4 mb-3 px-3 py-2 rounded-lg flex-row items-center justify-between border"
        style={{ backgroundColor: colors.surface, borderColor: colors.line }}
      >
        <Text className="text-xs font-body text-muted">League code</Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-display-bold text-ink">{league.leagueCode}</Text>
          <Copy size={12} color={colors.muted} />
        </View>
      </Pressable>

      <Pressable
        onPress={() => league.submitPoints(gameweekTotal)}
        className="mx-4 mb-3 rounded-lg py-2.5 items-center"
        style={{ backgroundColor: colors.turf }}
      >
        <Text className="text-sm font-body-medium" style={{ color: colors.base }}>
          Submit this week's points ({gameweekTotal})
        </Text>
      </Pressable>

      {league.error && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-muted">{league.error}</Text>
        </View>
      )}

      <View className="mx-4 rounded-xl overflow-hidden border" style={{ borderColor: colors.line }}>
        <FlatList
          data={league.standings}
          keyExtractor={(t) => t.id}
          onRefresh={league.refreshStandings}
          refreshing={league.loading}
          renderItem={({ item, index }) => (
            <RealRankRow team={item} index={index} isMe={item.id === league.teamId} />
          )}
        />
      </View>

      <Pressable onPress={league.leaveLeague} className="mx-4 mt-3">
        <Text className="text-[11px] font-body text-muted text-center">Leave this league</Text>
      </Pressable>
    </View>
  );
}

function RealRankRow({ team, index, isMe }: { team: BackendTeam; index: number; isMe: boolean }) {
  return (
    <View
      className="flex-row items-center justify-between px-3 py-2.5"
      style={{
        backgroundColor: isMe ? colors.elevated : index % 2 === 0 ? colors.surface : colors.base,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <View className="flex-row items-center gap-3">
        <Text className="w-6 text-center text-sm font-display-bold text-ink">{index + 1}</Text>
        <View>
          <Text className="text-sm font-body text-ink">{team.managerName}</Text>
          <Text className="text-[10px] font-body text-muted">GW: {team.gwPoints} pts</Text>
        </View>
      </View>
      <Text className="text-sm font-display-bold" style={{ color: colors.gold }}>
        {team.totalPoints}
      </Text>
    </View>
  );
}
