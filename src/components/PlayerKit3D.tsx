import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { colors } from "@/theme/tokens";

type KitPattern = "solid" | "stripes";
type KitPalette = { primary: string; secondary: string; accent: string; striped: boolean };

const COLOR_OPTIONS = [
  { name: "Club", value: "club" },
  { name: "Red", value: "#C8102E" },
  { name: "Blue", value: "#1768AC" },
  { name: "White", value: "#F5F5F0" },
  { name: "Black", value: "#202522" },
  { name: "Green", value: "#287A4B" },
  { name: "Gold", value: "#D7A936" },
  { name: "Purple", value: "#6938A5" },
];

function paletteForClub(club: string, league: string): KitPalette {
  const name = club.toLowerCase();
  if (name.includes("arsenal")) return { primary: "#D71920", secondary: "#F7F3F0", accent: "#D4AF37", striped: false };
  if (name.includes("chelsea")) return { primary: "#034694", secondary: "#FFFFFF", accent: "#D8B45A", striped: false };
  if (name.includes("liverpool")) return { primary: "#C8102E", secondary: "#F6F1E8", accent: "#D4B46A", striped: false };
  if (name.includes("manchester city") || name.includes("man city")) return { primary: "#6CABDD", secondary: "#FFFFFF", accent: "#1C2C5B", striped: false };
  if (name.includes("manchester united") || name.includes("man united")) return { primary: "#DA291C", secondary: "#FBE122", accent: "#111111", striped: false };
  if (name.includes("tottenham")) return { primary: "#132257", secondary: "#FFFFFF", accent: "#8FA8CF", striped: false };
  if (name.includes("real madrid")) return { primary: "#F7F7F7", secondary: "#D7C18C", accent: "#9D7B35", striped: false };
  if (name.includes("barcelona")) return { primary: "#A50044", secondary: "#004D98", accent: "#EDBB00", striped: true };
  if (name.includes("juventus")) return { primary: "#F7F7F7", secondary: "#181818", accent: "#D2B15C", striped: true };
  if (name.includes("bayern")) return { primary: "#DC052D", secondary: "#FFFFFF", accent: "#0066B2", striped: true };
  if (name.includes("paris") || name.includes("psg")) return { primary: "#004170", secondary: "#E30613", accent: "#FFFFFF", striped: false };
  const fallback: Record<string, string> = {
    epl: "#3267B2",
    laliga: "#E34B36",
    seriea: "#1D5FA7",
    bundesliga: "#D51F31",
    ligue1: "#294B8E",
  };
  return { primary: fallback[league] ?? colors.turf, secondary: "#F2F3ED", accent: colors.gold, striped: true };
}

const shirtShape = new THREE.Shape();
shirtShape.moveTo(-0.43, 0.64);
shirtShape.lineTo(-0.72, 0.48);
shirtShape.lineTo(-0.94, 0.13);
shirtShape.lineTo(-0.72, -0.02);
shirtShape.lineTo(-0.55, 0.19);
shirtShape.lineTo(-0.52, -0.68);
shirtShape.quadraticCurveTo(0, -0.76, 0.52, -0.68);
shirtShape.lineTo(0.55, 0.19);
shirtShape.lineTo(0.72, -0.02);
shirtShape.lineTo(0.94, 0.13);
shirtShape.lineTo(0.72, 0.48);
shirtShape.lineTo(0.43, 0.64);
shirtShape.quadraticCurveTo(0, 0.52, -0.43, 0.64);
const shirtGeometry = new THREE.ExtrudeGeometry(shirtShape, {
  depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1,
  bevelSize: 0.025, bevelThickness: 0.025,
});
shirtGeometry.computeVertexNormals();

