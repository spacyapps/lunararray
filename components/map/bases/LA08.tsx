"use client";

// LA-08 Imbrium — City / residential core. Night-city beauty shot: a grand
// glass park-dome at the heart, a dense ring of luminous teardrop towers
// around it, elevated walkway rings, tram lights, and a rim of pod-like
// sunlight collectors. Enterable residential interior is mounted by
// BaseScene when view.mode === "interior".

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
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

// Towers ringing the dome — two loose rings, tallest to the north.
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

// Smaller greenhouse domes on a clean ring beyond the towers.
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
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshBasicMaterial color={WARM} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Soft vertical light shafts between towers — night-city atmosphere. */
function AtmosphereBeams() {
  return (
    <group>
      {TOWERS.filter((_, i) => i % 2 === 0).map((t, i) => (
        <mesh key={i} position={[t.x, t.h * 0.45, t.z]}>
          <cylinderGeometry args={[0.4, 1.2, t.h * 0.9, 8, 1, true]} />
          <meshBasicMaterial
            color={i % 2 ? ACCENT : WARM}
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function LA08() {
  return (
    <group>
      {/* night city: faint blue moonlight key, violet rim, warmth from within */}
      <directionalLight position={[-26, 22, 30]} intensity={1.25} color="#aab8de" />
      <directionalLight position={[30, 10, -32]} intensity={1.7} color={ACCENT} />
      <pointLight position={[0, 5, 0]} intensity={90} color={PARK} distance={24} />
      <pointLight position={[0, 10, 0]} intensity={48} color={WARM} distance={40} />
      <pointLight position={[14, 6, -8]} intensity={22} color={ACCENT} distance={28} />

      <BaseEnvironment groundColor="#6e6a80" rockTint="#5c586c" seed={8} />

      {/* the park dome — green glass heart (hero glass map) */}
      <LensDome
        r={9.5}
        squash={0.5}
        color="#d2f5da"
        opacity={0.48}
        emissive={PARK}
        imageMap="/textures/dome-glass.jpg"
      />
      <WindowBand radius={9.7} position={[0, 0.5, 0]} color={WARM} thickness={0.1} />

      {/* smaller greenhouse domes ringing the outer edge */}
      {OUTER_DOMES.map((d, i) => (
        <group key={i} position={[d.x, 0, d.z]}>
          <LensDome
            r={d.r}
            squash={0.5}
            color="#d2f5da"
            opacity={0.42}
            emissive={PARK}
            imageMap={i % 2 === 0 ? "/textures/dome-glass.jpg" : undefined}
          />
          <WindowBand radius={d.r * 1.03} position={[0, 0.3, 0]} color={WARM} thickness={0.05} />
        </group>
      ))}

      {/* tower ring */}
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

      {/* sunlight collector pods around the outer rim of the base buildings */}
      <SunlightPodRing radius={30} count={14} accent={ACCENT} scale={1.05} phase={0.12} />
      {/* secondary inner ring tucked between outer domes and walkways */}
      <SunlightPodRing radius={22.5} count={8} accent={WARM} scale={0.72} phase={0.4} />

      {/* elevated walkway rings on slender pylons */}
      {(
        [
          { r: 13, y: 4.2 },
          { r: 18, y: 2.8 },
        ] as const
      ).map((ring, i) => (
        <group key={i}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ring.y, 0]}>
            <torusGeometry args={[ring.r, 0.14, 8, 96]} />
            <meshToonMaterial color={HULL} emissive={ACCENT} emissiveIntensity={0.35} />
          </mesh>
          {Array.from({ length: 8 }).map((_, j) => {
            const a = (j / 8) * Math.PI * 2 + i * 0.4;
            return (
              <mesh key={j} position={[Math.cos(a) * ring.r, ring.y / 2, Math.sin(a) * ring.r]}>
                <cylinderGeometry args={[0.05, 0.07, ring.y, 6]} />
                <meshToonMaterial color="#9aa0b4" />
              </mesh>
            );
          })}
          <Trams radius={ring.r} y={ring.y + 0.25} period={30 + i * 14} count={5 - i} />
        </group>
      ))}

      {/* plaza paths — warm spokes from the dome out between towers */}
      {[0.3, 1.4, 2.6, 3.9, 5.1].map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 16, 0.06, Math.sin(a) * 16]}
          rotation={[-Math.PI / 2, 0, -a]}
          scale={[12, 0.5, 1]}
        >
          <planeGeometry />
          <meshBasicMaterial color={WARM} transparent opacity={0.16} />
        </mesh>
      ))}

      {/* residential portal marker — soft ring at plaza, invites enter */}
      <group position={[8, 0, 6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <ringGeometry args={[1.6, 1.85, 40]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[0.35, 0.5, 24]} />
          <meshBasicMaterial color={WARM} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <Beacon color={ACCENT} size={0.18} speed={2.2} position={[0, 1.8, 0]} />
        {/* entry canopy */}
        <mesh position={[0, 1.1, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[1.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#e8d4ff"
            transparent
            opacity={0.35}
            roughness={0.15}
            metalness={0.1}
            emissive={ACCENT}
            emissiveIntensity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
