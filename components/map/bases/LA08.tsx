"use client";

// LA-08 Imbrium — City / residential core. Photoreal night-city: glass park
// dome, luminous residential towers, elevated walkways, rim sunlight
// collector pods. Enterable apartment is mounted by BaseScene in interior mode.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import BaseLighting from "./BaseLighting";
import DomeGarden from "./DomeGarden";
import {
  Beacon,
  LensDome,
  SunlightPodRing,
  Teardrop,
  WindowBand,
  seedRand,
  teardropRadiusAt,
} from "./parts";

const ACCENT = "#c48aff";
const HULL = "#eef2f7";
const WARM = "#ffd9a0";
const PARK = "#9be8b0";

const TOWERS: { x: number; z: number; h: number; r: number }[] = [
  { x: 0, z: -14, h: 17, r: 3 },
  { x: 11, z: -9, h: 13, r: 2.4 },
  { x: 15, z: 2, h: 10, r: 2.2 },
  { x: 10, z: 12, h: 12, r: 2.4 },
  { x: -2, z: 15, h: 9, r: 2 },
  { x: -12, z: 10, h: 13.5, r: 2.5 },
  { x: -16, z: -1, h: 11, r: 2.2 },
  { x: -10, z: -11, h: 14.5, r: 2.6 },
  { x: 20, z: -6, h: 7.5, r: 1.7 },
  { x: -20, z: 7, h: 8, r: 1.8 },
];

const OUTER_DOME_COUNT = 8;
const OUTER_DOME_RADIUS = 26;
const OUTER_DOMES: { x: number; z: number; r: number }[] = Array.from(
  { length: OUTER_DOME_COUNT },
  (_, i) => {
    const a = (i / OUTER_DOME_COUNT) * Math.PI * 2 + 0.3;
    return {
      x: Math.cos(a) * OUTER_DOME_RADIUS,
      z: Math.sin(a) * OUTER_DOME_RADIUS,
      r: 2.1 + seedRand(i * 11 + 5) * 1.4,
    };
  },
);

