import React from "react";
import { View, Text, Pressable } from "react-native";
import { Shirt, Star } from "lucide-react-native";
import { colors, leagueColor } from "@/theme/tokens";
import { SquadPlayer } from "@/types";

export function PlayerChip({
  p,
  isCaptain,
  onPressCaptain,
  onPress,
  highlight = false,
}: {
  p: SquadPlayer;
  isCaptain: boolean;
  onPressCaptain: () => void;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <View
      className="absolute items-center"
      style={{
        left: `${p.x ?? 50}%`,
        top: `${p.y ?? 50}%`,
        transform: [{ translateX: -18 }, { translateY: -18 }],
      }}
    >
      <View className="relative">
        <Pressable onPress={onPress}>
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: colors.elevated,
              borderWidth: 2,
              borderColor: highlight ? colors.gold : leagueColor(p.league),
            }}
          >
            <Shirt size={16} color={colors.ink} />
          </View>
        </Pressable>
        <Pressable
          onPress={onPressCaptain}
          hitSlop={8}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
          style={{ backgroundColor: isCaptain ? colors.gold : colors.surface }}
        >
          <Star size={10} color={isCaptain ? colors.base : colors.muted} fill={isCaptain ? colors.base : "transparent"} />
        </Pressable>
      </View>
      <Pressable onPress={onPress}>
        <View className="mt-1 px-1.5 py-0.5 rounded bg-surface">
          <Text className="text-[10px] font-display text-ink">{p.name}</Text>
        </View>
        <Text className="text-[10px] font-display-bold mt-0.5 text-center" style={{ color: colors.gold }}>
          {p.pts} pts
        </Text>
      </Pressable>
    </View>
  );
}
