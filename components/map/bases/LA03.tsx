"use client";

// LA-03 Nectaris — Mining. A terraced caldera pit stepped up from the plain,
// molten-gold ore glowing at its throat, a giant toothed cutter wheel parked
// against the rim, and swept conveyor tubes arcing ore down to teardrop
// hoppers and a lens-domed refinery. Hot amber light, house style.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import { Beacon, LensDome, SweepTube, Teardrop, seedRand } from "./parts";

const ACCENT = "#ffd75c";
const ORE = "#ffb02e";
const ROCK = "#8a7e6e";
const ROCK_DARK = "#5e5648";

function Caldera() {
  const tiers = [
    { r: 17, h: 1.6 },
    { r: 13.5, h: 3 },
    { r: 10.5, h: 4.4 },
    { r: 8, h: 5.6 },
  ];
  return (
    <group>
      {tiers.map((t, i) => (
        <mesh key={i} position={[0, t.h / 2, 0]}>
          <cylinderGeometry args={[t.r * 0.92, t.r, t.h, 40]} />
          <meshToonMaterial color={i % 2 ? ROCK_DARK : ROCK} />
        </mesh>
      ))}
      {/* throat — dark bore with ore glow */}
      <mesh position={[0, 5.62, 0]}>
        <cylinderGeometry args={[5.6, 5.6, 0.1, 40]} />
        <meshBasicMaterial color="#14100a" />
      </mesh>
      <mesh position={[0, 5.7, 0]}>
        <cylinderGeometry args={[3.4, 3.4, 0.1, 32]} />
        <meshBasicMaterial color={ORE} />
      </mesh>
      <pointLight position={[0, 7, 0]} intensity={90} color={ORE} distance={26} />
      {/* ore boulders on the terraces */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = seedRand(i * 3 + 40) * Math.PI * 2;
        const tier = tiers[Math.floor(seedRand(i + 9) * 4)];
        const r = tier.r * 0.96;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, tier.h + 0.25, Math.sin(a) * r]}
            scale={0.3 + seedRand(i * 7 + 2) * 0.5}
            rotation={[seedRand(i) * 3, seedRand(i + 1) * 3, 0]}
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#3a3226" emissive={ORE} emissiveIntensity={0.9} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function CutterWheel() {
  const wheel = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (wheel.current) wheel.current.rotation.z = clock.getElapsedTime() * 0.18;
  });
  return (
    <group position={[14.5, 5.8, 9]} rotation={[0.2, -0.6, 0.12]}>
      <group ref={wheel}>
        <mesh>
          <torusGeometry args={[4.6, 1, 12, 36]} />
          <meshToonMaterial color="#c8ccd8" />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 5.7, Math.sin(a) * 5.7, 0]}
              rotation={[0, 0, a - Math.PI / 2]}
            >
              <coneGeometry args={[0.55, 1.5, 4]} />
              <meshToonMaterial color={ACCENT} />
            </mesh>
          );
        })}
      </group>
      {/* boom arm down to the ground */}
      <mesh position={[3.5, -3.4, 1.5]} rotation={[0.1, 0, 0.9]} scale={[1.4, 9, 1.4]}>
        <cylinderGeometry args={[0.35, 0.5, 1, 10]} />
        <meshToonMaterial color="#9aa0b4" />
      </mesh>
    </group>
  );
}

function Hopper(props: { position: [number, number, number]; scale?: number }) {
  const { scale = 1, ...rest } = props;
  return (
    <group {...rest} scale={scale}>
      <Teardrop height={9} radius={2.8} color="#e8ecf4" emissive={ORE} emissiveIntensity={0.12} />
      {/* glowing fill line */}
      <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.62, 0.07, 8, 48]} />
        <meshBasicMaterial color={ORE} />
      </mesh>
      <Beacon color={ACCENT} size={0.16} position={[0, 9.3, 0]} speed={1.8} />
    </group>
  );
}

export default function LA03() {
  return (
    <group>
      {/* hot amber key raking across the pit, cool bounce */}
      <directionalLight position={[-30, 12, -26]} intensity={2.5} color="#ffcf8a" />
      <directionalLight position={[28, 8, 30]} intensity={0.7} color="#8ab4ff" />

      <BaseEnvironment groundColor="#7e7668" rockTint="#6a6254" seed={3} />

      <Caldera />
      <CutterWheel />

      {/* hoppers + refinery west of the pit */}
      <Hopper position={[-24, 0, 2]} />
      <Hopper position={[-19, 0, 11]} scale={0.72} />
      <LensDome r={7} squash={0.42} color="#ffe9c2" opacity={0.55} emissive={ORE} position={[-27, 0, -12]} />

      {/* conveyors: rim → hoppers → refinery */}
      <SweepTube pts={[[-6, 6.2, -3], [-14, 7.5, 0], [-24, 8.6, 2]]} r={0.5} color="#c8ccd8" emissive={ORE} />
      <SweepTube pts={[[-5, 6.2, 4], [-12, 6.8, 8], [-19, 6.2, 11]]} r={0.4} color="#c8ccd8" emissive={ORE} />
      <SweepTube pts={[[-24, 4, 0], [-26.5, 3.4, -6], [-27, 2.6, -12]]} r={0.45} color="#c8ccd8" />

      {/* haul path — glowing dashes out to the horizon */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[20 + i * 7.5, 0.06, -14 - i * 3.4]} rotation={[-Math.PI / 2, 0, 0.42]} scale={[3.2, 0.7, 1]}>
          <planeGeometry />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.4 - i * 0.038} />
        </mesh>
      ))}
    </group>
  );
}
