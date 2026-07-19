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
  CraterDomeSite,
  type CraterDomeKind,
  GlassTaperTower,
  LensDome,
  SunlightPodRing,
  PrefabTransitTube,
  WindowBand,
  seedRand,
} from "./parts";

const ACCENT = "#c48aff";
/** Warm glass — multiplies the fluted facade. */
const HULL = "#f5f0ea";
const WARM = "#ffd9a0";
const PARK = "#9be8b0";
const ORE = "#e8a050";

const TOWERS: { x: number; z: number; h: number; r: number }[] = [
  { x: 0, z: -14, h: 17, r: 3 },
  { x: 11, z: -9, h: 13, r: 2.4 },
  { x: 15, z: 2, h: 10, r: 2.2 },
  { x: 10, z: 12, h: 12, r: 2.4 },
  { x: -2, z: 15, h: 9, r: 2 },
  { x: -12, z: 10, h: 13.5, r: 2.5 },
  { x: -16, z: -1, h: 11, r: 2.2 },
  { x: -10, z: -11, h: 14.5, r: 2.6 },
  { x: 20, z: -6, h: 7.5, r: 1.7 }, // smallest — retractable silo tower
  { x: -20, z: 7, h: 8, r: 1.8 },
];
const SMALLEST_TOWER_I = TOWERS.reduce(
  (best, t, i, arr) => (t.h < arr[best]!.h ? i : best),
  0,
);

// Outer crater sites: gardens need dug bowls for protection; mix of live
// greenhouses, frames still under construction, and one mineral claim.
const OUTER_DOME_COUNT = 8;
const OUTER_DOME_RADIUS = 26;
// Index 2 & 6: construction; 4: mineral; rest: garden
const OUTER_KINDS: CraterDomeKind[] = [
  "garden",
  "garden",
  "construction",
  "garden",
  "mineral",
  "garden",
  "construction",
  "garden",
];
const OUTER_DOMES: { x: number; z: number; r: number; kind: CraterDomeKind }[] = Array.from(
  { length: OUTER_DOME_COUNT },
  (_, i) => {
    const a = (i / OUTER_DOME_COUNT) * Math.PI * 2 + 0.3;
    return {
      x: Math.cos(a) * OUTER_DOME_RADIUS,
      z: Math.sin(a) * OUTER_DOME_RADIUS,
      r: 2.1 + seedRand(i * 11 + 5) * 1.4,
      kind: OUTER_KINDS[i] ?? "garden",
    };
  },
);

// Secondary crater cluster farther out — other digs on the plain
const FAR_CRATERS: { x: number; z: number; r: number; kind: CraterDomeKind }[] = [
  { x: 38, z: -18, r: 2.8, kind: "construction" },
  { x: -36, z: 22, r: 3.1, kind: "mineral" },
  { x: 32, z: 28, r: 2.4, kind: "garden" },
  { x: -30, z: -32, r: 2.6, kind: "construction" },
];

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

/**
 * Classified retractable tower: slowly submerges so only ~20% remains above
 * the regolith, then rises again. Collar marks the silo mouth.
 */
