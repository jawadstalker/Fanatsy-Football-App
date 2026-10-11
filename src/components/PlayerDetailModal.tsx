import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { X } from "lucide-react-native";
import { colors, leagueColor, LEAGUES } from "@/theme/tokens";
import { getPlayerStats } from "@/data/playerStats";
import { getOfficialFplLiveStats, OfficialFplLivePlayer } from "@/api/backendClient";
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
  const [officialPlayers, setOfficialPlayers] = useState<OfficialFplLivePlayer[] | null>(null);
  const [officialGameweek, setOfficialGameweek] = useState<number | null>(null);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialError, setOfficialError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setOfficialLoading(true);
    setOfficialError(null);
    getOfficialFplLiveStats()
      .then((result) => {
        if (cancelled) return;
        setOfficialPlayers(result.players);
        setOfficialGameweek(result.gameweek);
      })
      .catch((error: unknown) => {
        if (!cancelled) setOfficialError(error instanceof Error ? error.message : "Official stats unavailable");
      })
      .finally(() => {
        if (!cancelled) setOfficialLoading(false);
      });
    return () => { cancelled = true; };
  }, [visible]);

  const normalizeName = (value: string) =>
    value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const officialMatch = player && officialPlayers
    ? (() => {
        const matches = officialPlayers.filter((item) =>
          normalizeName(item.teamName) === normalizeName(player.club) &&
          (normalizeName(item.name) === normalizeName(player.name) ||
            normalizeName(item.webName) === normalizeName(player.name))
        );
        return matches.length === 1 ? matches[0] : null;
      })()
    : null;
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
                  className="w-16 h-16 rounded-full items-center justify-center border-2 mb-3"
                  style={{ backgroundColor: colors.elevated, borderColor: leagueColor(player.league) }}
                >
                  <Text className="text-2xl font-display-bold" style={{ color: colors.ink }}>{player.pos}</Text>
                </View>
                <Text className="text-xl font-body-medium text-ink">{player.name}</Text>
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

              <Text className="text-xs font-body-medium text-muted mb-2">
                OFFICIAL FPL BONUS / BPS{officialGameweek ? " · GW" + officialGameweek : ""}
              </Text>
              <View className="rounded-xl border mb-5 px-3 py-3" style={{ borderColor: colors.line, backgroundColor: colors.surface }}>
                {officialLoading ? (
                  <Text className="text-xs font-body text-muted">Loading official FPL stats…</Text>
                ) : officialError ? (
                  <Text className="text-xs font-body text-muted">Official FPL stats unavailable. Try again later.</Text>
                ) : officialMatch ? (
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-lg font-display-bold text-ink">{officialMatch.bps ?? "—"}</Text>
                      <Text className="text-[10px] font-body text-muted">BPS</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-lg font-display-bold" style={{ color: colors.gold }}>{officialMatch.bonus ?? "—"}</Text>
                      <Text className="text-[10px] font-body text-muted">Bonus</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-display-bold text-ink">{officialMatch.totalPoints ?? "—"}</Text>
                      <Text className="text-[10px] font-body text-muted">FPL points</Text>
                    </View>
                  </View>
                ) : (
                  <Text className="text-xs font-body text-muted">
                    No unique official FPL match for this player. Values are hidden rather than guessed.
                  </Text>
                )}
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
      className="flex-1 rounded-md py-3 items-center border"
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
      className="rounded-md px-3 py-3 border"
      style={{ backgroundColor: colors.surface, borderColor: colors.line, width: "31%" }}
    >
      <Text className="text-sm font-display-bold text-ink">{value}</Text>
      <Text className="text-[10px] font-body text-muted">{label}</Text>
    </View>
  );
}
