import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { colors } from "@/theme/tokens";

export function AuthForm({
  mode,
  loading,
  error,
  onSubmit,
}: {
  mode: "login" | "register";
  loading: boolean;
  error: string | null;
  onSubmit: (username: string, password: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = username.trim().length >= 3 && password.length >= 6 && !loading;

  return (
    <View className="px-5">
      <Text className="text-xs font-body-medium text-muted mb-1.5">Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Choose a username"
        placeholderTextColor={colors.muted}
        className="rounded-lg px-3.5 py-3 mb-4 border font-body"
        style={{ backgroundColor: colors.surface, borderColor: colors.line, color: colors.ink }}
        returnKeyType="next"
      />

      <Text className="text-xs font-body-medium text-muted mb-1.5">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="At least 6 characters"
        placeholderTextColor={colors.muted}
        className="rounded-lg px-3.5 py-3 mb-3 border font-body"
        style={{ backgroundColor: colors.surface, borderColor: colors.line, color: colors.ink }}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (canSubmit) onSubmit(username.trim(), password);
        }}
      />

      {error ? (
        <Text className="text-xs font-body mb-3" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={() => onSubmit(username.trim(), password)}
        disabled={!canSubmit}
        className="rounded-lg py-3 items-center"
        style={{ backgroundColor: canSubmit ? colors.turf : colors.line }}
      >
        {loading ? (
          <ActivityIndicator color={colors.base} />
        ) : (
          <Text className="text-sm font-body-medium" style={{ color: canSubmit ? colors.base : colors.muted }}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Text>
        )}
      </Pressable>

      <Text className="text-[11px] font-body text-muted mt-3 text-center">
        {mode === "login" ? "Use your account details to continue." : "Use at least 3 characters for your username and 6 for your password."}
      </Text>
    </View>
  );
}
