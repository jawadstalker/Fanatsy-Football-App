import React from "react";
import { View, Text } from "react-native";
import { colors } from "@/theme/tokens";

export function TopBar({
  title,
  sub,
  pointsLabel = "GW points",
  points = 0,
}: {
  title: string;
  sub?: string;
  pointsLabel?: string;
  points?: number;
}) {
  return (
    <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-xl font-display-bold text-ink">{title}</Text>
        {sub ? (
          <Text className="text-xs font-body text-muted mt-0.5" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      <View
        className="pl-3 border-l items-end"
        style={{ borderLeftColor: colors.line }}
      >
        <Text className="text-[10px] font-body text-muted">{pointsLabel}</Text>
        <Text className="text-xl font-display-bold mt-0.5" style={{ color: colors.gold }}>
          {points}
        </Text>
      </View>
    </View>
  );
}
