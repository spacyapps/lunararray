"use client";

// LA-05 Nubium — Restricted / military installation. The second style break,
// deliberately unlike LA-02's fortress: almost nothing shows above ground.
// A grid of sealed silo hatches, low black bunker domes, one knife-thin
// command obelisk, a tilting phased-array slab, and a wide ring of sensor
// pylons strobing white. Near-monochrome, lit like an interrogation room.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import { Beacon, seedRand } from "./parts";

const BLACK = "#23252c";
const GRAPHITE = "#34363e";
const COLD = "#cfe0ff";
const RED = "#ff3b30";

function SiloHatch({ open, ...props }: { open?: boolean } & { position: [number, number, number] }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.24, 8]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.95} metalness={0.25} />
      </mesh>
      {open ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]}>
          <ringGeometry args={[1.1, 1.35, 8]} />
          <meshBasicMaterial color={RED} transparent opacity={0.8} />
        </mesh>
      ) : (
        // sealed: two red chevron ticks
        <>
          <mesh position={[0.9, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0.6]} scale={[1, 0.18, 1]}>
            <planeGeometry />
            <meshBasicMaterial color={RED} transparent opacity={0.5} />
          </mesh>
          <mesh position={[-0.9, 0.26, 0]} rotation={[-Math.PI / 2, 0, -0.6]} scale={[1, 0.18, 1]}>
            <planeGeometry />
            <meshBasicMaterial color={RED} transparent opacity={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}

function PhasedArray() {
  const slab = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (slab.current) slab.current.rotation.x = -0.9 + Math.sin(clock.getElapsedTime() * 0.11) * 0.25;
  });
  return (
    <group position={[-13, 0, -10]} rotation={[0, 0.7, 0]}>
      <mesh position={[0, 1.4, 0]} scale={[1.2, 2.8, 1.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={BLACK} roughness={0.9} metalness={0.3} />
      </mesh>
      <group ref={slab} position={[0, 3, 0]}>
        <mesh scale={[7, 4.4, 0.3]}>
          <boxGeometry />
          <meshStandardMaterial color={GRAPHITE} roughness={0.7} metalness={0.45} />
        </mesh>
        {/* cold emitter lines */}
        {[-1.4, -0.5, 0.4, 1.3].map((y, i) => (
          <mesh key={i} position={[0, y, 0.17]} scale={[6.4, 0.08, 1]}>
            <planeGeometry />
            <meshBasicMaterial color={COLD} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function LA05() {
  return (
    <group>
      {/* single hard top-light — interrogation glare, faint blue floor bounce */}
      <directionalLight position={[4, 42, 6]} intensity={2.6} color="#e8f0ff" />
      <directionalLight position={[-24, 4, -18]} intensity={0.2} color="#4a5a7a" />

      <BaseEnvironment groundColor="#4c4e58" rockTint="#40424c" seed={5} />

      {/* silo field — 3×3 grid, one hatch irised open */}
      {Array.from({ length: 9 }).map((_, i) => {
        const gx = (i % 3) - 1;
        const gz = Math.floor(i / 3) - 1;
        return (
          <SiloHatch
            key={i}
            position={[gx * 9 + 4, 0, gz * 9 + 2]}
            open={i === 4}
          />
        );
      })}

      {/* low bunker domes, barely surfaced */}
      {([[-16, 8, 4.2], [-10, 16, 3.2], [20, -6, 3.6]] as const).map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0, z]} scale={[1, 0.28, 1]}>
          <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={BLACK} roughness={0.95} metalness={0.2} />
        </mesh>
      ))}

      {/* command obelisk — knife-thin, one white slit */}
      <group position={[10, 0, -14]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 7, 0]} scale={[2.4, 14, 1]}>
          <boxGeometry />
          <meshStandardMaterial color={BLACK} roughness={0.85} metalness={0.4} />
        </mesh>
        <mesh position={[0, 11.8, 0.52]} scale={[1.3, 0.1, 0.04]}>
          <boxGeometry />
          <meshBasicMaterial color={COLD} />
        </mesh>
        <Beacon color={RED} size={0.14} speed={0.9} position={[0, 14.3, 0]} />
      </group>

      <PhasedArray />

      {/* sensor pylon ring — wide, sparse, strobing */}
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.2;
        const r = 34 + seedRand(i * 7 + 3) * 4;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <mesh position={[0, 1.9, 0]}>
              <cylinderGeometry args={[0.06, 0.1, 3.8, 4]} />
              <meshStandardMaterial color={BLACK} roughness={0.8} metalness={0.4} />
            </mesh>
            <Beacon color={COLD} size={0.1} speed={5 + seedRand(i) * 2} position={[0, 3.9, 0]} />
          </group>
        );
      })}
    </group>
  );
}
