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
  Transfers: "Transfers",
  Fixtures: "Fixtures",
  League: "My League",
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      className="flex-row border-t"
      style={{ backgroundColor: colors.base, borderTopColor: colors.line }}
    >
      {state.routes.map((route, index) => {
        const isActive = state.index === index;
        const Icon = ICONS[route.name] ?? Shirt;
        const tint = isActive ? colors.turf : colors.muted;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            className="flex-1 items-center pt-2.5 pb-2"
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={LABELS[route.name] ?? route.name}
          >
            <View
              className="items-center justify-center mb-1"
              style={{ height: 22, width: 34, borderTopWidth: isActive ? 2 : 0, borderTopColor: colors.turf, paddingTop: isActive ? 2 : 0 }}
            >
              <Icon size={18} strokeWidth={1.7} color={tint} />
            </View>
            <Text
              className="text-[10px] font-body"
              style={{ color: tint }}
            >
              {LABELS[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