function Trams({ radius, y, period, count }: { radius: number; y: number; period: number; count: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = (clock.getElapsedTime() / period) * Math.PI * 2;
  });
  return (
    <group ref={group} position={[0, y, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={WARM} emissive={WARM} emissiveIntensity={1.4} roughness={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

function AtmosphereBeams() {
  // Three shafts only — full ring was pure fillrate cost at night.
  const picks = [0, 3, 6];
  return (
    <group>
      {picks.map((idx, i) => {
        const t = TOWERS[idx];
        return (
          <mesh key={i} position={[t.x, t.h * 0.45, t.z]}>
            <cylinderGeometry args={[0.35, 1.0, t.h * 0.85, 10, 1, true]} />
            <meshBasicMaterial
              color={i % 2 ? ACCENT : WARM}
              transparent
              opacity={0.045}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function LA08() {
  return (
    <group>
      <BaseLighting
        keyPos={[-28, 36, 32]}
        keyColor="#c8d4f0"
        keyIntensity={2.4}
        fillPos={[32, 14, -28]}
        fillColor={ACCENT}
        fillIntensity={1.25}
        ambient={0.12}
        contact
      />
      {/* Two practicals max — was three high-intensity point lights */}
      <pointLight position={[0, 7, 0]} intensity={70} color={PARK} distance={26} decay={2} />
      <pointLight position={[12, 8, -6]} intensity={28} color={WARM} distance={32} decay={2} />

      <BaseEnvironment groundColor="#8a8694" rockTint="#6e6a78" seed={8} />

      {/* Central park dome — glass over photoreal vegetation */}
      <DomeGarden radius={9.5} y={0.06} />
      <LensDome
        r={9.5}
        squash={0.5}
        color="#d2f5da"
        opacity={0.38}
        emissive={PARK}
        imageMap="/textures/dome-glass.jpg"
      />
      <WindowBand radius={9.7} position={[0, 0.5, 0]} color={WARM} thickness={0.1} />

      {OUTER_DOMES.map((d, i) => (
        <group key={i} position={[d.x, 0, d.z]}>
          <DomeGarden radius={d.r} y={0.05} />
          <LensDome
            r={d.r}
            squash={0.5}
            color="#d2f5da"
            opacity={0.36}
            emissive={PARK}
            imageMap="/textures/dome-glass.jpg"
          />
          <WindowBand radius={d.r * 1.03} position={[0, 0.3, 0]} color={WARM} thickness={0.05} />
        </group>
      ))}

      {TOWERS.map((t, i) => (
        <group
          key={i}
          position={[t.x, 0, t.z]}
          rotation={[0, 0, (seedRand(i * 13 + 3) - 0.5) * 0.06]}
        >
          <Teardrop height={t.h} radius={t.r} color={HULL} variant="residential" />
          {[0.22, 0.4, 0.58].map((f, j) => (
            <WindowBand
              key={j}
              radius={teardropRadiusAt(t.h, t.r, t.h * f)}
              position={[0, t.h * f, 0]}
              color={j === 2 && i % 3 === 0 ? ACCENT : WARM}
              thickness={0.06}
            />
          ))}
          {i % 4 === 0 && (
            <Beacon color={ACCENT} size={0.14} speed={1.6 + i * 0.3} position={[0, t.h + 0.4, 0]} />
          )}
        </group>
      ))}

      <AtmosphereBeams />

      {/* Outer rim collectors (design req) + leaner inner ring */}
      <SunlightPodRing radius={30} count={12} accent={ACCENT} scale={1.1} phase={0.12} />
      <SunlightPodRing radius={22.5} count={6} accent={WARM} scale={0.75} phase={0.4} />

      {(
        [
          { r: 13, y: 4.2 },
          { r: 18, y: 2.8 },
        ] as const
      ).map((ring, i) => (
        <group key={i}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ring.y, 0]} castShadow>
            <torusGeometry args={[ring.r, 0.16, 12, 128]} />
            <meshStandardMaterial
              color={HULL}
              emissive={ACCENT}
              emissiveIntensity={0.4}
              metalness={0.55}
              roughness={0.32}
            />
          </mesh>
          {Array.from({ length: 8 }).map((_, j) => {
            const a = (j / 8) * Math.PI * 2 + i * 0.4;
            return (
              <mesh key={j} position={[Math.cos(a) * ring.r, ring.y / 2, Math.sin(a) * ring.r]} castShadow>
                <cylinderGeometry args={[0.06, 0.08, ring.y, 10]} />
                <meshStandardMaterial color="#9aa0b4" metalness={0.5} roughness={0.4} />
              </mesh>
            );
          })}
          <Trams radius={ring.r} y={ring.y + 0.25} period={30 + i * 14} count={5 - i} />
        </group>
      ))}

      {[0.3, 1.4, 2.6, 3.9, 5.1].map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 16, 0.06, Math.sin(a) * 16]}
          rotation={[-Math.PI / 2, 0, -a]}
          scale={[12, 0.5, 1]}
          receiveShadow
        >
          <planeGeometry />
          <meshStandardMaterial color={WARM} transparent opacity={0.18} emissive={WARM} emissiveIntensity={0.2} />
        </mesh>
      ))}

      {/* residential portal */}
      <group position={[8, 0, 6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <ringGeometry args={[1.6, 1.85, 48]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.9} transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[0.35, 0.5, 32]} />
          <meshStandardMaterial color={WARM} emissive={WARM} emissiveIntensity={1.1} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <Beacon color={ACCENT} size={0.18} speed={2.2} position={[0, 1.8, 0]} />
        <mesh position={[0, 1.1, 0]} scale={[1, 0.55, 1]} castShadow>
          <sphereGeometry args={[1.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#e8d4ff"
            transparent
            opacity={0.4}
            roughness={0.1}
            metalness={0.08}
            transmission={0.4}
            thickness={0.5}
            emissive={ACCENT}
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
