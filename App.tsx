import "./global.css";
import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { RootTabs } from "@/navigation/RootTabs";
import { useAppFonts } from "@/theme/useAppFonts";
import { colors } from "@/theme/tokens";
import { useTeamStore } from "@/store/useTeamStore";
import { CURRENT_GAMEWEEK } from "@/config/gameweek";

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.base,
    card: colors.surface,
    border: colors.line,
    primary: colors.turf,
    text: colors.ink,
  },
};

export default function App() {
  const fontsLoaded = useAppFonts();
  const syncGameweek = useTeamStore((s) => s.syncGameweek);

  useEffect(() => {
    syncGameweek(CURRENT_GAMEWEEK);
  }, [syncGameweek]);

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.base }}
        onLayout={onLayout}
      >
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <View style={{ flex: 1, backgroundColor: colors.base }}>
            <RootTabs />
          </View>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
