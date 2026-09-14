import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SquadScreen } from "@/screens/SquadScreen";
import { TransfersScreen } from "@/screens/TransfersScreen";
import { LeagueScreen } from "@/screens/LeagueScreen";
import { TabBar } from "./TabBar";

const Tab = createBottomTabNavigator();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Squad" component={SquadScreen} />
      <Tab.Screen name="Transfers" component={TransfersScreen} />
      <Tab.Screen name="League" component={LeagueScreen} />
    </Tab.Navigator>
  );
}
