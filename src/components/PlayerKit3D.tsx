import React from "react";
import { View, Text } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { colors } from "@/theme/tokens";

type KitPalette = { primary: string; secondary: string; accent: string; striped: boolean };

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
const shirtGeometry = new THREE.ExtrudeGeometry(shirtShape, { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.025, bevelThickness: 0.025 });
shirtGeometry.computeVertexNormals();

function Jersey({ palette }: { palette: KitPalette }) {
  const group = React.useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.22;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh geometry={shirtGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={palette.primary} roughness={0.62} metalness={0.03} />
      </mesh>
      {palette.striped && [-0.29, -0.1, 0.1, 0.29].map((x) => (
        <mesh key={x} position={[x, -0.02, 0.17]}>
          <boxGeometry args={[0.075, 0.98, 0.018]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.68} />
        </mesh>
      ))}
      <mesh position={[0, 0.53, 0.145]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.16, 0.035, 8, 28, Math.PI * 1.65]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.5} />
      </mesh>
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
    </group>
  );
}

export function PlayerKit3D({ club, league }: { club: string; league: string }) {
  const palette = paletteForClub(club, league);
  return (
    <View style={{ height: 190, borderRadius: 16, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 16 }}>
      <Canvas camera={{ position: [0, 0, 3.3], fov: 43 }} gl={{ antialias: true }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <directionalLight position={[-3, 1, -2]} intensity={0.65} color="#8AB7FF" />
        <Jersey palette={palette} />
      </Canvas>
      <View pointerEvents="none" style={{ position: "absolute", left: 12, bottom: 10 }}>
        <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 1.5, fontWeight: "700" }}>3D KIT PREVIEW</Text>
        <Text style={{ color: colors.ink, fontSize: 11, marginTop: 2 }}>{club} · concept design</Text>
      </View>
    </View>
  );
}
