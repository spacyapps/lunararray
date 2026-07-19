"use client";

// LA-08 residential interior — photoreal apartment bay:
// ceiling artificial sunshine, digital wall panels, window with lunar view,
// textured furniture (image cards, not bare boxes), wall-crown hydroponics.

import { useEffect, useState } from "react";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import { HydroponicChannel } from "../parts";
import { RendererQuality } from "../BaseLighting";
import { loadTexture } from "@/lib/three/textureCache";

const WARM = "#ffd9a0";
const ACCENT = "#c48aff";
const GROW = "#7cffc4";
const SUN = "#ffe8c4";

function useTex(url: string, repeatX = 1, repeatY = 1, wrap: THREE.Wrapping = THREE.RepeatWrapping) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadTexture(url, { repeat: [repeatX, repeatY], wrap, anisotropy: 4 }).then((t) => {
      if (!cancelled) setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [url, repeatX, repeatY, wrap]);
  return tex;
}

/** Soft rectangular photo card — used for furniture faces, art, screens. */
function PhotoPanel({
  map,
  width,
  height,
  position,
  rotation,
  emissive,
  emissiveIntensity = 0,
  color = "#ffffff",
}: {
  map?: THREE.Texture | null;
  width: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  emissive?: string;
  emissiveIntensity?: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={map ?? undefined}
        color={map ? color : "#4a4558"}
        roughness={0.55}
        metalness={0.08}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissiveIntensity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CeilingSun({ width, depth, y }: { width: number; depth: number; y: number }) {
  return (
    <group position={[0, y, 0]}>
      {/* recessed light tray */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[width * 0.78, 0.06, depth * 0.55]} />
        <meshStandardMaterial color="#e8e4dc" metalness={0.35} roughness={0.4} />
      </mesh>
      {/* glowing diffuser panels — artificial sunshine */}
      <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.72, depth * 0.5]} />
        <meshStandardMaterial
          color={SUN}
          emissive={SUN}
          emissiveIntensity={1.35}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* curved LED traces */}
      {[-0.35, 0, 0.35].map((z, i) => (
        <mesh key={i} position={[0, -0.055, z * depth * 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.55, 0.04]} />
          <meshBasicMaterial color={WARM} transparent opacity={0.75} />
        </mesh>
      ))}
      <pointLight position={[0, -0.4, 0]} intensity={28} color={SUN} distance={14} decay={2} />
      <pointLight position={[-1.2, -0.5, 0.8]} intensity={8} color={SUN} distance={8} decay={2} />
      <pointLight position={[1.2, -0.5, -0.5]} intensity={6} color={WARM} distance={7} decay={2} />
    </group>
  );
}

function DigitalPanel({
  position,
  rotation,
  w = 1.6,
  h = 0.95,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  w?: number;
  h?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* bezel */}
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1c24" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* screen */}
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color="#0a1628"
          emissive="#5cd6ff"
          emissiveIntensity={0.45}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>
      {/* UI chrome lines */}
      <mesh position={[0, h * 0.28, 0.01]}>
        <planeGeometry args={[w * 0.82, 0.03]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-w * 0.2, 0, 0.01]}>
        <planeGeometry args={[w * 0.35, h * 0.4]} />
        <meshBasicMaterial color="#7cffc4" transparent opacity={0.12} />
      </mesh>
      <mesh position={[w * 0.22, -h * 0.1, 0.01]}>
        <planeGeometry args={[w * 0.32, h * 0.28]} />
        <meshBasicMaterial color="#5cd6ff" transparent opacity={0.1} />
      </mesh>
      <pointLight position={[0, 0, 0.3]} intensity={2.5} color="#5cd6ff" distance={3.5} decay={2} />
    </group>
  );
}

function LoungeSet({
  furniture,
  position,
}: {
  furniture: THREE.Texture | null;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* sofa back as photo plane + soft body volume */}
      <mesh position={[0, 0.42, -0.35]} castShadow>
        <boxGeometry args={[2.6, 0.85, 0.55]} />
        <meshStandardMaterial color="#6a6078" roughness={0.82} map={furniture ?? undefined} />
      </mesh>
      <mesh position={[0, 0.28, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.38, 0.95]} />
        <meshStandardMaterial color="#5a5068" roughness={0.85} />
      </mesh>
      {/* cushions with fabric-like tone */}
      <mesh position={[-0.65, 0.52, 0.2]} rotation={[0.15, 0.2, 0]} castShadow>
        <boxGeometry args={[0.7, 0.22, 0.55]} />
        <meshStandardMaterial color={ACCENT} roughness={0.9} emissive={ACCENT} emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[0.55, 0.52, 0.2]} rotation={[0.12, -0.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.22, 0.55]} />
        <meshStandardMaterial color={WARM} roughness={0.9} />
      </mesh>
      {/* coffee table — wood-toned */}
      <mesh position={[0, 0.28, 1.25]} castShadow>
        <boxGeometry args={[1.35, 0.08, 0.72]} />
        <meshStandardMaterial color="#8a6a48" roughness={0.45} metalness={0.1} map={furniture ?? undefined} />
      </mesh>
      <mesh position={[0, 0.12, 1.25]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.24, 20]} />
        <meshStandardMaterial color="#c8b89a" metalness={0.4} roughness={0.35} />
      </mesh>
    </group>
  );
}

