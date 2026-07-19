"use client";

// Photoreal local-scene environment: tiled lunar regolith, detailed rocks,
// horizon haze, and a lit Earth disc in the sky (near-side bases).

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function useMapTexture(url: string, repeat = 8) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    new THREE.TextureLoader().load(url, (t) => {
      if (cancelled) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat, repeat);
      t.anisotropy = 8;
      setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [url, repeat]);
  return tex;
}

function Rocks({ seed = 1, tint = "#6a6e7a", map }: { seed?: number; tint?: string; map?: THREE.Texture | null }) {
  const rocks = useMemo(() => {
    const list: { pos: [number, number, number]; s: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < 120; i++) {
      const a = seedRand(seed * 100 + i * 3) * Math.PI * 2;
      const r = 14 + seedRand(seed * 100 + i * 3 + 1) * 70;
      const s0 = 0.15 + seedRand(seed * 100 + i * 3 + 2) ** 2 * 1.35;
      list.push({
        pos: [Math.cos(a) * r, s0 * 0.28, Math.sin(a) * r],
        s: [s0, s0 * (0.55 + seedRand(i * 5) * 0.55), s0 * (0.7 + seedRand(i * 7) * 0.5)],
        rot: [
          seedRand(seed * 100 + i * 7) * Math.PI,
          seedRand(seed * 100 + i * 11) * Math.PI,
          seedRand(seed * 100 + i * 13) * Math.PI,
        ],
      });
    }
    return list;
  }, [seed]);

  return (
    <group>
      {rocks.map((rk, i) => (
        <mesh
          key={i}
          position={rk.pos}
          rotation={rk.rot}
          scale={rk.s}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={tint}
            map={map ?? undefined}
            roughness={0.95}
            metalness={0.02}
            bumpMap={map ?? undefined}
            bumpScale={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

function Earth() {
  return (
    <group position={[-42, 52, -88]}>
      <mesh>
        <sphereGeometry args={[7.5, 64, 64]} />
        <meshStandardMaterial
          color="#2f6ad4"
          roughness={0.55}
          metalness={0.05}
          emissive="#0a2040"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* land / cloud mottling layers */}
      <mesh scale={1.003}>
        <sphereGeometry args={[7.5, 48, 48]} />
        <meshStandardMaterial
          color="#3d8a4a"
          transparent
          opacity={0.35}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.006}>
        <sphereGeometry args={[7.5, 48, 48]} />
        <meshStandardMaterial
          color="#f0f6ff"
          transparent
          opacity={0.22}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      {/* atmosphere rim */}
      <mesh scale={1.14}>
        <sphereGeometry args={[7.5, 48, 48]} />
        <meshBasicMaterial color="#7db4ff" transparent opacity={0.14} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh scale={1.22}>
        <sphereGeometry args={[7.5, 32, 32]} />
        <meshBasicMaterial color="#a8d4ff" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={8} color="#8ab4ff" distance={40} />
    </group>
  );
}

export default function BaseEnvironment({
  groundColor = "#9a9588",
  rockTint = "#7a766c",
  seed = 1,
  regolithMap = "/textures/lunar-regolith.jpg",
}: {
  groundColor?: string;
  rockTint?: string;
  seed?: number;
  regolithMap?: string;
}) {
  const regolith = useMapTexture(regolithMap, 14);
  // Darker variant for far terrain
  const farTex = useMapTexture(regolithMap, 6);

  return (
    <group>
      {/* near pad — high-res tiled regolith */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[55, 96]} />
        <meshStandardMaterial
          color={groundColor}
          map={regolith ?? undefined}
          bumpMap={regolith ?? undefined}
          bumpScale={0.12}
          roughness={0.98}
          metalness={0.02}
        />
      </mesh>
      {/* mid ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <ringGeometry args={[54, 95, 96]} />
        <meshStandardMaterial
          color={groundColor}
          map={farTex ?? undefined}
          bumpMap={farTex ?? undefined}
          bumpScale={0.1}
          roughness={1}
          metalness={0.02}
        />
      </mesh>
      {/* outer fade to space */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[94, 140, 96]} />
        <meshStandardMaterial
          color="#2a2c34"
          roughness={1}
          metalness={0}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* horizon haze */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[100, 140, 96]} />
        <meshBasicMaterial color="#05060a" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Rocks seed={seed} tint={rockTint} map={regolith} />
      <Earth />
    </group>
  );
}
