import React, { useRef, useState } from "react";
import { View, Text, Pressable, Animated, PanResponder } from "react-native";
import { Shirt, X } from "lucide-react-native";
import { colors, leagueColor } from "@/theme/tokens";
import { SquadPlayer } from "@/types";

interface PitchBox {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

const TAP_MAX_DISTANCE = 8;
const TAP_MAX_DURATION_MS = 300;

export function DraggableBenchCard({
  player,
  starting,
  pitchRef,
  onSwapAttempt,
  onRemove,
  onOpenDetail,
}: {
  player: SquadPlayer;
  starting: SquadPlayer[];
  pitchRef: React.RefObject<View>;
  onSwapAttempt: (benchId: number, startingId: number) => void;
  onRemove: () => void;
  onOpenDetail: () => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const grant = useRef({ t: 0 });
  const pitchBox = useRef<PitchBox | null>(null);
  // Keep a live ref to `starting` so the release handler (created once by
  // PanResponder.create) always sees the current positions, not a stale
  // closure from whenever the responder was first built.
  const startingRef = useRef(starting);
  startingRef.current = starting;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        grant.current.t = Date.now();
        setDragging(true);
        pitchRef.current?.measure((_fx, _fy, width, height, pageX, pageY) => {
          pitchBox.current = { pageX, pageY, width, height };
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_evt, gesture) => {
        setDragging(false);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();

        const distance = Math.hypot(gesture.dx, gesture.dy);
        const elapsed = Date.now() - grant.current.t;
        if (distance < TAP_MAX_DISTANCE && elapsed < TAP_MAX_DURATION_MS) {
          onOpenDetail();
          return;
        }

        const box = pitchBox.current;
        if (!box) return;

        const inside =
          gesture.moveX >= box.pageX &&
          gesture.moveX <= box.pageX + box.width &&
          gesture.moveY >= box.pageY &&
          gesture.moveY <= box.pageY + box.height;
        if (!inside) return;

        const relX = ((gesture.moveX - box.pageX) / box.width) * 100;
        const relY = ((gesture.moveY - box.pageY) / box.height) * 100;

        let nearest: SquadPlayer | null = null;
        let best = Infinity;
        for (const sp of startingRef.current) {
          const dx = (sp.x ?? 50) - relX;
          const dy = (sp.y ?? 50) - relY;
          const d = dx * dx + dy * dy;
          if (d < best) {
            best = d;
            nearest = sp;
          }
        }
        if (nearest) onSwapAttempt(player.id, nearest.id);
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      className="flex-1 rounded-lg px-2 py-2 items-center border relative"
      style={{
        backgroundColor: colors.surface,
        borderColor: dragging ? colors.gold : colors.line,
        borderWidth: dragging ? 2 : 1,
        transform: pan.getTranslateTransform(),
        zIndex: dragging ? 50 : 1,
        elevation: dragging ? 8 : 0,
      }}
    >
      <Pressable
        onPress={onRemove}
        hitSlop={6}
        className="absolute top-1 right-1 w-4 h-4 rounded-full items-center justify-center"
        style={{ backgroundColor: colors.elevated }}
      >
        <X size={10} color={colors.muted} />
      </Pressable>
      <View
        className="w-7 h-7 rounded-full items-center justify-center border-2 mb-1"
        style={{ backgroundColor: colors.elevated, borderColor: leagueColor(player.league) }}
      >
        <Shirt size={13} color={colors.ink} />
      </View>
      <Text className="text-[10px] font-display text-ink text-center">{player.name}</Text>
    </Animated.View>
  );
}
