"use client";

// LA-02 Tranquillitatis — Restricted / military installation.
// Deliberate break from the house style: no curves, no warmth. A stepped
// gunmetal ziggurat inside an octagonal wall, corner watchtowers, a slowly
// sweeping radar blade and a searchlight cone. One harsh cold key light,
// red warning accents only.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import { Beacon } from "./parts";

const STEEL = "#4a4e58";
const STEEL_DARK = "#33363e";
const RED = "#ff3b30";

function Watchtower(props: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group {...props}>
      <mesh position={[0, 3.2, 0]} scale={[1.6, 6.4, 1.6]}>
        <boxGeometry />
        <meshStandardMaterial color={STEEL} roughness={0.85} metalness={0.35} />
      </mesh>
      <mesh position={[0, 6.9, 0]} scale={[2.4, 1, 2.4]}>
        <boxGeometry />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.85} metalness={0.35} />
      </mesh>
      <Beacon color={RED} size={0.16} speed={1.6} position={[0, 7.7, 0]} />
    </group>
  );
}

function WallRing({ radius = 22, segments = 8 }: { radius?: number; segments?: number }) {
  const walls = [];
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    const len = 2 * radius * Math.sin(Math.PI / segments) * 0.92;
    walls.push(
      <mesh
        key={i}
        position={[Math.cos(mid) * radius, 1.6, Math.sin(mid) * radius]}
        rotation={[0, -mid + Math.PI / 2, 0]}
        scale={[len, 3.2, 0.8]}
      >
        <boxGeometry />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.9} metalness={0.3} />
      </mesh>,
    );
  }
  return <group>{walls}</group>;
}

function Radar() {
  const blade = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (blade.current) blade.current.rotation.y = clock.getElapsedTime() * 0.5;
  });
  return (
    <group position={[9, 0, -9]}>
      <mesh position={[0, 2.4, 0]}>
        <coneGeometry args={[2.6, 4.8, 4]} />
        <meshStandardMaterial color={STEEL} roughness={0.85} metalness={0.35} flatShading />
      </mesh>
      <group ref={blade} position={[0, 5.4, 0]}>
        <mesh scale={[5, 0.9, 0.12]}>
          <boxGeometry />
          <meshStandardMaterial color={STEEL_DARK} roughness={0.7} metalness={0.5} />
        </mesh>
        <mesh position={[2.5, 0, 0]} scale={[0.15, 0.9, 0.15]}>
          <boxGeometry />
          <meshBasicMaterial color={RED} />
        </mesh>
      </group>
    </group>
  );
}

function Searchlight() {
  const cone = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (cone.current) {
      const t = clock.getElapsedTime() * 0.24;
      cone.current.rotation.y = Math.sin(t) * 1.2 + 0.4;
    }
  });
  return (
    <group position={[-15.6, 7.4, 15.6]}>
      <group ref={cone}>
        <mesh position={[0, -2.2, 7]} rotation={[Math.PI / 2.6, 0, 0]}>
          <coneGeometry args={[2.6, 16, 24, 1, true]} />
          <meshBasicMaterial
            color="#cfe0ff"
            transparent
            opacity={0.07}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function LA02() {
  return (
    <group>
      {/* one harsh cold key, near-black fill — long brutal shadows */}
      <directionalLight position={[26, 30, -14]} intensity={2.8} color="#dfe8f4" />
      <directionalLight position={[-20, 6, 20]} intensity={0.25} color="#5a6a86" />

      <BaseEnvironment groundColor="#565a66" rockTint="#484c58" seed={2} />

      {/* stepped ziggurat core */}
      <group>
        <mesh position={[0, 1.5, 0]} scale={[16, 3, 16]}>
          <boxGeometry />
          <meshStandardMaterial color={STEEL} roughness={0.9} metalness={0.35} />
        </mesh>
        <mesh position={[0, 4.2, 0]} scale={[11.5, 2.4, 11.5]}>
          <boxGeometry />
          <meshStandardMaterial color={STEEL_DARK} roughness={0.9} metalness={0.35} />
        </mesh>
        <mesh position={[0, 6.4, 0]} scale={[7.5, 2, 7.5]}>
          <boxGeometry />
          <meshStandardMaterial color={STEEL} roughness={0.9} metalness={0.35} />
        </mesh>
        <mesh position={[0, 8.6, 0]} scale={[4, 2.4, 4]}>
          <boxGeometry />
          <meshStandardMaterial color={STEEL_DARK} roughness={0.9} metalness={0.35} />
        </mesh>
        {/* red command slit — the only "window" on the whole base */}
        <mesh position={[0, 8.6, 2.05]} scale={[2.6, 0.18, 0.05]}>
          <boxGeometry />
          <meshBasicMaterial color={RED} />
        </mesh>
        <Beacon color={RED} size={0.2} speed={1.2} position={[0, 10.4, 0]} />
      </group>

      {/* antenna masts, angular */}
      {([[-5.5, -5.5, 9], [5.5, 5.5, 7]] as const).map(([x, z, h], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, h / 2 + 3, 0]}>
            <cylinderGeometry args={[0.07, 0.07, h, 4]} />
            <meshStandardMaterial color={STEEL_DARK} roughness={0.7} metalness={0.5} />
          </mesh>
          <Beacon color={RED} size={0.12} speed={1.6 + i} position={[0, h + 3.2, 0]} />
        </group>
      ))}

      <WallRing />
      <Watchtower position={[15.6, 0, 15.6]} rotation={[0, Math.PI / 4, 0]} />
      <Watchtower position={[-15.6, 0, 15.6]} rotation={[0, -Math.PI / 4, 0]} />
      <Watchtower position={[15.6, 0, -15.6]} rotation={[0, -Math.PI / 4, 0]} />
      <Watchtower position={[-15.6, 0, -15.6]} rotation={[0, Math.PI / 4, 0]} />

      <Radar />
      <Searchlight />

      {/* exclusion perimeter — dashed red ground ring */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 30, 0.06, Math.sin(a) * 30]}
            rotation={[-Math.PI / 2, 0, -a]}
            scale={[2.6, 0.5, 1]}
          >
            <planeGeometry />
            <meshBasicMaterial color={RED} transparent opacity={0.55} />
          </mesh>
        );
      })}
    </group>
  );
}
