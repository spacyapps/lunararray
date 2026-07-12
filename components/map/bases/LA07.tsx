"use client";

// LA-07 Procellarum — City expansion zone. The drama is the frontier line:
// a warm, lived-in quarter of teardrop towers on one side, and the same
// silhouettes as bare skeletal frames marching into the dark on the other,
// with glowing growth-ring roads radiating past them. Sunset key from the
// finished side; the frontier reads by rim light alone.

import BaseEnvironment from "./BaseEnvironment";
import { Beacon, Teardrop, WindowBand, seedRand, teardropRadiusAt } from "./parts";

const ACCENT = "#ff8a5c";
const WARM = "#ffd9a0";
const GREEN = "#2ea86a";

// Finished towers (west side)
const BUILT: { x: number; z: number; h: number; r: number }[] = [
  { x: -14, z: -2, h: 15, r: 3 },
  { x: -20, z: 6, h: 10.5, r: 2.3 },
  { x: -9, z: 6.5, h: 12, r: 2.5 },
  { x: -17, z: -10, h: 8.5, r: 2 },
  { x: -7, z: -8, h: 10, r: 2.1 },
];

// Skeletal frames (east side) — same species, unborn
const FRAMES: { x: number; z: number; h: number; r: number }[] = [
  { x: 7, z: -3, h: 12, r: 2.5 },
  { x: 14, z: 5, h: 9, r: 2 },
  { x: 12, z: -12, h: 10.5, r: 2.2 },
  { x: 21, z: -4, h: 7.5, r: 1.8 },
];

export default function LA07() {
  return (
    <group>
      {/* sunset key raking in from the built west, cool night fill east */}
      <directionalLight position={[-44, 10, 8]} intensity={2.6} color="#ff9e6a" />
      <directionalLight position={[36, 14, -26]} intensity={0.8} color="#6a7ab6" />
      <pointLight position={[-14, 8, 0]} intensity={55} color={WARM} distance={28} />

      <BaseEnvironment groundColor="#7a7484" rockTint="#686270" seed={7} />

      {/* the lived-in quarter — real scattered windows, not wrap-around
          rings: a cone with glowing rings and a ball on top reads as a
          Christmas tree the second you make it green, no matter how nice
          the fluting texture is. */}
      {BUILT.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} rotation={[0, 0, (seedRand(i * 9 + 1) - 0.5) * 0.08]}>
          <Teardrop height={t.h} radius={t.r} color={GREEN} variant="residential" seed={i * 41} />
          {i < 2 && <Beacon color={ACCENT} size={0.16} speed={2 + i} position={[0, t.h + 0.4, 0]} />}
        </group>
      ))}

      {/* the frontier — bare frames, no light of their own */}
      {FRAMES.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <group>
            <Teardrop height={t.h} radius={t.r} color="#3c4050" />
            {/* rib rings climbing the unfinished hull */}
            {[0.2, 0.42, 0.64].map((f, j) => (
              <WindowBand
                key={j}
                radius={teardropRadiusAt(t.h, t.r, t.h * f)}
                position={[0, t.h * f, 0]}
                color="#586080"
                thickness={0.04}
              />
            ))}
          </group>
          {i === 0 && <Beacon color={ACCENT} size={0.14} speed={1.2} position={[0, t.h + 0.5, 0]} />}
        </group>
      ))}

      {/* growth rings — road arcs radiating from the built core past the front */}
      {[10, 17, 24, 31, 38].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0.4 + i * 0.12]} position={[-12, 0.06, 0]}>
          <ringGeometry args={[r - 0.18, r, 64, 1, 0, Math.PI * (1.1 - i * 0.12)]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.34 - i * 0.05} />
        </mesh>
      ))}

      {/* crawler rigs working the frontier line */}
      {([[3, 6], [9, -16], [18, 1]] as const).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, seedRand(i * 5) * Math.PI, 0]}>
          <mesh position={[0, 0.55, 0]} scale={[2.4, 1.1, 1.4]}>
            <boxGeometry />
            <meshToonMaterial color="#9aa0b4" />
          </mesh>
          <mesh position={[0.6, 1.6, 0]} rotation={[0, 0, -0.7]} scale={[0.25, 2.6, 0.25]}>
            <boxGeometry />
            <meshToonMaterial color={ACCENT} />
          </mesh>
          <Beacon color={AMBERISH(i)} size={0.1} speed={3 + i} position={[0, 1.4, 0]} />
        </group>
      ))}
    </group>
  );
}

function AMBERISH(i: number): string {
  return i % 2 ? "#ffb02e" : ACCENT;
}