function Jersey({
  palette, pattern, backView, autoRotate,
}: {
  palette: KitPalette; pattern: KitPattern; backView: boolean; autoRotate: boolean;
}) {
  const group = React.useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    if (autoRotate) group.current.rotation.y += delta * 0.22;
    else group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y, backView ? Math.PI : 0, 5, delta,
    );
  });

  return (
    <group ref={group}>
      <mesh geometry={shirtGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={palette.primary} roughness={0.62} metalness={0.03} />
      </mesh>
      {pattern === "stripes" && [-0.29, -0.1, 0.1, 0.29].map((x) => (
        <mesh key={x} position={[x, -0.02, 0.17]}>
          <boxGeometry args={[0.075, 0.98, 0.018]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.68} />
        </mesh>
      ))}
      <mesh position={[0, 0.53, 0.145]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.16, 0.035, 8, 28, Math.PI * 1.65]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.5} />
      </mesh>
      {!backView ? (
        <>
          <mesh position={[-0.27, 0.39, 0.17]}>
            <circleGeometry args={[0.065, 24]} />
            <meshStandardMaterial color={palette.accent} roughness={0.4} />
          </mesh>
          <mesh position={[0.22, 0.37, 0.17]}>
            <boxGeometry args={[0.12, 0.035, 0.012]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.12, 0.18]}>
            <boxGeometry args={[0.19, 0.035, 0.012]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.21, 0.18]}>
            <boxGeometry args={[0.13, 0.025, 0.012]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.55} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.05, -0.17]}>
            <boxGeometry args={[0.22, 0.32, 0.012]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.36, -0.17]}>
            <boxGeometry args={[0.38, 0.035, 0.012]} />
            <meshStandardMaterial color={palette.accent} roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function PlayerKit3D({ club, league }: { club: string; league: string }) {
  const clubPalette = useMemo(() => paletteForClub(club, league), [club, league]);
  const [primary, setPrimary] = useState("club");
  const [secondary, setSecondary] = useState("club");
  const [pattern, setPattern] = useState<KitPattern>(clubPalette.striped ? "stripes" : "solid");
  const [backView, setBackView] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const resolveColor = (value: string, fallback: string) => value === "club" ? fallback : value;
  const palette: KitPalette = {
    ...clubPalette,
    primary: resolveColor(primary, clubPalette.primary),
    secondary: resolveColor(secondary, clubPalette.secondary),
    striped: pattern === "stripes",
  };

  const colorButton = (option: { name: string; value: string }, target: "primary" | "secondary") => {
    const selected = target === "primary" ? primary : secondary;
    const color = option.value === "club"
      ? target === "primary" ? clubPalette.primary : clubPalette.secondary
      : option.value;
    return (
      <Pressable
        key={option.value}
        onPress={() => target === "primary" ? setPrimary(option.value) : setSecondary(option.value)}
        accessibilityRole="button"
        accessibilityLabel={`${target} color: ${option.name}`}
        style={{
          width: 27, height: 27, borderRadius: 14, backgroundColor: color,
          borderWidth: selected === option.value ? 3 : 1,
          borderColor: selected === option.value ? colors.gold : colors.line,
          marginRight: 8, alignItems: "center", justifyContent: "center",
        }}
      >
        {selected === option.value && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color === "#F5F5F0" || color === "#FFFFFF" ? "#222" : "#FFF" }} />}
      </Pressable>
    );
  };

  return (
    <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 16 }}>
      <View style={{ height: 185 }}>
        <Canvas camera={{ position: [0, 0, 3.3], fov: 43 }} gl={{ antialias: true }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} />
          <directionalLight position={[-3, 1, -2]} intensity={0.65} color="#8AB7FF" />
          <Jersey palette={palette} pattern={pattern} backView={backView} autoRotate={autoRotate} />
        </Canvas>
        <View pointerEvents="none" style={{ position: "absolute", left: 12, bottom: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 1.5, fontWeight: "700" }}>3D KIT EDITOR</Text>
          <Text style={{ color: colors.ink, fontSize: 11, marginTop: 2 }}>{club} · concept design</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <Pressable onPress={() => { setBackView(false); setAutoRotate(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: !backView && !autoRotate ? colors.turfDim : colors.elevated, alignItems: "center" }}>
            <Text style={{ color: colors.ink, fontSize: 11, fontWeight: "600" }}>Front</Text>
          </Pressable>
          <Pressable onPress={() => { setBackView(true); setAutoRotate(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: backView && !autoRotate ? colors.turfDim : colors.elevated, alignItems: "center" }}>
            <Text style={{ color: colors.ink, fontSize: 11, fontWeight: "600" }}>Back</Text>
          </Pressable>
          <Pressable onPress={() => setAutoRotate((value) => !value)} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: autoRotate ? colors.turfDim : colors.elevated, alignItems: "center" }}>
            <Text style={{ color: colors.ink, fontSize: 11, fontWeight: "600" }}>{autoRotate ? "Pause spin" : "Auto spin"}</Text>
          </Pressable>
        </View>

        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 7 }}>PRIMARY COLOR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {COLOR_OPTIONS.map((option) => colorButton(option, "primary"))}
          </View>
        </ScrollView>

        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 7 }}>SECONDARY COLOR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {COLOR_OPTIONS.map((option) => colorButton(option, "secondary"))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["solid", "stripes"] as KitPattern[]).map((item) => (
            <Pressable key={item} onPress={() => setPattern(item)} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: pattern === item ? colors.turfDim : colors.elevated, borderWidth: 1, borderColor: pattern === item ? colors.turf : colors.line, alignItems: "center" }}>
              <Text style={{ color: colors.ink, fontSize: 11, fontWeight: "600" }}>{item === "solid" ? "Solid" : "Vertical stripes"}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => { setPrimary("club"); setSecondary("club"); setPattern(clubPalette.striped ? "stripes" : "solid"); setBackView(false); setAutoRotate(true); }} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.line, alignItems: "center" }}>
            <Text style={{ color: colors.gold, fontSize: 11, fontWeight: "600" }}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
