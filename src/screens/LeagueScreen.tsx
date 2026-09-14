import React from "react";
import { View, Text, FlatList } from "react-native";
import { ChevronUp, ChevronDown, Minus } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { colors } from "@/theme/tokens";
import { RANKINGS } from "@/data/sample";
import { RankingRow } from "@/types";

export function LeagueScreen() {
  return (
    <View className="flex-1">
      <TopBar title="My League" sub="Friends League · 12 members" />

      <View className="mx-4 rounded-xl overflow-hidden border" style={{ borderColor: colors.line }}>
        <FlatList
          data={RANKINGS}
          keyExtractor={(r) => String(r.rank)}
          renderItem={({ item, index }) => <RankRow row={item} index={index} />}
        />
      </View>
    </View>
  );
}

function RankRow({ row: r, index }: { row: RankingRow; index: number }) {
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
