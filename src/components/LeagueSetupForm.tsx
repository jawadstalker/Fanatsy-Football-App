import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { colors } from "@/theme/tokens";

export function LeagueSetupForm({
  mode,
  loading,
  error,
  onSubmit,
}: {
  mode: "create" | "join";
  loading: boolean;
  error: string | null;
  onSubmit: (primaryValue: string, managerName: string) => void;
}) {
  const [primaryValue, setPrimaryValue] = useState("");
  const [managerName, setManagerName] = useState("");

  const canSubmit = primaryValue.trim().length > 0 && managerName.trim().length > 0 && !loading;

  return (
    <View className="px-4">
      <Text className="text-xs font-body text-muted mb-1">
        {mode === "create" ? "League name" : "League code"}
      </Text>
      <TextInput
        value={primaryValue}
        onChangeText={setPrimaryValue}
        placeholder={mode === "create" ? "e.g. Office League" : "e.g. A1B2C3"}
        placeholderTextColor={colors.muted}
        autoCapitalize={mode === "create" ? "words" : "characters"}
        className="rounded-lg px-3 py-2.5 mb-3 border font-body"
        style={{ backgroundColor: colors.surface, borderColor: colors.line, color: colors.ink }}
      />

      <Text className="text-xs font-body text-muted mb-1">Your manager name</Text>
      <TextInput
        value={managerName}
        onChangeText={setManagerName}
        placeholder="e.g. Alex"
        placeholderTextColor={colors.muted}
        className="rounded-lg px-3 py-2.5 mb-3 border font-body"
        style={{ backgroundColor: colors.surface, borderColor: colors.line, color: colors.ink }}
      />

      {error && <Text className="text-[11px] font-body text-danger mb-2">{error}</Text>}

      <Pressable
        onPress={() => onSubmit(primaryValue.trim(), managerName.trim())}
        disabled={!canSubmit}
        className="rounded-lg py-2.5 items-center"
        style={{ backgroundColor: canSubmit ? colors.turf : colors.line }}
      >
        {loading ? (
          <ActivityIndicator color={colors.base} />
        ) : (
          <Text className="text-sm font-body-medium" style={{ color: colors.base }}>
            {mode === "create" ? "Create League" : "Join League"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
