import React, { useState } from "react";
import { View, Text, FlatList, ScrollView, ActivityIndicator } from "react-native";
import { TopBar } from "@/components/TopBar";
import { LeagueChip } from "@/components/LeagueChip";
import { colors, LEAGUES } from "@/theme/tokens";
import { useLeagueFixtures } from "@/hooks/useLeagueFixtures";
import { Fixture, LeagueId } from "@/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function FixturesScreen() {
  const [league, setLeague] = useState<LeagueId>("epl");
  const { fixtures, loading, error, usingSampleData } = useLeagueFixtures(league);

  return (
    <View className="flex-1">
      <TopBar title="Fixtures" sub="Recent results and upcoming matches" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-2"
        contentContainerStyle={{ flexDirection: "row" }}
      >
        {LEAGUES.map((l) => (
          <LeagueChip
            key={l.id}
            label={l.label}
            color={l.color}
            active={league === l.id}
            onPress={() => setLeague(l.id)}
          />
        ))}
      </ScrollView>

      {usingSampleData && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-muted">
            {error ? "Live data fetch failed — showing sample fixtures" : "No API key set — showing sample fixtures"}
          </Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.turf} />
        </View>
      ) : (
        <FlatList
          data={fixtures}
          keyExtractor={(f) => String(f.id)}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}
          renderItem={({ item }) => <FixtureRow fixture={item} />}
        />
      )}
    </View>
  );
}

function FixtureRow({ fixture: f }: { fixture: Fixture }) {
  const played = f.status === "finished";
  const live = f.status === "live";

  return (
    <View
      className="rounded-xl px-3 py-3 border"
      style={{ backgroundColor: colors.surface, borderColor: live ? colors.gold : colors.line }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-[10px] font-body text-muted">{formatDate(f.date)}</Text>
        {live && (
          <Text className="text-[10px] font-display-bold" style={{ color: colors.gold }}>
            LIVE
          </Text>
        )}
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-display text-ink flex-1" numberOfLines={1}>
          {f.homeTeam}
        </Text>
        {played || live ? (
          <Text className="text-base font-display-bold mx-3" style={{ color: colors.gold }}>
            {f.homeGoals} - {f.awayGoals}
          </Text>
        ) : (
          <Text className="text-xs font-display text-muted mx-3">{formatTime(f.date)}</Text>
        )}
        <Text className="text-sm font-display text-ink flex-1 text-right" numberOfLines={1}>
          {f.awayTeam}
        </Text>
      </View>
    </View>
  );
}
