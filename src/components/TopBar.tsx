import React from "react";
import { View, Text } from "react-native";
import { Activity, Sparkles } from "lucide-react-native";
import { colors } from "@/theme/tokens";

export function TopBar({
  title,
  sub,
  pointsLabel = "GW POINTS",
  points,
}: {
  title: string;
  sub?: string;
  pointsLabel?: string;
  points?: number;
}) {
  return (
    <View className="px-5 pt-5 pb-5 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.turf }} />
          <Text className="text-[9px] font-body-medium tracking-[2px]" style={{ color: colors.muted }}>
            MATCHDAY · FANTASY MANAGER
          </Text>
        </View>
        <Text className="text-[26px] font-display-bold text-ink">{title}</Text>
        {sub ? (
          <Text className="text-xs font-body text-muted mt-0.5" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {points !== undefined ? (
        <View
          className="rounded-2xl px-3.5 py-2.5 border items-end"
          style={{ backgroundColor: colors.elevated, borderColor: colors.line, minWidth: 88 }}
        >
          <View className="flex-row items-center gap-1">
            <Activity size={11} color={colors.turf} />
            <Text className="text-[9px] font-body-medium" style={{ color: colors.muted }}>
              {pointsLabel}
            </Text>
          </View>
          <Text className="text-[26px] font-display-bold mt-0.5" style={{ color: colors.turf }}>
            {points}
          </Text>
        </View>
      ) : (
        <View className="w-10 h-10 rounded-2xl items-center justify-center border" style={{ backgroundColor: colors.elevated, borderColor: colors.line }}>
          <Sparkles size={18} color={colors.turf} />
        </View>
      )}
    </View>
  );
}
