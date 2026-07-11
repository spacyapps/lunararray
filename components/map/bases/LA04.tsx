"use client";

// LA-04 Fecunditatis — Manufacturing & communications. A run of seed-pod
// fab halls shrinking away from a mother pod, all threaded on one glowing
// assembly spine, under a grand gantry arch with a crawling crane car.
// Comms dishes ride the mother pod. Mint accents, house style.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import { Beacon, Dish, SweepTube, WindowBand, seedRand } from "./parts";

const ACCENT = "#7cffc4";
const HULL = "#e8ecf4";
const WARM = "#ffd9a0";

function Pod({
  r,
  ...props
}: { r: number } & { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group {...props}>
      <mesh scale={[1.35, 0.72, 1]} position={[0, r * 0.18, 0]}>
        <sphereGeometry args={[r, 40, 24]} />
        <meshToonMaterial color={HULL} />
      </mesh>
      {/* mint seam ring around the belly */}
      <mesh position={[0, r * 0.22, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.35, 1, 1]}>
        <torusGeometry args={[r * 0.99, 0.06, 8, 56]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
      <WindowBand radius={r * 0.88} position={[0, r * 0.5, 0]} color={WARM} thickness={0.06} />
    </group>
  );
}

// Pods along a gentle arc, mother pod at the head.
const POD_LINE: { pos: [number, number, number]; r: number }[] = [
  { pos: [-14, 0, -4], r: 6.4 },
  { pos: [-3, 0, 0], r: 4.6 },
  { pos: [6.5, 0, 5], r: 3.6 },
  { pos: [14.5, 0, 11], r: 2.9 },
  { pos: [21.5, 0, 18], r: 2.3 },
];

function Gantry() {
  const car = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!car.current) return;
    const t = 0.5 + 0.42 * Math.sin(clock.getElapsedTime() * 0.16);
    const a = Math.PI * (0.12 + 0.76 * t);
    car.current.position.set(Math.cos(a) * 24, Math.sin(a) * 24 * 0.62, 0);
  });
  return (
    <group position={[2, 0, 6]} rotation={[0, -0.62, 0]}>
      {/* flattened arch — half torus scaled down in Y */}
      <mesh scale={[1, 0.62, 1]}>
        <torusGeometry args={[24, 0.55, 10, 48, Math.PI]} />
        <meshToonMaterial color="#9aa0b4" />
      </mesh>
      <mesh ref={car}>
        <boxGeometry args={[1.6, 1.2, 1.6]} />
        <meshToonMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function LA04() {
  return (
    <group>
      <directionalLight position={[-36, 16, 18]} intensity={2.3} color="#ffe0b8" />
      <directionalLight position={[30, 12, -34]} intensity={1.4} color={ACCENT} />
      <pointLight position={[-14, 6, -4]} intensity={44} color={WARM} distance={24} />

      <BaseEnvironment groundColor="#788292" rockTint="#66707e" seed={4} />

      {POD_LINE.map((p, i) => (
        <Pod key={i} r={p.r} position={p.pos} />
      ))}

      {/* assembly spine — one glowing line threading every pod */}
      <SweepTube
        pts={[[-24, 1.2, -8], ...POD_LINE.map((p): [number, number, number] => [p.pos[0], 1.4, p.pos[2]]), [27, 1.2, 24]]}
        r={0.32}
        color={HULL}
        emissive={ACCENT}
      />

      <Gantry />

      {/* comms riding the mother pod */}
      <Dish r={2.6} mast={1.4} tilt={-0.8} accent={ACCENT} position={[-16, 5.6, -6]} rotation={[0, 2.4, 0]} />
      <Dish r={1.7} mast={1} tilt={-1.05} accent={ACCENT} position={[-11, 5.2, -1]} rotation={[0, 1.7, 0]} />
      <Beacon color={ACCENT} size={0.2} speed={2.2} position={[-14, 8.4, -4]} />

      {/* lozenge cargo stacks by the spine's tail */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = 24 + seedRand(i * 3 + 5) * 8;
        const z = 20 + seedRand(i * 5 + 2) * 8;
        return (
          <mesh
            key={i}
            position={[x, 0.55, z]}
            rotation={[Math.PI / 2, 0, seedRand(i) * Math.PI]}
          >
            <capsuleGeometry args={[0.5, 1.8, 6, 12]} />
            <meshToonMaterial color={i % 3 ? HULL : ACCENT} />
          </mesh>
        );
      })}
    </group>
  );
}
