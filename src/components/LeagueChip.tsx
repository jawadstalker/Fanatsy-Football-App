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
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border mr-2"
      style={{
        backgroundColor: active ? colors.elevated : colors.surface,
        borderColor: active ? color : colors.line,
      }}
    >
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
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
      className="px-3 py-1.5 rounded-full border mr-2"
      style={{
        backgroundColor: active ? colors.turf : colors.surface,
        borderColor: active ? colors.turf : colors.line,
      }}
    >
      <Text className="text-xs font-body" style={{ color: active ? colors.base : colors.muted }}>
        All Leagues
      </Text>
    </Pressable>
  );
}