function RetractableTower({
  x,
  z,
  h,
  r,
  seed,
}: {
  x: number;
  z: number;
  h: number;
  r: number;
  seed: number;
}) {
  const body = useRef<THREE.Group>(null);
  const topScale = 0.72 + seedRand(seed) * 0.1;
  // Sink so 20% of height remains above y=0 → translate by -0.8*h
  const maxSink = h * 0.8;

  useFrame(({ clock }) => {
    if (!body.current) return;
    // Slow cycle: dwell up, sink, dwell down, rise (~28s full loop)
    const t = (clock.elapsedTime * 0.12) % (Math.PI * 2);
    // smoothstep-like via sin for ease in/out
    const s = 0.5 - 0.5 * Math.cos(t); // 0→1→0
    // Hold longer at extremes: reshape s
    const hold = Math.pow(s, 0.65);
    body.current.position.y = -maxSink * hold;
  });

  return (
    <group position={[x, 0, z]}>
      {/* Silo collar / blast ring at grade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
        <ringGeometry args={[r * 1.05, r * 1.45, 32]} />
        <meshStandardMaterial color="#4a4658" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[r * 1.35, r * 1.55, 32]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      {/* Dark pit below grade (visible when tower sinks) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[r * 1.02, 28]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.95} />
      </mesh>

      <group ref={body}>
        <GlassTaperTower
          height={h}
          radius={r * 1.05}
          topScale={topScale}
          color={HULL}
          seed={seed}
        />
        <Beacon color={ACCENT} size={0.1} speed={2.4} position={[0, h + 0.14, 0]} />
      </group>
    </group>
  );
}

/** Prefab modular transit: coupler-segmented tubes hub→dome + ring + far feeders. */
function DomeTransitNetwork() {
  const hub: [number, number, number] = [0, 0.28, 0];
  const y = 0.22;

  return (
    <group>
      {/* Hub terminal — mating flange plate for spoke sections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} receiveShadow>
        <circleGeometry args={[2.4, 32]} />
        <meshStandardMaterial color="#3a3848" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <ringGeometry args={[2.2, 2.55, 32]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      {/* Hub coupling ports (prefab attach points) */}
      {OUTER_DOMES.map((d, i) => {
        const a = Math.atan2(d.z, d.x);
        return (
          <mesh
            key={`port-${i}`}
            position={[Math.cos(a) * 2.35, 0.28, Math.sin(a) * 2.35]}
            rotation={[0, -a, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.2, 0.22, 0.18, 12]} />
            <meshStandardMaterial color="#9a94a8" metalness={0.6} roughness={0.3} emissive={ACCENT} emissiveIntensity={0.25} />
          </mesh>
        );
      })}

      {/* Spokes — modular prefab bays */}
      {OUTER_DOMES.map((d, i) => {
        const mid: [number, number, number] = [d.x * 0.55, y + 0.35, d.z * 0.55];
        const end: [number, number, number] = [d.x * 0.92, y, d.z * 0.92];
        return (
          <PrefabTransitTube
            key={`spoke-${i}`}
            pts={[hub, mid, end]}
            r={0.14}
            color="#c8c4d8"
            emissive={i % 2 === 0 ? ACCENT : WARM}
            segmentLen={2.6}
          />
        );
      })}

      {/* Ring connectors between adjacent outer domes */}
      {OUTER_DOMES.map((d, i) => {
        const next = OUTER_DOMES[(i + 1) % OUTER_DOMES.length]!;
        const a0 = Math.atan2(d.z, d.x);
        const a1 = Math.atan2(next.z, next.x);
        let midA = (a0 + a1) / 2;
        if (Math.abs(a1 - a0) > Math.PI) midA += Math.PI;
        const rr = OUTER_DOME_RADIUS * 0.94;
        const mid: [number, number, number] = [
          Math.cos(midA) * rr,
          y + 0.2,
          Math.sin(midA) * rr,
        ];
        return (
          <PrefabTransitTube
            key={`ring-${i}`}
            pts={[
              [d.x * 0.92, y, d.z * 0.92],
              mid,
              [next.x * 0.92, y, next.z * 0.92],
            ]}
            r={0.1}
            color="#b0a8c0"
            emissive={ACCENT}
            segmentLen={2.2}
          />
        );
      })}

      {/* Feeder tubes to far crater sites */}
      {FAR_CRATERS.map((d, i) => {
        let best = OUTER_DOMES[0]!;
        let bestD = Infinity;
        for (const o of OUTER_DOMES) {
          const dd = (o.x - d.x) ** 2 + (o.z - d.z) ** 2;
          if (dd < bestD) {
            bestD = dd;
            best = o;
          }
        }
        const mid: [number, number, number] = [
          (best.x + d.x) * 0.5,
          y + 0.5,
          (best.z + d.z) * 0.5,
        ];
        return (
          <PrefabTransitTube
            key={`far-link-${i}`}
            pts={[
              [best.x * 0.95, y, best.z * 0.95],
              mid,
              [d.x * 0.9, y, d.z * 0.9],
            ]}
            r={0.11}
            color="#a8a0b8"
            emissive={d.kind === "mineral" ? ORE : WARM}
            segmentLen={2.8}
          />
        );
      })}

      {/* Cargo pods on alternating spokes */}
      {OUTER_DOMES.filter((_, i) => i % 2 === 0).map((d, i) => (
        <mesh key={`pod-${i}`} position={[d.x * 0.5, y + 0.45, d.z * 0.5]} castShadow>
          <capsuleGeometry args={[0.16, 0.35, 4, 8]} />
          <meshStandardMaterial color={WARM} emissive={WARM} emissiveIntensity={0.5} roughness={0.35} metalness={0.4} />
        </mesh>
      ))}
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

      {/* Central park dome — sealed garden in a dug bowl (protection) */}
      <CraterDomeSite
        radius={9.5}
        kind="garden"
        seed={1}
        accent={ACCENT}
        warm={WARM}
        garden={
          <>
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
          </>
        }
      />

      {/* Outer crater ring: live gardens, builds in progress, one mineral dig */}
      {OUTER_DOMES.map((d, i) => (
        <CraterDomeSite
          key={`outer-${i}`}
          position={[d.x, 0, d.z]}
          radius={d.r}
          kind={d.kind}
          seed={i * 17 + 3}
          accent={ACCENT}
          warm={WARM}
          ore={ORE}
          garden={
            <>
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
            </>
          }
        />
      ))}

      {/* Farther craters on the plain — more sites under the same program */}
      {FAR_CRATERS.map((d, i) => (
        <CraterDomeSite
          key={`far-${i}`}
          position={[d.x, 0, d.z]}
          radius={d.r}
          kind={d.kind}
          seed={i * 31 + 9}
          accent={ACCENT}
          warm={WARM}
          ore={ORE}
          garden={
            <>
              <DomeGarden radius={d.r} y={0.05} />
              <LensDome
                r={d.r}
                squash={0.5}
                color="#d2f5da"
                opacity={0.34}
                emissive={PARK}
                imageMap="/textures/dome-glass.jpg"
              />
              <WindowBand radius={d.r * 1.03} position={[0, 0.28, 0]} color={WARM} thickness={0.05} />
            </>
          }
        />
      ))}

      {TOWERS.map((t, i) => {
        if (i === SMALLEST_TOWER_I) {
          return (
            <RetractableTower
              key={i}
              x={t.x}
              z={t.z}
              h={t.h}
              r={t.r}
              seed={i * 41 + 7}
            />
          );
        }
        const topScale = 0.72 + seedRand(i * 17 + 2) * 0.1;
        return (
          <group key={i} position={[t.x, 0, t.z]}>
            <GlassTaperTower
              height={t.h}
              radius={t.r * 1.05}
              topScale={topScale}
              color={HULL}
              seed={i * 41 + 7}
            />
            {i % 4 === 0 && (
              <Beacon
                color={ACCENT}
                size={0.1}
                speed={1.6 + i * 0.3}
                position={[0, t.h + 0.14, 0]}
              />
            )}
          </group>
        );
      })}

      <AtmosphereBeams />

      {/* Transit: pressurized tubes hub ↔ crater domes ↔ far sites */}
      <DomeTransitNetwork />

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
