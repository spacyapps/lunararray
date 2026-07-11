"use client";

// LA-01 Serenitatis — Inter-Moon transit hub. A long glass terminal lens
// with two elevated rail ribbons sweeping through it in an S-curve, gate
// arches where they enter, and a capsule maglev gliding the line. Motion is
// the identity of this base.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import { Beacon, SweepTube, WindowBand } from "./parts";

const ACCENT = "#ffb45c";
const HULL = "#eef2f7";
const WARM = "#ffd9a0";

const RAIL_A: [number, number, number][] = [
  [-95, 5, -30], [-55, 5, -18], [-20, 4.5, -2], [8, 4.5, 4], [40, 5, 2], [95, 6, -12],
];
const RAIL_B: [number, number, number][] = [
  [-95, 6, 28], [-50, 5.5, 20], [-12, 4.5, 8], [16, 4.5, -1], [50, 5, -8], [95, 5.5, -2],
];

function railCurve(pts: [number, number, number][]) {
  return new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
}

function Pylons({ pts }: { pts: [number, number, number][] }) {
  const curve = useMemo(() => railCurve(pts), [pts]);
  const spots = useMemo(() => {
    const list: { pos: THREE.Vector3 }[] = [];
    for (let i = 0; i <= 14; i++) {
      const p = curve.getPointAt(i / 14);
      if (Math.abs(p.x) > 88) continue;
      list.push({ pos: p });
    }
    return list;
  }, [curve]);
  return (
    <group>
      {spots.map((s, i) => (
        <mesh key={i} position={[s.pos.x, s.pos.y / 2 - 0.3, s.pos.z]}>
          <cylinderGeometry args={[0.14, 0.4, s.pos.y - 0.6, 8]} />
          <meshToonMaterial color="#9aa0b4" />
        </mesh>
      ))}
    </group>
  );
}

function Train({ pts, period, offset }: { pts: [number, number, number][]; period: number; offset: number }) {
  const curve = useMemo(() => railCurve(pts), [pts]);
  const group = useRef<THREE.Group>(null);
  const cars = [0, 1, 2];
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = (clock.getElapsedTime() / period + offset) % 1;
    group.current.children.forEach((car, i) => {
      const ct = Math.max(0.001, Math.min(0.999, t - i * 0.008));
      const p = curve.getPointAt(ct);
      const tan = curve.getTangentAt(ct);
      car.position.copy(p).add(new THREE.Vector3(0, 0.55, 0));
      car.lookAt(p.clone().add(tan).add(new THREE.Vector3(0, 0.55, 0)));
    });
  });
  return (
    <group ref={group}>
      {cars.map((i) => (
        <group key={i}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.55, 2.6, 8, 16]} />
            <meshToonMaterial color={i === 0 ? ACCENT : HULL} />
          </mesh>
          {/* lit window strip */}
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.57, 2.2, 4, 8]} />
            <meshBasicMaterial color={WARM} transparent opacity={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GateArch(props: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group {...props}>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[7, 0.35, 10, 40, Math.PI]} />
        <meshToonMaterial color={HULL} emissive={ACCENT} emissiveIntensity={0.5} />
      </mesh>
      <Beacon color={ACCENT} size={0.22} position={[0, 7.4, 0]} />
    </group>
  );
}

export default function LA01() {
  return (
    <group>
      {/* dusk key — warm low sun, violet fill */}
      <directionalLight position={[-34, 10, 30]} intensity={2.4} color="#ffc890" />
      <directionalLight position={[36, 16, -30]} intensity={1.2} color="#9a8aff" />
      <pointLight position={[0, 5, 2]} intensity={50} color={WARM} distance={26} />

      <BaseEnvironment groundColor="#8a8496" rockTint="#746e82" seed={1} />

      {/* terminal — long glass lens straddling both rails */}
      <group rotation={[0, 0.25, 0]}>
        <mesh scale={[1.9, 0.5, 1]} position={[0, 0.2, 0]}>
          <sphereGeometry args={[8.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#ffe2c0"
            transparent
            opacity={0.55}
            roughness={0.15}
            emissive={WARM}
            emissiveIntensity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* concourse ring */}
        <WindowBand radius={9.5} position={[0, 1, 0]} color={WARM} thickness={0.12} />
      </group>

      {/* rails */}
      <SweepTube pts={RAIL_A} r={0.3} color="#c8ccd8" emissive={ACCENT} toon={false} />
      <SweepTube pts={RAIL_B} r={0.3} color="#c8ccd8" emissive={ACCENT} toon={false} />
      <Pylons pts={RAIL_A} />
      <Pylons pts={RAIL_B} />

      {/* gates where the lines cross the terminal apron */}
      <GateArch position={[-16, 0, -4]} rotation={[0, 1.25, 0]} />
      <GateArch position={[18, 0, 2]} rotation={[0, 1.45, 0]} />

      {/* trains, opposite phases */}
      <Train pts={RAIL_A} period={26} offset={0.15} />
      <Train pts={RAIL_B} period={30} offset={0.6} />

      {/* departure spire — slender, off-center */}
      <group position={[6, 0, -12]} rotation={[0, 0, 0.05]}>
        <mesh position={[0, 5.5, 0]}>
          <cylinderGeometry args={[0.16, 0.5, 11, 10]} />
          <meshToonMaterial color={HULL} />
        </mesh>
        <mesh position={[0, 11.2, 0]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[1.5, 24, 16]} />
          <meshToonMaterial color={HULL} emissive={ACCENT} emissiveIntensity={0.6} />
        </mesh>
        <Beacon color={ACCENT} size={0.2} position={[0, 12.4, 0]} speed={2.4} />
      </group>
    </group>
  );
}
