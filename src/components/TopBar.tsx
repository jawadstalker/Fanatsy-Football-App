import React from "react";
import { View, Text } from "react-native";
import { colors } from "@/theme/tokens";

export function TopBar({
  title,
  sub,
  pointsLabel = "GW Points",
  points = 0,
}: {
  title: string;
  sub?: string;
  pointsLabel?: string;
  points?: number;
}) {
  return (
    <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
      <View>
        <Text className="text-lg font-body-medium text-ink">{title}</Text>
        {sub ? <Text className="text-xs font-body text-muted">{sub}</Text> : null}
      </View>
      <View
        className="px-3 py-1.5 rounded-lg flex-row items-center gap-1 border"
        style={{ backgroundColor: colors.surface, borderColor: colors.line }}
      >
        <Text className="text-xs font-body text-muted">{pointsLabel}</Text>
        <Text className="text-base font-display-bold" style={{ color: colors.gold }}>
          {points}
        </Text>
      </View>
    </View>
  );
}
