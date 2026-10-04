import React, { useState } from "react";
import { View, Text, TextInput, FlatList, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Search, Plus, Check, ArrowLeftRight, Wallet } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { AllLeaguesChip, LeagueChip } from "@/components/LeagueChip";
import { PlayerDetailModal, DetailPlayer } from "@/components/PlayerDetailModal";
import { colors, LEAGUES, leagueColor } from "@/theme/tokens";
import { MARKET } from "@/data/sample";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStore } from "@/store/useTeamStore";
import { useLeagueStore } from "@/store/useLeagueStore";
import { useAuthStore } from "@/store/useAuthStore";
import * as backend from "@/api/backendClient";
import { getBackendUrl } from "@/config/backend";
import { LeagueId, MarketPlayer } from "@/types";

export function TransfersScreen() {
  const [active, setActive] = useState<LeagueId | "all">("all");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<DetailPlayer | null>(null);
  const [outgoingId, setOutgoingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<"ALL" | "GK" | "DEF" | "MID" | "FWD">("ALL");

  const live = usePlayers(active === "all" ? "epl" : active);
  const players: MarketPlayer[] = (active === "all" ? MARKET : live.players).filter((player) =>
    (position === "ALL" || player.pos === position) &&
    `${player.name} ${player.club}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const addPlayer = useTeamStore((s) => s.addPlayer);
  const isInSquad = useTeamStore((s) => s.isInSquad);
  const squad = useTeamStore((s) => s.squad);
  const freeTransfers = useTeamStore((s) => s.freeTransfers);
  const chips = useTeamStore((s) => s.chips);
  const squadValue = useTeamStore((s) => s.squadValue());
  const bank = useTeamStore((s) => s.bank());
  const unlimitedTransfers = chips.wildcard === "active" || chips.freeHit === "active";
  const outgoingPlayer = squad.find((p) => p.id === outgoingId);
  const locked = useTeamStore((s) => s.isLocked());
  const leagueCode = useLeagueStore((s) => s.leagueCode);
  const teamId = useLeagueStore((s) => s.teamId);
  const token = useAuthStore((s) => s.token);
  const [transferring, setTransferring] = useState(false);

  const handleAdd = async (player: MarketPlayer) => {
    if (locked) {
      setFeedback("Gameweek is locked — transfers reopen next gameweek");
      return;
    }
    if (isInSquad(player.id)) {
      setFeedback("This player is already in your squad");
      return;
    }
    if (squad.length >= 15) {
      if (outgoingId == null || !outgoingPlayer) {
        setFeedback("Select a player to sell first");
        return;
      }
      if (outgoingPlayer.pos !== player.pos) {
        setFeedback("Choose a player in the same position");
        return;
      }
      const clubCount = squad.filter((p) =>
        p.id !== outgoingPlayer.id &&
        (p.clubId ?? p.club) === (player.clubId ?? player.club)
      ).length;
      if (clubCount >= 3) {
        setFeedback("You can select a maximum of 3 players from one club");
        return;
      }
      const availableBudget = bank + outgoingPlayer.price;
      if (player.price > availableBudget + 0.0001) {
        setFeedback(`Not enough budget · €${availableBudget.toFixed(1)}m available`);
        return;
      }
    } else if (player.price > bank + 0.0001) {
      setFeedback(`Not enough budget · €${bank.toFixed(1)}m available`);
      return;
    }
    if (getBackendUrl() && squad.length >= 15) {
      if (!leagueCode || !teamId || !token || outgoingId == null) {
        setFeedback("Join a private league and select a player to sell first");
        return;
      }
      setTransferring(true);
      try {
        await backend.submitTransfer(
          leagueCode,
          teamId,
          outgoingId,
          { id: player.id, clubId: player.clubId, club: player.club, pos: player.pos, price: player.price, league: player.league },
          token
        );
      } catch (error) {
        setFeedback((error as Error).message || "Transfer failed on server");
        setTransferring(false);
        return;
      }
    }
    const result = addPlayer(player, outgoingId ?? undefined);
    setTransferring(false);
    if (result.ok) {
      setFeedback(result.replaced ? `${player.name} replaced ${result.replaced}` : `${player.name} added`);
      setOutgoingId(null);
    } else if (result.reason === "budget") {
      setFeedback("Not enough budget");
    } else if (result.reason === "exists") {
      setFeedback("Already in your squad");
    } else if (result.reason === "locked") {
      setFeedback("Gameweek is locked — transfers reopen next gameweek");
    } else {
      setFeedback("No slot in this position");
    }
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <View className="flex-1">
      <TopBar title="Transfer Market" sub={`${freeTransfers} free transfer${freeTransfers === 1 ? "" : "s"} remaining`} />

      <View className="mx-4 mb-3 rounded-lg border px-3 py-3" style={{ backgroundColor: colors.surface, borderColor: colors.line }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-body text-muted">AVAILABLE BUDGET</Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <Wallet size={14} color={colors.muted} strokeWidth={1.7} />
              <Text className="text-base font-display-bold text-ink">€{bank.toFixed(1)}m</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-body text-muted">SQUAD VALUE</Text>
            <Text className="text-base font-display-bold text-ink mt-1">€{squadValue.toFixed(1)}m</Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-body text-muted">NEXT TRANSFER</Text>
            <Text className="text-base font-display-bold mt-1" style={{ color: unlimitedTransfers || freeTransfers > 0 ? colors.turf : colors.gold }}>
              {unlimitedTransfers ? "Free" : freeTransfers > 0 ? "Free" : "-4 pts"}
            </Text>
          </View>
        </View>
      </View>

      {locked && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-muted">
            Gameweek is locked — transfers reopen once this gameweek ends
          </Text>
        </View>
      )}

      {feedback && (
        <View className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.elevated }}>
          <Text className="text-[11px] font-body text-ink">{feedback}</Text>
        </View>
      )}

      {squad.length >= 15 && (
        <View className="mx-4 mb-3 px-3 py-3 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.line }}>
          <View className="flex-row items-center gap-2 mb-2">
            <ArrowLeftRight size={14} color={colors.turf} />
            <Text className="text-xs font-body-medium text-ink">Transfer out</Text>
            <Text className="text-[10px] font-body text-muted ml-auto">{outgoingId == null ? "Choose a player" : "1 selected"}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {squad.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setOutgoingId(outgoingId === p.id ? null : p.id)}
                className="px-3 py-2 rounded-md border"
                style={{
                  backgroundColor: outgoingId === p.id ? colors.elevated : colors.base,
                  borderColor: outgoingId === p.id ? colors.turf : colors.line,
                }}
              >
                <Text className="text-[11px] font-body-medium text-ink">{p.name}</Text>
                <Text className="text-[9px] font-body text-muted">{p.pos} · €{p.price.toFixed(1)}m</Text>
              </Pressable>
            ))}
          </ScrollView>
          {outgoingPlayer ? (
            <View className="mt-3 pt-3 border-t flex-row items-center justify-between" style={{ borderTopColor: colors.line }}>
              <View>
                <Text className="text-[10px] font-body text-muted">SELLING</Text>
                <Text className="text-xs font-body-medium text-ink mt-0.5">{outgoingPlayer.name}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-body text-muted">BUDGET AFTER SALE</Text>
                <Text className="text-xs font-display-bold mt-0.5" style={{ color: colors.turf }}>€{(bank + outgoingPlayer.price).toFixed(1)}m</Text>
              </View>
              <Pressable onPress={() => setOutgoingId(null)} accessibilityRole="button" accessibilityLabel="Clear selected player" className="px-2 py-1">
                <Text className="text-[11px] font-body-medium" style={{ color: colors.muted }}>Clear</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      <View className="px-4 mb-2">
        <View
          className="flex-row items-center gap-2 px-3 py-3 rounded-lg border"
          style={{ backgroundColor: colors.surface, borderColor: colors.line }}
        >
          <Search size={14} color={colors.muted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search players or clubs" placeholderTextColor={colors.muted} autoCapitalize="none" className="flex-1 text-sm font-body" style={{ color: colors.ink, padding: 0 }} />
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 18, paddingBottom: 10 }}>
        {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((pos) => {
          const isActive = position === pos;
          return (
            <Pressable key={pos} onPress={() => setPosition(pos)} className="pb-2 border-b-2" style={{ borderBottomColor: isActive ? colors.turf : "transparent" }}>
              <Text className="text-xs font-body-medium" style={{ color: isActive ? colors.turf : colors.muted }}>
                {pos === "ALL" ? "All positions" : pos}
              </Text>
            </Pressable>
          );
        })}
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
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-sm font-body-medium text-ink">No players found</Text>
              <Text className="text-xs font-body text-muted mt-1">Try another name or club.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <MarketRow
              player={item}
              inSquad={isInSquad(item.id)}
              locked={locked || transferring}
              transferring={transferring}
              outgoingId={outgoingId}
              canReplace={outgoingId !== null && squad.some((p) => p.id === outgoingId && p.pos === item.pos)}
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
  locked,
  transferring,
  outgoingId,
  canReplace,
  onAdd,
  onPress,
}: {
  player: MarketPlayer;
  inSquad: boolean;
  locked: boolean;
  transferring: boolean;
  outgoingId: number | null;
  canReplace: boolean;
  onAdd: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="px-1 py-3 flex-row items-center justify-between border-b"
      style={{ backgroundColor: colors.base, borderColor: colors.line }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-1 h-9 rounded-full" style={{ backgroundColor: leagueColor(p.league) }} />
        <View>
          <Text className="text-sm font-body-medium text-ink">{p.name}</Text>
          <Text className="text-[11px] font-body text-muted">
            {p.club} · {p.pos}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3 ml-2">
        <View>
          <Text className="text-sm font-display-bold text-right" style={{ color: colors.gold }}>
            €{p.price.toFixed(1)}m
          </Text>
          <Text className="text-[10px] font-body text-muted text-right">Form {p.form}</Text>
        </View>
        <Pressable
          onPress={onAdd}
          disabled={inSquad || locked || (outgoingId !== null && !canReplace)}
          className="w-8 h-8 rounded-md items-center justify-center"
          style={{ backgroundColor: inSquad || locked || transferring || (outgoingId !== null && !canReplace) ? colors.line : colors.turf }}
        >
          {inSquad ? <Check size={15} color={colors.muted} /> : transferring ? <ActivityIndicator size="small" color={colors.base} /> : <Plus size={15} color={locked || (outgoingId !== null && !canReplace) ? colors.muted : colors.base} />}
        </Pressable>
      </View>
    </Pressable>
  );
}
