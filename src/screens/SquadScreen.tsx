import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Wallet, RefreshCw } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { PlayerChip } from "@/components/PlayerChip";
import { DraggableBenchCard } from "@/components/DraggableBenchCard";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { colors } from "@/theme/tokens";
import { useTeamStore } from "@/store/useTeamStore";
import { useGameweekSync } from "@/hooks/useGameweekSync";
import { ChipId, SquadPlayer } from "@/types";

const PITCH_HEIGHT = 300;
const STRIPE_COUNT = 9;

const CHIP_LABELS: Record<ChipId, string> = {
  wildcard: "Wildcard",
  benchBoost: "Bench Boost",
  tripleCaptain: "Triple Captain",
  freeHit: "Free Hit",
};

export function SquadScreen() {
  const squad = useTeamStore((s) => s.squad);
  const captainId = useTeamStore((s) => s.captainId);
  const viceCaptainId = useTeamStore((s) => s.viceCaptainId);
  const setCaptain = useTeamStore((s) => s.setCaptain);
  const setViceCaptain = useTeamStore((s) => s.setViceCaptain);
  const removePlayer = useTeamStore((s) => s.removePlayer);
  const swapPlayers = useTeamStore((s) => s.swapPlayers);
  const bank = useTeamStore((s) => s.bank());
  const squadValue = useTeamStore((s) => s.squadValue());
  const gameweekTotal = useTeamStore((s) => s.gameweekTotal());
  const chips = useTeamStore((s) => s.chips);
  const activateChip = useTeamStore((s) => s.activateChip);
  const cancelChip = useTeamStore((s) => s.cancelChip);
  const locked = useTeamStore((s) => s.isLocked());

  const { sync, syncing, error } = useGameweekSync();
  const [dismissedError, setDismissedError] = useState(false);
  const [selected, setSelected] = useState<SquadPlayer | null>(null);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const pitchRef = useRef<View>(null);

  const starting = squad.filter((p) => p.isStarting);
  const bench = squad.filter((p) => !p.isStarting);

  const handleSwapAttempt = (benchId: number, startingId: number) => {
    const result = swapPlayers(benchId, startingId);
    if (!result.ok) {
      setSubMessage(result.reason ?? "That swap isn't allowed");
      setTimeout(() => setSubMessage(null), 2500);
    }
  };

  const handleChipPress = (chip: ChipId) => {
    if (chips[chip] === "active") cancelChip(chip);
    else if (chips[chip] === "available") activateChip(chip);
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <TopBar title="Squad" sub={`${squad.length}/15 players`} points={gameweekTotal} />

      <View className="px-4 flex-row items-center gap-2 mb-2">
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
          <Wallet size={13} color={colors.turf} />
          <Text className="text-xs font-body text-ink">
            Bank: <Text className="font-display">€{bank.toFixed(1)}m</Text>
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
          <Text className="text-xs font-body text-ink">
            Value: <Text className="font-display">€{squadValue.toFixed(1)}m</Text>
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setDismissedError(false);
            sync();
          }}
          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: colors.elevated }}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.turf} />
          ) : (
            <RefreshCw size={13} color={colors.turf} />
          )}
          <Text className="text-xs font-body text-ink">Points</Text>
        </Pressable>
      </View>

      {error && !dismissedError && (
        <Pressable
          onPress={() => setDismissedError(true)}
          className="mx-4 mb-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: colors.elevated }}
        >
          <Text className="text-[11px] font-body text-muted">{error}</Text>
        </Pressable>
      )}
      {subMessage && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-muted">{subMessage}</Text>
        </View>
      )}
      {locked && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-muted">
            Gameweek is locked — transfers, captaincy, and chips reopen next gameweek
          </Text>
        </View>
      )}

      <View className="px-4 flex-row gap-2 mb-2">
        {(Object.keys(chips) as ChipId[]).map((chip) => {
          const status = chips[chip];
          return (
            <Pressable
              key={chip}
              onPress={() => handleChipPress(chip)}
              disabled={locked || status === "used"}
              className="flex-1 rounded-lg py-1.5 items-center border"
              style={{
                backgroundColor: status === "active" ? colors.turf : colors.surface,
                borderColor: status === "active" ? colors.turf : colors.line,
                opacity: status === "used" ? 0.4 : 1,
              }}
            >
              <Text
                className="text-[10px] font-body-medium"
                style={{ color: status === "active" ? colors.base : colors.ink }}
              >
                {CHIP_LABELS[chip]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="text-xs font-body text-muted mx-4 mb-1.5">
        Tap a player for details · star sets captain · long-press sets vice-captain
      </Text>
      <View
        ref={pitchRef}
        collapsable={false}
        className="mx-4 rounded-xl overflow-hidden relative"
        style={{ height: PITCH_HEIGHT }}
      >
        <View className="absolute inset-0 flex-col">
          {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
            <View
              key={i}
              style={{ flex: 1, backgroundColor: i % 2 === 0 ? colors.turf : colors.turfDim }}
            />
          ))}
        </View>
        <View
          className="absolute left-0 right-0"
          style={{ top: "50%", height: 1.5, backgroundColor: "rgba(255,255,255,0.35)" }}
        />
        <View
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "50%",
            width: 90,
            height: 90,
            marginLeft: -45,
            marginTop: -45,
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.35)",
          }}
        />
        {starting.map((p) => (
          <PlayerChip
            key={p.id}
            p={p}
            isCaptain={p.id === captainId}
            isViceCaptain={p.id === viceCaptainId}
            onPressCaptain={() => setCaptain(p.id)}
            onPressViceCaptain={() => setViceCaptain(p.id)}
            onPress={() => setSelected(p)}
          />
        ))}
      </View>

      <View className="px-4 mt-3">
        <Text className="text-xs font-body text-muted mb-1.5">
          Bench · drag onto the pitch to substitute, tap for details
        </Text>
        <View className="flex-row gap-2">
          {bench.map((p) => (
            <DraggableBenchCard
              key={p.id}
              player={p}
              starting={starting}
              pitchRef={pitchRef}
              onSwapAttempt={handleSwapAttempt}
              onRemove={() => removePlayer(p.id)}
              onOpenDetail={() => setSelected(p)}
            />
          ))}
        </View>
      </View>

      <PlayerDetailModal player={selected} onClose={() => setSelected(null)} />
    </ScrollView>
  );
}
