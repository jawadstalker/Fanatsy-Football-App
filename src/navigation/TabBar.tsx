import React from "react";
import { View, Text, Pressable } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Shirt, Repeat, Trophy, Calendar } from "lucide-react-native";
import { colors } from "@/theme/tokens";

const ICONS: Record<string, typeof Shirt> = {
  Squad: Shirt,
  Transfers: Repeat,
  Fixtures: Calendar,
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
      style={{ backgroundColor: colors.surface, borderTopColor: colors.line }}
    >
      {state.routes.map((route, index) => {
        const isActive = state.index === index;
        const Icon = ICONS[route.name] ?? Shirt;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            className="flex-1 items-center gap-1 py-2.5"
          >
            <Icon size={19} color={isActive ? colors.turf : colors.muted} />
            <Text
              className="text-[10px] font-body"
              style={{ color: isActive ? colors.turf : colors.muted }}
            >
              {LABELS[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
