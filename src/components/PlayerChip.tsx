import React from "react";
import { View, Text, Pressable } from "react-native";
import { Star } from "lucide-react-native";
import { colors, leagueColor } from "@/theme/tokens";
import { SquadPlayer } from "@/types";

export function PlayerChip({
  p,
  isCaptain,
  isViceCaptain,
  onPressCaptain,
  onPressViceCaptain,
  onPress,
  highlight = false,
}: {
  p: SquadPlayer;
  isCaptain: boolean;
  isViceCaptain: boolean;
  onPressCaptain: () => void;
  onPressViceCaptain: () => void;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <View
      className="absolute items-center"
      style={{
        left: `${p.x ?? 50}%`,
        top: `${p.y ?? 50}%`,
        transform: [{ translateX: -21 }, { translateY: -21 }],
      }}
    >
      <View className="relative">
        <Pressable onPress={onPress} onLongPress={onPressViceCaptain}>
          <View
            className="w-[42px] h-[42px] rounded-full items-center justify-center"
            style={{
              backgroundColor: colors.elevated,
              borderWidth: 1.5,
              borderColor: highlight ? colors.gold : leagueColor(p.league),
            }}
          >
            <Text className="text-[9px] font-display-bold" style={{ color: colors.ink }}>{p.pos}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onPressCaptain}
          hitSlop={8}
          className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full items-center justify-center"
          style={{ backgroundColor: isCaptain ? colors.gold : colors.surface }}
        >
          <Star size={10} strokeWidth={1.8} color={isCaptain ? colors.base : colors.muted} fill={isCaptain ? colors.base : "transparent"} />
        </Pressable>
        {isViceCaptain && (
          <View
            className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full items-center justify-center border"
            style={{ backgroundColor: colors.surface, borderColor: colors.turf }}
          >
            <Text className="text-[8px] font-display-bold" style={{ color: colors.turf }}>
              VC
            </Text>
          </View>
        )}
      </View>
      <Pressable onPress={onPress}>
        <View className="mt-1 px-1.5 py-0.5 rounded-sm">
          <Text numberOfLines={1} className="text-[10px] font-body-medium text-ink text-center" style={{ maxWidth: 76 }}>{p.name}</Text>
        </View>
        <Text className="text-[10px] font-body-medium mt-0.5 text-center" style={{ color: colors.gold }}>
          {p.pts} pts
        </Text>
      </Pressable>
    </View>
  );
}
