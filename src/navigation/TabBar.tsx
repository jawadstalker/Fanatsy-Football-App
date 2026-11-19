import React from "react";
import { View, Text, Pressable } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Shirt, Repeat2, Trophy, CalendarDays } from "lucide-react-native";
import { colors } from "@/theme/tokens";

const ICONS: Record<string, typeof Shirt> = {
  Squad: Shirt,
  Transfers: Repeat2,
  Fixtures: CalendarDays,
  League: Trophy,
};

const LABELS: Record<string, string> = {
  Squad: "Squad",
  Transfers: "Market",
  Fixtures: "Fixtures",
  League: "Leagues",
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View className="px-4 pt-2 pb-2" style={{ backgroundColor: colors.base }}>
      <View
        className="flex-row items-center rounded-[22px] p-1.5 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        }}
      >
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const Icon = ICONS[route.name] ?? Shirt;
          const tint = isActive ? colors.base : colors.muted;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className="flex-1 items-center justify-center rounded-2xl py-2.5"
              style={{ backgroundColor: isActive ? colors.turf : "transparent" }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={LABELS[route.name] ?? route.name}
            >
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} color={tint} />
              <Text
                className="text-[10px] mt-1"
                style={{ color: tint, fontFamily: isActive ? "Vazirmatn_700Bold" : "Vazirmatn_500Medium" }}
              >
                {LABELS[route.name] ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
