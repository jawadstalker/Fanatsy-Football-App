import React from "react";
import { View, Text, Pressable } from "react-native";
import { Star } from "lucide-react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors, leagueColor } from "@/theme/tokens";
import { SquadPlayer } from "@/types";

type KitColors = { primary: string; secondary: string; striped?: boolean };

function getKitColors(club: string, league: string): KitColors {
  const name = club.toLowerCase();
  if (name.includes("arsenal")) return { primary: "#D71920", secondary: "#FFFFFF" };
  if (name.includes("chelsea")) return { primary: "#034694", secondary: "#FFFFFF" };
  if (name.includes("liverpool")) return { primary: "#C8102E", secondary: "#FFFFFF" };
  if (name.includes("manchester city") || name.includes("man city")) return { primary: "#6CABDD", secondary: "#FFFFFF" };
  if (name.includes("manchester united") || name.includes("man united")) return { primary: "#DA291C", secondary: "#FBE122" };
  if (name.includes("tottenham")) return { primary: "#132257", secondary: "#FFFFFF" };
  if (name.includes("real madrid")) return { primary: "#F7F7F7", secondary: "#D7C18C" };
  if (name.includes("barcelona")) return { primary: "#A50044", secondary: "#004D98", striped: true };
  if (name.includes("juventus")) return { primary: "#F7F7F7", secondary: "#181818", striped: true };
  if (name.includes("bayern")) return { primary: "#DC052D", secondary: "#FFFFFF", striped: true };
  if (name.includes("paris") || name.includes("psg")) return { primary: "#004170", secondary: "#E30613" };
  return { primary: leagueColor(league), secondary: "#FFFFFF", striped: true };
}

function KitBadge({ club, league, position }: { club: string; league: string; position: string }) {
  const kit = getKitColors(club, league);
  return (
    <View className="w-[42px] h-[42px] items-center justify-center">
      <Svg width={38} height={34} viewBox="0 0 44 40">
        <Path d="M12 5 L18 2 Q22 5 26 2 L32 5 L42 13 L35 21 L30 17 L31 37 L13 37 L14 17 L9 21 L2 13 Z" fill={kit.primary} stroke={colors.ink} strokeOpacity={0.7} strokeWidth={1.2} />
        {kit.striped && <Path d="M17 5 L20 4 L20 36 L17 36 Z M24 4 L27 5 L27 36 L24 36 Z" fill={kit.secondary} />}
        <Path d="M18 3 Q22 9 26 3" fill="none" stroke={kit.secondary} strokeWidth={2.4} />
        <Rect x="19" y="17" width="6" height="8" rx="1" fill={kit.secondary} fillOpacity={0.9} />
      </Svg>
      <Text style={{ position: "absolute", bottom: 7, color: kit.primary === "#F7F7F7" ? "#111111" : colors.ink, fontSize: 7, fontWeight: "900" }}>{position}</Text>
    </View>
  );
}

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
            className="w-[46px] h-[46px] rounded-xl items-center justify-center"
            style={{
              backgroundColor: "rgba(13,21,18,0.78)",
              borderWidth: highlight ? 2 : 1,
              borderColor: highlight ? colors.gold : leagueColor(p.league),
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 3,
            }}
          >
            <KitBadge club={p.club} league={p.league} position={p.pos} />
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
