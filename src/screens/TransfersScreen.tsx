import React, { useState } from "react";
import { View, Text, FlatList, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Search, Shirt, Plus, Check } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { AllLeaguesChip, LeagueChip } from "@/components/LeagueChip";
import { PlayerDetailModal, DetailPlayer } from "@/components/PlayerDetailModal";
import { colors, LEAGUES, leagueColor } from "@/theme/tokens";
import { MARKET } from "@/data/sample";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStore } from "@/store/useTeamStore";
import { LeagueId, MarketPlayer } from "@/types";

export function TransfersScreen() {
  const [active, setActive] = useState<LeagueId | "all">("all");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<DetailPlayer | null>(null);

  const live = usePlayers(active === "all" ? "epl" : active);
  const players: MarketPlayer[] = active === "all" ? MARKET : live.players;

  const addPlayer = useTeamStore((s) => s.addPlayer);
  const isInSquad = useTeamStore((s) => s.isInSquad);
  const freeTransfers = useTeamStore((s) => s.freeTransfers);

  const handleAdd = (player: MarketPlayer) => {
    const result = addPlayer(player);
    if (result.ok) {
      setFeedback(result.replaced ? `${player.name} replaced ${result.replaced}` : `${player.name} added`);
    } else if (result.reason === "budget") {
      setFeedback("Not enough budget");
    } else if (result.reason === "exists") {
      setFeedback("Already in your squad");
    } else {
      setFeedback("No slot in this position");
    }
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <View className="flex-1">
      <TopBar title="Transfer Market" sub={`${freeTransfers} free transfers remaining`} />

      {feedback && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-ink">{feedback}</Text>
        </View>
      )}

      <View className="px-4 mb-2">
        <View
          className="flex-row items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ backgroundColor: colors.surface, borderColor: colors.line }}
        >
          <Search size={14} color={colors.muted} />
          <Text className="text-xs font-body text-muted">Search player or club...</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-2"
        contentContainerStyle={{ flexDirection: "row" }}
      >
        <AllLeaguesChip active={active === "all"} onPress={() => setActive("all")} />
        {LEAGUES.map((l) => (
          <LeagueChip
            key={l.id}
            label={l.label}
            color={l.color}
            active={active === l.id}
            onPress={() => setActive(l.id)}
          />
        ))}
      </ScrollView>

      {active !== "all" && live.usingSampleData && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-muted">
            {live.error
              ? "Live data fetch failed — showing sample data"
              : "No API key set — showing sample data (see .env.example)"}
          </Text>
        </View>
      )}

      {active !== "all" && live.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.turf} />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <MarketRow
              player={item}
              inSquad={isInSquad(item.id)}
              onAdd={() => handleAdd(item)}
              onPress={() => setSelected(item)}
            />
          )}
        />
      )}

      <PlayerDetailModal player={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function MarketRow({
  player: p,
  inSquad,
  onAdd,
  onPress,
}: {
  player: MarketPlayer;
  inSquad: boolean;
  onAdd: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl px-3 py-2.5 flex-row items-center justify-between border"
      style={{ backgroundColor: colors.surface, borderColor: colors.line }}
    >
      <View className="flex-row items-center gap-2.5">
        <View
          className="w-9 h-9 rounded-full items-center justify-center border-2"
          style={{ backgroundColor: colors.elevated, borderColor: leagueColor(p.league) }}
        >
          <Shirt size={16} color={colors.ink} />
        </View>
        <View>
          <Text className="text-sm font-display text-ink">{p.name}</Text>
          <Text className="text-[11px] font-body text-muted">
            {p.club} · {p.pos}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <View>
          <Text className="text-sm font-display-bold text-right" style={{ color: colors.gold }}>
            €{p.price.toFixed(1)}m
          </Text>
          <Text className="text-[10px] font-body text-muted text-right">Form {p.form}</Text>
        </View>
        <Pressable
          onPress={onAdd}
          disabled={inSquad}
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ backgroundColor: inSquad ? colors.line : colors.turf }}
        >
          {inSquad ? <Check size={15} color={colors.muted} /> : <Plus size={15} color={colors.base} />}
        </Pressable>
      </View>
    </Pressable>
  );
}
