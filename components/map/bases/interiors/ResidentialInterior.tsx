"use client";

// LA-08 residential interior — photo-first apartment bay.
// Hero surfaces are photoreal maps (window view, furniture plate, plant strips).
// Geometry is frames / trays only — no green poly blobs or bare colored boxes as furniture.

import { Suspense, useLayoutEffect } from "react";
import * as THREE from "three";
import { ContactShadows, useTexture } from "@react-three/drei";
import { HydroponicChannel } from "../parts";
import { RendererQuality } from "../BaseLighting";

const WARM = "#ffd9a0";
const ACCENT = "#c48aff";
const GROW = "#7cffc4";
const SUN = "#ffe8c4";

function prepMaps(
  wall: THREE.Texture,
  floor: THREE.Texture,
  furniture: THREE.Texture,
  windowView: THREE.Texture,
  greenery: THREE.Texture,
) {
  for (const t of [wall, floor, furniture, windowView, greenery]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
  }
  wall.wrapS = wall.wrapT = THREE.RepeatWrapping;
  wall.repeat.set(2.2, 1.5);
  floor.wrapS = floor.wrapT = THREE.RepeatWrapping;
  floor.repeat.set(3, 3);
  furniture.wrapS = furniture.wrapT = THREE.ClampToEdgeWrapping;
  windowView.wrapS = windowView.wrapT = THREE.ClampToEdgeWrapping;
  greenery.wrapS = THREE.RepeatWrapping;
  greenery.wrapT = THREE.ClampToEdgeWrapping;
}

function useMaps() {
  const [wall, floor, furniture, windowView, greenery] = useTexture([
    "/textures/interior-wall.jpg",
    "/textures/interior-floor.jpg",
    "/textures/interior-furniture.jpg",
    "/textures/window-lunar-view.jpg",
    "/textures/hydroponic-greenery.jpg",
  ]);
  useLayoutEffect(() => {
    prepMaps(wall, floor, furniture, windowView, greenery);
  }, [wall, floor, furniture, windowView, greenery]);
  return { wall, floor, furniture, windowView, greenery };
}

function CeilingSun({ width, depth, y }: { width: number; depth: number; y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[width * 0.78, 0.05, depth * 0.52]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.4} roughness={0.35} />
      </mesh>
      {/* soft circular “skylight” discs — reads as artificial sun, not a hard slab */}
      {(
        [
          [0, -0.06, 0, 2.4],
          [-1.6, -0.06, 0.4, 1.1],
          [1.5, -0.06, -0.35, 1.0],
        ] as const
      ).map(([x, yy, z, r], i) => (
        <mesh key={i} position={[x, yy, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r, 40]} />
          <meshStandardMaterial
            color={SUN}
            emissive={SUN}
            emissiveIntensity={i === 0 ? 1.5 : 1.1}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <pointLight position={[0, -0.45, 0]} intensity={32} color={SUN} distance={14} decay={2} />
      <pointLight position={[-1.4, -0.5, 0.6]} intensity={10} color={SUN} distance={8} decay={2} />
      <pointLight position={[1.3, -0.5, -0.4]} intensity={8} color={WARM} distance={7} decay={2} />
    </group>
  );
}

function DigitalPanel({
  position,
  rotation,
  w = 1.55,
  h = 0.92,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  w?: number;
  h?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.025]} castShadow>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.05]} />
        <meshStandardMaterial color="#12141c" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color="#071018"
          emissive="#3a9fd4"
          emissiveIntensity={0.55}
          roughness={0.2}
          metalness={0.25}
        />
      </mesh>
      {/* soft UI bands */}
      <mesh position={[0, h * 0.3, 0.01]}>
        <planeGeometry args={[w * 0.85, 0.04]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.65} />
      </mesh>
      <mesh position={[-w * 0.18, -0.05, 0.01]}>
        <planeGeometry args={[w * 0.4, h * 0.42]} />
        <meshBasicMaterial color="#7cffc4" transparent opacity={0.1} />
      </mesh>
      <pointLight position={[0, 0, 0.25]} intensity={2.2} color="#5cd6ff" distance={3.2} decay={2} />
    </group>
  );
}

/** Lounge is a photo plate of a real room + shallow depth cards — not poly cushions. */
function LoungeHero({
  furniture,
  position,
}: {
  furniture: THREE.Texture;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Main photoreal living-room plate (hero look) */}
      <mesh position={[0, 1.15, -0.55]} castShadow>
        <planeGeometry args={[4.6, 2.4]} />
        <meshStandardMaterial map={furniture} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* subtle frame / shadow shelf under the plate */}
      <mesh position={[0, -0.02, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[4.7, 0.08, 0.35]} />
        <meshStandardMaterial color="#2a2c36" metalness={0.4} roughness={0.45} />
      </mesh>
      {/* low console in front — dark metal with emissive edge */}
      <mesh position={[0, 0.32, 0.55]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.55, 0.7]} />
        <meshStandardMaterial color="#1e222c" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0.72]}>
        <boxGeometry args={[1.6, 0.04, 0.22]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.85} />
      </mesh>
    </group>
  );
}

