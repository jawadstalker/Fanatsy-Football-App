import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { Shirt, X } from "lucide-react-native";
import { colors, leagueColor, LEAGUES } from "@/theme/tokens";
import { getPlayerStats } from "@/data/playerStats";
import { LeagueId, Position } from "@/types";

// Minimal shape needed for the detail view — satisfied by both SquadPlayer
// (has `pts`) and MarketPlayer (doesn't; season points come from stats instead).
export interface DetailPlayer {
  id: number;
  name: string;
  club: string;
  pos: Position;
  league: LeagueId;
  price: number;
  pts?: number;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  minutes: "Minutes",
  goals: "Goals",
  assists: "Assists",
  cleanSheet: "Clean Sheet",
  cards: "Cards",
  bonus: "Bonus",
};

export function PlayerDetailModal({
  player,
  onClose,
}: {
  player: DetailPlayer | null;
  onClose: () => void;
}) {
  const visible = player !== null;
  const stats = player ? getPlayerStats(player.id) : null;
  const leagueLabel = player ? LEAGUES.find((l) => l.id === player.league)?.label : "";
  const maxLast5 = stats ? Math.max(...stats.last5, 1) : 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
        <View
          className="rounded-t-2xl px-5 pt-4 pb-8"
          style={{ backgroundColor: colors.base, maxHeight: "85%" }}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <X size={16} color={colors.muted} />
            </Pressable>
            <Text className="text-xs font-body text-muted">{leagueLabel}</Text>
          </View>

          {player && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* header */}
              <View className="items-center mb-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center border-4 mb-2"
                  style={{ backgroundColor: colors.elevated, borderColor: leagueColor(player.league) }}
                >
                  <Shirt size={32} color={colors.ink} />
                </View>
                <Text className="text-xl font-display-bold text-ink">{player.name}</Text>
                <Text className="text-sm font-body text-muted">
                  {player.club} · {player.pos}
                </Text>
              </View>

              {/* key pills */}
              <View className="flex-row gap-2 mb-5">
                <Pill label="Price" value={`€${player.price.toFixed(1)}m`} />
                <Pill label="Season Points" value={String(stats?.seasonPoints ?? player.pts ?? 0)} highlight />
                <Pill label="Form" value={stats ? (stats.last5.at(-1) ?? 0).toString() : "-"} />
              </View>

              {stats && (
                <>
                  {/* current gameweek breakdown */}
                  <Text className="text-xs font-body-medium text-muted mb-2">
                    THIS GAMEWEEK
                  </Text>
                  <View
                    className="rounded-xl border mb-5 overflow-hidden"
                    style={{ borderColor: colors.line }}
                  >
                    {Object.entries(stats.gwBreakdown).map(([key, value], i, arr) => (
                      <View
                        key={key}
                        className="flex-row justify-between items-center px-3 py-2"
                        style={{
                          backgroundColor: i % 2 === 0 ? colors.surface : colors.base,
                          borderBottomWidth: i !== arr.length - 1 ? 1 : 0,
                          borderBottomColor: colors.line,
                        }}
                      >
                        <Text className="text-xs font-body text-ink">
                          {BREAKDOWN_LABELS[key] ?? key}
                        </Text>
                        <Text
                          className="text-xs font-display-bold"
                          style={{ color: value >= 0 ? colors.gold : colors.danger }}
                        >
                          {value >= 0 ? `+${value}` : value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* last 5 gameweeks */}
                  <Text className="text-xs font-body-medium text-muted mb-2">
                    LAST 5 GAMEWEEKS
                  </Text>
                  <View className="flex-row items-end gap-2 mb-5" style={{ height: 90 }}>
                    {stats.last5.map((pts, i) => (
                      <View key={i} className="flex-1 items-center">
                        <View
                          className="w-full rounded-t-md"
                          style={{
                            height: Math.max(6, (pts / maxLast5) * 64),
                            backgroundColor: i === stats.last5.length - 1 ? colors.gold : colors.turf,
                          }}
                        />
                        <Text className="text-[10px] font-display text-muted mt-1">{pts}</Text>
                      </View>
                    ))}
                  </View>

                  {/* season stats grid */}
                  <Text className="text-xs font-body-medium text-muted mb-2">SEASON STATS</Text>
                  <View className="flex-row flex-wrap gap-2">
                    <StatBox label="Goals" value={stats.goals} />
                    <StatBox label="Assists" value={stats.assists} />
                    <StatBox label="Minutes" value={stats.minutesPlayed} />
                    <StatBox label="Clean Sheets" value={stats.cleanSheets} />
                    <StatBox label="Yellow Cards" value={stats.yellowCards} />
                    <StatBox label="Red Cards" value={stats.redCards} />
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Pill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View
      className="flex-1 rounded-lg py-2 items-center border"
      style={{ backgroundColor: colors.surface, borderColor: colors.line }}
    >
      <Text
        className="text-base font-display-bold"
        style={{ color: highlight ? colors.gold : colors.ink }}
      >
        {value}
      </Text>
      <Text className="text-[10px] font-body text-muted mt-0.5">{label}</Text>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View
      className="rounded-lg px-3 py-2 border"
      style={{ backgroundColor: colors.surface, borderColor: colors.line, width: "31%" }}
    >
      <Text className="text-sm font-display-bold text-ink">{value}</Text>
      <Text className="text-[10px] font-body text-muted">{label}</Text>
    </View>
  );
}
