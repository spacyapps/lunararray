"use client";

// LA-08 residential interior — photoreal apartment bay. Warm practicals,
// PBR panels, lunar viewport, wall-crown hydroponics (no soil).

import { useEffect, useState } from "react";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import { HydroponicChannel } from "../parts";
import { RendererQuality } from "../BaseLighting";

const WARM = "#ffd9a0";
const ACCENT = "#c48aff";
const GROW = "#7cffc4";
const PANEL = "#e8e4dc";

function useMap(url: string, repeatX = 2, repeatY = 1.4) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    new THREE.TextureLoader().load(url, (t) => {
      if (cancelled) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatX, repeatY);
      t.anisotropy = 8;
      setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [url, repeatX, repeatY]);
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
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.09, 0.14]} />
        <meshStandardMaterial color="#d8dce6" metalness={0.65} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.06, 0.02]}>
        <boxGeometry args={[0.3, 0.045, 0.07]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.3} roughness={0.3} />
      </mesh>
      <pointLight position={[0, -0.3, 0.35]} intensity={8} color={color} distance={5} decay={2} />
    </group>
  );
}

function Lounge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} scale={[2.5, 0.48, 0.95]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#5a4e68" roughness={0.78} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.58, -0.3]} scale={[2.5, 0.58, 0.3]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#4a4058" roughness={0.78} />
      </mesh>
      <mesh position={[-0.55, 0.54, 0.06]} scale={[0.58, 0.2, 0.48]} rotation={[0.1, 0.2, 0]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color={ACCENT} roughness={0.85} emissive={ACCENT} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0.5, 0.54, 0.06]} scale={[0.58, 0.2, 0.48]} rotation={[0.08, -0.15, 0]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color={WARM} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.24, 1.15]} scale={[1.15, 0.07, 0.58]} castShadow>
        <boxGeometry />
        <meshPhysicalMaterial color="#c8c4bc" metalness={0.35} roughness={0.25} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 1.15]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.22, 16]} />
        <meshStandardMaterial color="#9aa0b4" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function PlantNook({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 1.15, 24]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.18, 0]}>
        <torusGeometry args={[0.22, 0.045, 12, 32]} />
        <meshStandardMaterial color={GROW} emissive={GROW} emissiveIntensity={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.5, 0]} scale={[0.38, 0.6, 0.38]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color="#4ecf82" roughness={0.75} emissive="#1a5030" emissiveIntensity={0.25} />
      </mesh>
      <pointLight position={[0, 1.55, 0]} intensity={3.5} color={GROW} distance={3.5} />
    </group>
  );
}

