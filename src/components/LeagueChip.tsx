import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/theme/tokens";

export function LeagueChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 px-3 py-2 border-b-2 mr-2"
      style={{
        backgroundColor: "transparent",
        borderColor: active ? color : colors.line,
      }}
    >
      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-body" style={{ color: active ? colors.ink : colors.muted }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AllLeaguesChip({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="px-3 py-2 border-b-2 mr-2"
      style={{
        backgroundColor: "transparent",
        borderColor: active ? colors.turf : "transparent",
      }}
    >
      <Text className="text-xs font-body" style={{ color: active ? colors.base : colors.muted }}>
        All Leagues
      </Text>
    </Pressable>
  );
}
