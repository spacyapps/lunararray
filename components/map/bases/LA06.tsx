"use client";

// LA-06 Humorum — Foundation. Restricted but not militarized: a construction
// site sealed off behind a fence. The one organic form — a huge unfinished
// lens shell, ribs exposed where the skin stops — surrounded by severe,
// utilitarian everything: tower cranes, slab yards, pipe stacks, amber work
// lights. Sits between the house style and the military breaks.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import { Beacon, seedRand } from "./parts";

const SAND = "#d8c8a8";
const CONCRETE = "#8e887a";
const FRAME = "#6e6858";
const AMBER = "#ffb02e";

function UnfinishedShell() {
  return (
    <group rotation={[0, -0.5, 0]}>
      {/* skinned portion — 60% of the lens */}
      <mesh scale={[1, 0.5, 1]}>
        <sphereGeometry args={[13, 48, 24, 0, Math.PI * 1.2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={SAND} side={THREE.DoubleSide} />
      </mesh>
      {/* exposed ribs across the open wedge */}
      {[0.1, 0.28, 0.46, 0.64, 0.82].map((f, i) => {
        const a = Math.PI * (1.2 + f * 0.8);
        return (
          <group key={i} rotation={[0, -a, 0]}>
            <mesh scale={[1, 0.5, 1]} rotation={[0, 0, 0]}>
              <torusGeometry args={[12.9, 0.16, 6, 40, Math.PI / 2]} />
              <meshStandardMaterial color={FRAME} />
            </mesh>
          </group>
        );
      })}
      {/* ring beam at the rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[13, 0.3, 8, 64]} />
        <meshStandardMaterial color={CONCRETE} />
      </mesh>
      {/* interior work glow spilling out of the open wedge */}
      <pointLight position={[-6, 3.5, -6]} intensity={70} color={AMBER} distance={30} />
    </group>
  );
}

function Crane({ slew = false, ...props }: { slew?: boolean } & { position: [number, number, number]; rotation?: [number, number, number] }) {
  const top = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (slew && top.current) top.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.07) * 0.9;
  });
  return (
    <group {...props}>
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[0.7, 16, 0.7]} />
        <meshStandardMaterial color={AMBER} roughness={0.7} />
      </mesh>
      <group ref={top} position={[0, 16, 0]}>
        {/* jib + counter-jib */}
        <mesh position={[5.5, 0, 0]}>
          <boxGeometry args={[11, 0.5, 0.5]} />
          <meshStandardMaterial color={AMBER} roughness={0.7} />
        </mesh>
        <mesh position={[-2.6, 0, 0]}>
          <boxGeometry args={[5.2, 0.7, 0.7]} />
          <meshStandardMaterial color={FRAME} roughness={0.8} />
        </mesh>
        {/* cable + hook */}
        <mesh position={[8.5, -3.2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 6.4, 4]} />
          <meshBasicMaterial color="#c8ccd8" />
        </mesh>
        <mesh position={[8.5, -6.6, 0]}>
          <boxGeometry args={[0.9, 0.6, 0.9]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.8} />
        </mesh>
        <Beacon color={AMBER} size={0.14} speed={1.4} position={[0, 0.8, 0]} />
      </group>
    </group>
  );
}

function Fence() {
  const posts = [];
  const N = 26;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 30;
    posts.push(
      <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 2.2, 6]} />
          <meshStandardMaterial color={FRAME} roughness={0.9} />
        </mesh>
        {i % 5 === 0 && <Beacon color={AMBER} size={0.11} speed={1.8} position={[0, 2.4, 0]} />}
      </group>,
    );
  }
  return (
    <group>
      {posts}
      {/* single rail — a thin bright line linking the posts */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.9, 0]}>
        <torusGeometry args={[30, 0.035, 4, 96]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function LA06() {
  return (
    <group>
      {/* flat overcast-severe key, warm interior amber doing the storytelling */}
      <directionalLight position={[-18, 26, -22]} intensity={1.7} color="#e6e2d6" />
      <directionalLight position={[26, 8, 24]} intensity={0.5} color="#8a94ae" />

      <BaseEnvironment groundColor="#6e6a5e" rockTint="#5c584c" seed={6} />

      <UnfinishedShell />

      <Crane position={[16, 0, 6]} slew />
      <Crane position={[-10, 0, 17]} rotation={[0, 2.2, 0]} />

      {/* slab yard — neat severe rows */}
      {Array.from({ length: 12 }).map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return (
          <mesh
            key={i}
            position={[-22 + col * 4.4, 0.5 + (i % 2) * 0.9, -16 - row * 4]}
            scale={[3.6, 0.8, 2.6]}
          >
            <boxGeometry />
            <meshStandardMaterial color={i % 3 ? CONCRETE : SAND} roughness={0.95} />
          </mesh>
        );
      })}

      {/* pipe stacks */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={i}
          position={[20 + seedRand(i * 3) * 3, 0.7 + (i % 3) * 0.9, -14 + (i % 3) * 1.4 - Math.floor(i / 3) * 4]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.7, 0.7, 7, 14]} />
          <meshStandardMaterial color={i % 2 ? "#9aa0b4" : CONCRETE} />
        </mesh>
      ))}

      <Fence />
    </group>
  );
}