export default function ResidentialInterior() {
  const wallTex = useMap("/textures/interior-wall.jpg", 2.2, 1.5);
  const floorTex = useMap("/textures/interior-floor.jpg", 3, 3);

  const W = 8.4;
  const D = 7.2;
  const H = 3.1;

  return (
    <group>
      <RendererQuality shadows />
      <ambientLight intensity={0.18} color="#ffe8d0" />
      <hemisphereLight args={["#ffe8c8", "#2a2438", 0.35]} />
      <directionalLight
        position={[2.5, 4.5, 1.5]}
        intensity={0.55}
        color="#ffe8c8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 2.7, 0]} intensity={22} color={WARM} distance={14} decay={2} />
      <pointLight position={[-2.5, 2.3, -1]} intensity={12} color={ACCENT} distance={9} decay={2} />
      <pointLight position={[2.8, 2.1, 2]} intensity={10} color={GROW} distance={8} decay={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          color="#3a3648"
          map={floorTex ?? undefined}
          bumpMap={floorTex ?? undefined}
          bumpScale={0.04}
          roughness={0.55}
          metalness={0.12}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.8, 2.08, 64]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.35} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.9} />
      </mesh>
      <mesh position={[0, H - 0.08, 0]}>
        <boxGeometry args={[W * 0.72, 0.04, D * 0.55]} />
        <meshStandardMaterial color={WARM} emissive={WARM} emissiveIntensity={0.55} transparent opacity={0.55} />
      </mesh>

      {(
        [
          { pos: [0, H / 2, -D / 2] as [number, number, number], rot: [0, 0, 0] as [number, number, number], w: W },
          { pos: [0, H / 2, D / 2] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], w: W },
          { pos: [-W / 2, H / 2, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], w: D },
          { pos: [W / 2, H / 2, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], w: D },
        ] as const
      ).map((wall, i) => (
        <mesh key={i} position={wall.pos} rotation={wall.rot} receiveShadow>
          <planeGeometry args={[wall.w, H]} />
          <meshStandardMaterial
            color={PANEL}
            map={wallTex ?? undefined}
            bumpMap={wallTex ?? undefined}
            bumpScale={0.03}
            roughness={0.65}
            metalness={0.08}
          />
        </mesh>
      ))}

      {/* lunar viewport */}
      <group position={[0, 1.55, -D / 2 + 0.02]}>
        <mesh>
          <planeGeometry args={[3.6, 1.9]} />
          <meshBasicMaterial color="#05060a" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[3.4, 1.7]} />
          <meshPhysicalMaterial
            color="#a8d8ff"
            transparent
            opacity={0.28}
            roughness={0.05}
            metalness={0.1}
            transmission={0.55}
            thickness={0.4}
            clearcoat={0.5}
            emissive="#5cd6ff"
            emissiveIntensity={0.12}
          />
        </mesh>
        <mesh position={[-0.6, 0.2, -0.05]}>
          <circleGeometry args={[0.38, 32]} />
          <meshStandardMaterial color="#5cd6ff" emissive="#5cd6ff" emissiveIntensity={0.8} transparent opacity={0.65} />
        </mesh>
        <mesh position={[0, -0.55, -0.04]} scale={[3.2, 0.5, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#ffb45c" transparent opacity={0.14} />
        </mesh>
        {(
          [
            [0, 0.95, 0.04, 3.7, 0.1, 0.08],
            [0, -0.95, 0.04, 3.7, 0.1, 0.08],
            [-1.8, 0, 0.04, 0.1, 2.0, 0.08],
            [1.8, 0, 0.04, 0.1, 2.0, 0.08],
            [0, 0, 0.04, 0.06, 1.9, 0.06],
          ] as const
        ).map(([x, y, z, sx, sy, sz], i) => (
          <mesh key={i} position={[x, y, z]} scale={[sx, sy, sz]} castShadow>
            <boxGeometry />
            <meshStandardMaterial color="#9aa0b4" metalness={0.55} roughness={0.32} />
          </mesh>
        ))}
      </group>

      <HydroponicChannel length={W * 0.88} position={[0, H - 0.22, D / 2 - 0.2]} rotation={[0, Math.PI, 0]} accent={GROW} grow={ACCENT} />
      <HydroponicChannel length={D * 0.82} position={[-W / 2 + 0.2, H - 0.22, 0]} rotation={[0, Math.PI / 2, 0]} accent={GROW} grow={ACCENT} />
      <HydroponicChannel length={D * 0.82} position={[W / 2 - 0.2, H - 0.22, 0]} rotation={[0, -Math.PI / 2, 0]} accent={GROW} grow={ACCENT} />
      <HydroponicChannel length={1.8} position={[-2.6, H - 0.22, -D / 2 + 0.2]} accent={GROW} grow={WARM} />
      <HydroponicChannel length={1.8} position={[2.6, H - 0.22, -D / 2 + 0.2]} accent={GROW} grow={WARM} />

      <Lounge position={[0, 0, 0.6]} />
      <PlantNook position={[-3.1, 0, -2.2]} />
      <PlantNook position={[3.1, 0, -1.8]} />

      <SoftSconce position={[-2.2, 2.35, -D / 2 + 0.15]} />
      <SoftSconce position={[2.2, 2.35, -D / 2 + 0.15]} />
      <SoftSconce position={[-W / 2 + 0.15, 2.2, 1.2]} color={ACCENT} />
      <SoftSconce position={[W / 2 - 0.15, 2.2, 1.2]} color={GROW} />

      <mesh position={[0, 0.55, -D / 2 + 0.45]} scale={[2.8, 0.9, 0.45]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#2c3040" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.95, -D / 2 + 0.55]} scale={[1.4, 0.06, 0.25]}>
        <boxGeometry />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.0} transparent opacity={0.85} />
      </mesh>

      <mesh position={[0, 1.2, D / 2 - 0.05]}>
        <planeGeometry args={[1.6, 2.2]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.25} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.2, D / 2 - 0.04]}>
        <ringGeometry args={[0.7, 0.78, 40]} />
        <meshStandardMaterial color={WARM} emissive={WARM} emissiveIntensity={0.7} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      <ContactShadows position={[0, 0.03, 0]} opacity={0.55} scale={12} blur={2.2} far={6} resolution={512} color="#0a0810" />
    </group>
  );
}
