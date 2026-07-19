"use client";

// LA-08 residential interior — apartment bay you can enter from the base
// orbit. Warm, livable, artistic: modern panels, soft practicals, a lunar
// viewport, and hydroponic channels along the wall crowns (no soil — CO2
// recycling as living architecture).

import { useEffect, useState } from "react";
import * as THREE from "three";
import { HydroponicChannel } from "../parts";

const WARM = "#ffd9a0";
const ACCENT = "#c48aff";
const GROW = "#7cffc4";
const PANEL = "#e8e4dc";
const FLOOR = "#3a3648";

function useTexture(url: string | undefined) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    new THREE.TextureLoader().load(url, (t) => {
      if (cancelled) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 1.4);
      t.anisotropy = 4;
      setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return tex;
}

function SoftSconce({
  position,
  color = WARM,
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.35, 0.08, 0.12]} />
        <meshStandardMaterial color="#d8dce6" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.06, 0.02]}>
        <boxGeometry args={[0.28, 0.04, 0.06]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight position={[0, -0.25, 0.3]} intensity={6} color={color} distance={4.5} />
    </group>
  );
}

function Lounge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* low sofa mass */}
      <mesh position={[0, 0.28, 0]} scale={[2.4, 0.45, 0.9]}>
        <boxGeometry />
        <meshStandardMaterial color="#5a4e68" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, -0.28]} scale={[2.4, 0.55, 0.28]}>
        <boxGeometry />
        <meshStandardMaterial color="#4a4058" roughness={0.85} />
      </mesh>
      {/* cushions — warm accent */}
      <mesh position={[-0.55, 0.52, 0.05]} scale={[0.55, 0.18, 0.45]} rotation={[0.1, 0.2, 0]}>
        <boxGeometry />
        <meshStandardMaterial color={ACCENT} roughness={0.9} emissive={ACCENT} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0.5, 0.52, 0.05]} scale={[0.55, 0.18, 0.45]} rotation={[0.08, -0.15, 0]}>
        <boxGeometry />
        <meshStandardMaterial color={WARM} roughness={0.9} />
      </mesh>
      {/* low table */}
      <mesh position={[0, 0.22, 1.1]} scale={[1.1, 0.08, 0.55]}>
        <boxGeometry />
        <meshStandardMaterial color="#c8c4bc" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 1.1]}>
        <cylinderGeometry args={[0.08, 0.12, 0.2, 8]} />
        <meshStandardMaterial color="#9aa0b4" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function PlantNook({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 1.1, 12]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.6} />
      </mesh>
      {/* hydro planter — no soil, lit tube + foliage mass */}
      <mesh position={[0, 1.15, 0]}>
        <torusGeometry args={[0.2, 0.04, 8, 20]} />
        <meshStandardMaterial color={GROW} emissive={GROW} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 1.45, 0]} scale={[0.35, 0.55, 0.35]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#4ecf82" roughness={0.8} emissive="#1a5030" emissiveIntensity={0.2} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} intensity={2.5} color={GROW} distance={3} />
    </group>
  );
}

