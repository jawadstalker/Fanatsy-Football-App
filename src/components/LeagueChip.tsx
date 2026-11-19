import React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
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
      className="flex-row items-center gap-2 px-3.5 py-2 rounded-full mr-2 border"
      style={{
        backgroundColor: active ? colors.elevated : colors.surface,
        borderColor: active ? color : colors.line,
      }}
    >
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-body-medium" style={{ color: active ? colors.ink : colors.muted }}>
        {label}
      </Text>
      {active && <Check size={12} color={color} />}
    </Pressable>
  );
}

export function AllLeaguesChip({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="px-3.5 py-2 rounded-full mr-2 border"
      style={{
        backgroundColor: active ? colors.elevated : colors.surface,
        borderColor: active ? colors.turf : colors.line,
      }}
    >
      <Text className="text-xs font-body-medium" style={{ color: active ? colors.turf : colors.muted }}>
        All Leagues
      </Text>
    </Pressable>
  );
}
