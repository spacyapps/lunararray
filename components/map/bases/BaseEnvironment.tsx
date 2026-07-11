"use client";

// Shared local-scene environment: regolith ground disc, scattered rocks,
// horizon haze, and the Earth hanging in the sky (we're on the near side —
// it never moves). Each base scene sits on top of this at the origin.

import { useMemo } from "react";
import * as THREE from "three";

function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Rocks({ seed = 1, tint = "#6a6e7a" }: { seed?: number; tint?: string }) {
  const rocks = useMemo(() => {
    const list: { pos: [number, number, number]; s: number; rot: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const a = seedRand(seed * 100 + i * 3) * Math.PI * 2;
      const r = 14 + seedRand(seed * 100 + i * 3 + 1) * 66;
      const s = 0.12 + seedRand(seed * 100 + i * 3 + 2) ** 2 * 1.1;
      list.push({
        pos: [Math.cos(a) * r, s * 0.35, Math.sin(a) * r],
        s,
        rot: seedRand(seed * 100 + i * 7) * Math.PI,
      });
    }
    return list;
  }, [seed]);
  return (
    <group>
      {rocks.map((rk, i) => (
        <mesh key={i} position={rk.pos} rotation={[rk.rot, rk.rot * 2.3, 0]} scale={rk.s}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={tint} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Earth() {
  return (
    <group position={[-38, 46, -78]}>
      <mesh>
        <sphereGeometry args={[6, 48, 48]} />
        <meshStandardMaterial color="#3d6fd6" roughness={0.6} />
      </mesh>
      {/* crude cloud/land mottling */}
      <mesh scale={1.002}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshStandardMaterial color="#e8f2ff" transparent opacity={0.28} roughness={1} />
      </mesh>
      {/* atmosphere glow */}
      <mesh scale={1.12}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color="#7db4ff" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

export default function BaseEnvironment({
  groundColor = "#7c8090",
  rockTint = "#6a6e7a",
  seed = 1,
}: {
  groundColor?: string;
  rockTint?: string;
  seed?: number;
}) {
  return (
    <group>
      {/* regolith ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[120, 72]} />
        <meshStandardMaterial color={groundColor} roughness={1} />
      </mesh>
      {/* horizon haze ring — cheap depth cue at the disc edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[95, 120, 72]} />
        <meshBasicMaterial color="#05060a" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <Rocks seed={seed} tint={rockTint} />
      <Earth />
    </group>
  );
}