export default function ResidentialInterior() {
  const wallTex = useTex("/textures/interior-wall.jpg", 2.2, 1.5);
  const floorTex = useTex("/textures/interior-floor.jpg", 3, 3);
  const furniture = useTex("/textures/interior-furniture.jpg", 1, 1, THREE.ClampToEdgeWrapping);
  const windowView = useTex("/textures/window-lunar-view.jpg", 1, 1, THREE.ClampToEdgeWrapping);

  const W = 8.4;
  const D = 7.2;
  const H = 3.15;

  return (
    <group>
      <RendererQuality shadows />
      <ambientLight intensity={0.2} color="#ffe8d0" />
      <hemisphereLight args={["#ffe8c8", "#2a2438", 0.32]} />

      {/* floor */}
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
        <ringGeometry args={[1.7, 1.95, 48]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.3}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ceiling + artificial sunshine */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1c1e28" roughness={0.85} />
      </mesh>
      <CeilingSun width={W} depth={D} y={H - 0.04} />

      {/* walls */}
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
            color="#e8e4dc"
            map={wallTex ?? undefined}
            bumpMap={wallTex ?? undefined}
            bumpScale={0.03}
            roughness={0.65}
            metalness={0.06}
          />
        </mesh>
      ))}

      {/* ─── Window with real lunar / Earth view ─── */}
      <group position={[0, 1.55, -D / 2 + 0.04]}>
        {/* outer frame — rounded feel via thick rails */}
        <mesh position={[0, 0, -0.02]} castShadow>
          <boxGeometry args={[4.05, 2.25, 0.12]} />
          <meshStandardMaterial color="#9aa0b4" metalness={0.55} roughness={0.32} />
        </mesh>
        {/* view photo */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[3.7, 1.95]} />
          <meshStandardMaterial
            map={windowView ?? undefined}
            color={windowView ? "#ffffff" : "#0a1020"}
            emissive={windowView ? "#203040" : "#000000"}
            emissiveIntensity={windowView ? 0.15 : 0}
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
        {/* glass sheen */}
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[3.7, 1.95]} />
          <meshStandardMaterial
            color="#a8d8ff"
            transparent
            opacity={0.08}
            roughness={0.05}
            metalness={0.2}
            depthWrite={false}
          />
        </mesh>
        {/* mullion */}
        <mesh position={[0, 0, 0.05]} castShadow>
          <boxGeometry args={[0.06, 1.95, 0.04]} />
          <meshStandardMaterial color="#c8ccd8" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>

      {/* digital panels */}
      <DigitalPanel position={[-W / 2 + 0.08, 1.7, -0.8]} rotation={[0, Math.PI / 2, 0]} w={1.5} h={0.9} />
      <DigitalPanel position={[W / 2 - 0.08, 1.55, 0.6]} rotation={[0, -Math.PI / 2, 0]} w={1.35} h={0.85} />

      {/* art / furniture photo accent on side wall */}
      <PhotoPanel
        map={furniture}
        width={1.8}
        height={1.05}
        position={[0, 2.05, D / 2 - 0.06]}
        rotation={[0, Math.PI, 0]}
      />

      {/* hydroponics along wall crowns */}
      <HydroponicChannel length={W * 0.88} position={[0, H - 0.24, D / 2 - 0.2]} rotation={[0, Math.PI, 0]} accent={GROW} grow={ACCENT} />
      <HydroponicChannel length={D * 0.82} position={[-W / 2 + 0.2, H - 0.24, 0]} rotation={[0, Math.PI / 2, 0]} accent={GROW} grow={ACCENT} />
      <HydroponicChannel length={D * 0.82} position={[W / 2 - 0.2, H - 0.24, 0]} rotation={[0, -Math.PI / 2, 0]} accent={GROW} grow={ACCENT} />
      <HydroponicChannel length={1.7} position={[-2.55, H - 0.24, -D / 2 + 0.2]} accent={GROW} grow={WARM} />
      <HydroponicChannel length={1.7} position={[2.55, H - 0.24, -D / 2 + 0.2]} accent={GROW} grow={WARM} />

      <LoungeSet furniture={furniture} position={[0, 0, 0.35]} />

      {/* console under window */}
      <mesh position={[0, 0.48, -D / 2 + 0.5]} castShadow>
        <boxGeometry args={[3.0, 0.85, 0.5]} />
        <meshStandardMaterial color="#2c3040" roughness={0.42} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.92, -D / 2 + 0.58]}>
        <boxGeometry args={[1.5, 0.05, 0.28]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.9} />
      </mesh>

      {/* entrance glow (south) */}
      <mesh position={[0, 1.2, D / 2 - 0.04]}>
        <ringGeometry args={[0.65, 0.78, 40]} />
        <meshStandardMaterial
          color={WARM}
          emissive={WARM}
          emissiveIntensity={0.65}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      <ContactShadows position={[0, 0.03, 0]} opacity={0.5} scale={12} blur={2} far={6} resolution={512} frames={1} color="#0a0810" />
    </group>
  );
}