export default function ResidentialInterior() {
  const wallTex = useTexture("/textures/interior-wall.jpg");

  // Room is centered at origin; camera orbits around focus ~[0, 1.45, 0].
  // Walls at ±4.2 X/Z, ceiling ~3.1, floor at 0.
  const W = 8.4;
  const D = 7.2;
  const H = 3.1;

  return (
    <group>
      {/* intimate interior lighting — no harsh exterior sun */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[2, 4, 1]} intensity={0.35} color="#ffe8c8" />
      <pointLight position={[0, 2.6, 0]} intensity={18} color={WARM} distance={12} />
      <pointLight position={[-2.5, 2.2, -1]} intensity={10} color={ACCENT} distance={8} />
      <pointLight position={[2.8, 2.0, 2]} intensity={8} color={GROW} distance={7} />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={FLOOR} roughness={0.75} metalness={0.08} />
      </mesh>
      {/* soft floor glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.8, 2.05, 48]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.9} />
      </mesh>
      {/* ceiling cove light */}
      <mesh position={[0, H - 0.08, 0]}>
        <boxGeometry args={[W * 0.7, 0.04, D * 0.55]} />
        <meshBasicMaterial color={WARM} transparent opacity={0.35} />
      </mesh>

      {/* walls — four sides, warm panel map */}
      {(
        [
          { pos: [0, H / 2, -D / 2] as [number, number, number], rot: [0, 0, 0] as [number, number, number], w: W },
          { pos: [0, H / 2, D / 2] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], w: W },
          { pos: [-W / 2, H / 2, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], w: D },
          { pos: [W / 2, H / 2, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], w: D },
        ] as const
      ).map((wall, i) => (
        <mesh key={i} position={wall.pos} rotation={wall.rot}>
          <planeGeometry args={[wall.w, H]} />
          <meshStandardMaterial
            color={PANEL}
            map={wallTex ?? undefined}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* lunar viewport — north wall cutout with glass + star glow */}
      <group position={[0, 1.55, -D / 2 + 0.02]}>
        <mesh>
          <planeGeometry args={[3.6, 1.9]} />
          <meshBasicMaterial color="#05060a" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[3.4, 1.7]} />
          <meshStandardMaterial
            color="#a8d8ff"
            transparent
            opacity={0.28}
            roughness={0.12}
            metalness={0.15}
            emissive="#5cd6ff"
            emissiveIntensity={0.15}
          />
        </mesh>
        {/* earth / horizon glow outside */}
        <mesh position={[-0.6, 0.2, -0.05]}>
          <circleGeometry args={[0.35, 24]} />
          <meshBasicMaterial color="#5cd6ff" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, -0.55, -0.04]} scale={[3.2, 0.5, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#ffb45c" transparent opacity={0.12} />
        </mesh>
        {/* window frame rails */}
        {(
          [
            [0, 0.95, 0.04, 3.7, 0.1, 0.08],
            [0, -0.95, 0.04, 3.7, 0.1, 0.08],
            [-1.8, 0, 0.04, 0.1, 2.0, 0.08],
            [1.8, 0, 0.04, 0.1, 2.0, 0.08],
            [0, 0, 0.04, 0.06, 1.9, 0.06],
          ] as const
        ).map(([x, y, z, sx, sy, sz], i) => (
          <mesh key={i} position={[x, y, z]} scale={[sx, sy, sz]}>
            <boxGeometry />
            <meshStandardMaterial color="#9aa0b4" metalness={0.45} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* hydroponics along the TOP of three walls (not the viewport wall) */}
      <HydroponicChannel
        length={W * 0.88}
        position={[0, H - 0.22, D / 2 - 0.2]}
        rotation={[0, Math.PI, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.82}
        position={[-W / 2 + 0.2, H - 0.22, 0]}
        rotation={[0, Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.82}
        position={[W / 2 - 0.2, H - 0.22, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      {/* short channel over viewport corners */}
      <HydroponicChannel
        length={1.8}
        position={[-2.6, H - 0.22, -D / 2 + 0.2]}
        accent={GROW}
        grow={WARM}
      />
      <HydroponicChannel
        length={1.8}
        position={[2.6, H - 0.22, -D / 2 + 0.2]}
        accent={GROW}
        grow={WARM}
      />

      <Lounge position={[0, 0, 0.6]} />
      <PlantNook position={[-3.1, 0, -2.2]} />
      <PlantNook position={[3.1, 0, -1.8]} />

      <SoftSconce position={[-2.2, 2.35, -D / 2 + 0.15]} />
      <SoftSconce position={[2.2, 2.35, -D / 2 + 0.15]} />
      <SoftSconce position={[-W / 2 + 0.15, 2.2, 1.2]} color={ACCENT} />
      <SoftSconce position={[W / 2 - 0.15, 2.2, 1.2]} color={GROW} />

      {/* slim console under the viewport */}
      <mesh position={[0, 0.55, -D / 2 + 0.45]} scale={[2.8, 0.9, 0.45]}>
        <boxGeometry />
        <meshStandardMaterial color="#2c3040" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.95, -D / 2 + 0.55]} scale={[1.4, 0.06, 0.25]}>
        <boxGeometry />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.7} />
      </mesh>

      {/* entrance portal glow — south wall, where we "came from" */}
      <mesh position={[0, 1.2, D / 2 - 0.05]}>
        <planeGeometry args={[1.6, 2.2]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.2, D / 2 - 0.04]}>
        <ringGeometry args={[0.7, 0.78, 32]} />
        <meshBasicMaterial color={WARM} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