function InteriorScene() {
  const { wall, floor, furniture, windowView } = useMaps();

  const W = 8.6;
  const D = 7.4;
  const H = 3.2;

  return (
    <group>
      <RendererQuality shadows />
      <ambientLight intensity={0.22} color="#ffe8d0" />
      <hemisphereLight args={["#ffe8c8", "#2a2438", 0.35]} />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floor}
          color="#ffffff"
          bumpMap={floor}
          bumpScale={0.035}
          roughness={0.52}
          metalness={0.1}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.65, 1.9, 48]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.28}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ceiling + artificial sunshine */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#161820" roughness={0.88} />
      </mesh>
      <CeilingSun width={W} depth={D} y={H - 0.03} />

      {/* walls */}
      {(
        [
          { pos: [0, H / 2, -D / 2] as [number, number, number], rot: [0, 0, 0] as [number, number, number], w: W },
          { pos: [0, H / 2, D / 2] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], w: W },
          { pos: [-W / 2, H / 2, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], w: D },
          { pos: [W / 2, H / 2, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], w: D },
        ] as const
      ).map((wallSpec, i) => (
        <mesh key={i} position={wallSpec.pos} rotation={wallSpec.rot} receiveShadow>
          <planeGeometry args={[wallSpec.w, H]} />
          <meshStandardMaterial
            map={wall}
            color="#f2efe8"
            bumpMap={wall}
            bumpScale={0.025}
            roughness={0.62}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* ─── Window: full photoreal lunar / Earth view ─── */}
      <group position={[0, 1.55, -D / 2 + 0.03]}>
        {/* frame rails only (no solid slab covering the view) */}
        {(
          [
            [0, 1.08, 0, 4.15, 0.12, 0.1],
            [0, -1.08, 0, 4.15, 0.12, 0.1],
            [-2.05, 0, 0, 0.12, 2.28, 0.1],
            [2.05, 0, 0, 0.12, 2.28, 0.1],
          ] as const
        ).map(([x, y, z, sx, sy, sz], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial color="#a8aebc" metalness={0.55} roughness={0.3} />
          </mesh>
        ))}
        {/* the view itself */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[3.9, 2.05]} />
          <meshBasicMaterial map={windowView} toneMapped={false} />
        </mesh>
        {/* thin glass sheen */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[3.9, 2.05]} />
          <meshStandardMaterial
            color="#cfe8ff"
            transparent
            opacity={0.06}
            roughness={0.05}
            metalness={0.15}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* digital panels */}
      <DigitalPanel position={[-W / 2 + 0.07, 1.65, -0.9]} rotation={[0, Math.PI / 2, 0]} />
      <DigitalPanel position={[W / 2 - 0.07, 1.5, 0.55]} rotation={[0, -Math.PI / 2, 0]} w={1.4} h={0.85} />

      {/* wall-crown hydroponics — photo strips only */}
      <HydroponicChannel
        length={W * 0.9}
        plantHeight={0.62}
        position={[0, H - 0.28, D / 2 - 0.18]}
        rotation={[0, Math.PI, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.85}
        plantHeight={0.58}
        position={[-W / 2 + 0.18, H - 0.28, 0]}
        rotation={[0, Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.85}
        plantHeight={0.58}
        position={[W / 2 - 0.18, H - 0.28, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={1.6}
        plantHeight={0.45}
        position={[-2.5, H - 0.28, -D / 2 + 0.18]}
        accent={GROW}
        grow={WARM}
      />
      <HydroponicChannel
        length={1.6}
        plantHeight={0.45}
        position={[2.5, H - 0.28, -D / 2 + 0.18]}
        accent={GROW}
        grow={WARM}
      />

      <LoungeHero furniture={furniture} position={[0, 0, 0.2]} />

      {/* console under window */}
      <mesh position={[0, 0.42, -D / 2 + 0.48]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.72, 0.48]} />
        <meshStandardMaterial color="#222632" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.8, -D / 2 + 0.55]}>
        <boxGeometry args={[1.7, 0.04, 0.24]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.95} />
      </mesh>

      {/* entrance ring */}
      <mesh position={[0, 1.15, D / 2 - 0.04]}>
        <ringGeometry args={[0.62, 0.76, 40]} />
        <meshStandardMaterial
          color={WARM}
          emissive={WARM}
          emissiveIntensity={0.6}
          transparent
          opacity={0.48}
          side={THREE.DoubleSide}
        />
      </mesh>

      <ContactShadows
        position={[0, 0.03, 0]}
        opacity={0.48}
        scale={12}
        blur={2}
        far={6}
        resolution={512}
        frames={1}
        color="#0a0810"
      />
    </group>
  );
}

export default function ResidentialInterior() {
  return (
    <Suspense fallback={null}>
      <InteriorScene />
    </Suspense>
  );
}
