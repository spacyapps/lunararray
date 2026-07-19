"use client";

// LA-08 residential bay — multi-mesh furniture with photoreal fabric/wood
// skins, recessed skylight with fake sky depth, real window view, hydro strips.

import { Suspense, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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
  fabric: THREE.Texture,
  wood: THREE.Texture,
  windowView: THREE.Texture,
  sky: THREE.Texture,
) {
  for (const t of [wall, floor, fabric, wood, windowView, sky]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
  }
  wall.wrapS = wall.wrapT = THREE.RepeatWrapping;
  wall.repeat.set(2.2, 1.5);
  floor.wrapS = floor.wrapT = THREE.RepeatWrapping;
  floor.repeat.set(3, 3);
  fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping;
  fabric.repeat.set(2, 2);
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(1.5, 1.5);
  windowView.wrapS = windowView.wrapT = THREE.ClampToEdgeWrapping;
  sky.wrapS = sky.wrapT = THREE.ClampToEdgeWrapping;
}

function useMaps() {
  const [wall, floor, fabric, wood, windowView, sky] = useTexture([
    "/textures/interior-wall.jpg",
    "/textures/interior-floor.jpg",
    "/textures/fabric-beige.jpg",
    "/textures/wood-oak.jpg",
    "/textures/window-lunar-view.jpg",
    "/textures/interior-sky.jpg",
  ]);
  useLayoutEffect(() => {
    prepMaps(wall, floor, fabric, wood, windowView, sky);
  }, [wall, floor, fabric, wood, windowView, sky]);
  return { wall, floor, fabric, wood, windowView, sky };
}

/** Recessed skylight well with photoreal sky plane pushed back for depth. */
function SkylightWell({
  sky,
  width,
  depth,
  ceilingY,
}: {
  sky: THREE.Texture;
  width: number;
  depth: number;
  ceilingY: number;
}) {
  const skyRef = useRef<THREE.Mesh>(null);
  // Slight parallax so sky feels distant, not painted on the ceiling
  useFrame(({ camera }) => {
    if (!skyRef.current) return;
    const lx = THREE.MathUtils.clamp(camera.position.x * 0.04, -0.35, 0.35);
    const lz = THREE.MathUtils.clamp(camera.position.z * 0.04, -0.35, 0.35);
    skyRef.current.position.x = lx;
    skyRef.current.position.z = lz;
  });

  const wellW = width * 0.55;
  const wellD = depth * 0.4;
  const wellDepth = 0.85;

  return (
    <group position={[0, ceilingY, 0]}>
      {/* dark ceiling slab */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#14161e" roughness={0.9} />
      </mesh>
      {/* well walls (creates real recess) */}
      {(
        [
          [0, -wellDepth / 2, -wellD / 2, wellW, wellDepth, 0.06],
          [0, -wellDepth / 2, wellD / 2, wellW, wellDepth, 0.06],
          [-wellW / 2, -wellDepth / 2, 0, 0.06, wellDepth, wellD],
          [wellW / 2, -wellDepth / 2, 0, 0.06, wellDepth, wellD],
        ] as const
      ).map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color="#d8d2c8" roughness={0.55} metalness={0.1} />
        </mesh>
      ))}
      {/* glowing rim at well opening */}
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(wellW, wellD) * 0.48, Math.min(wellW, wellD) * 0.52, 4]} />
        <meshBasicMaterial color={SUN} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* sky plate far up the well */}
      <mesh ref={skyRef} position={[0, -wellDepth - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[wellW * 1.15, wellD * 1.15]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      {/* soft fill from the “sun” */}
      <pointLight position={[0, -0.5, 0]} intensity={28} color={SUN} distance={12} decay={2} />
      <pointLight position={[0.6, -0.4, 0.2]} intensity={10} color={WARM} distance={8} decay={2} />
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
      <mesh position={[0, h * 0.3, 0.01]}>
        <planeGeometry args={[w * 0.85, 0.04]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.65} />
      </mesh>
      <pointLight position={[0, 0, 0.25]} intensity={2.2} color="#5cd6ff" distance={3.2} decay={2} />
    </group>
  );
}

/** Real 3D lounge pieces skinned with fabric + wood maps. */
function LoungeSet({
  fabric,
  wood,
  position,
}: {
  fabric: THREE.Texture;
  wood: THREE.Texture;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* sofa base */}
      <mesh position={[0, 0.28, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.42, 1.05]} />
        <meshStandardMaterial map={fabric} color="#f0ebe4" roughness={0.88} />
      </mesh>
      {/* sofa back */}
      <mesh position={[0, 0.62, -0.38]} castShadow>
        <boxGeometry args={[2.7, 0.72, 0.28]} />
        <meshStandardMaterial map={fabric} color="#ebe6df" roughness={0.88} />
      </mesh>
      {/* arms */}
      <mesh position={[-1.25, 0.48, 0.05]} castShadow>
        <boxGeometry args={[0.22, 0.5, 0.95]} />
        <meshStandardMaterial map={fabric} color="#e8e2da" roughness={0.88} />
      </mesh>
      <mesh position={[1.25, 0.48, 0.05]} castShadow>
        <boxGeometry args={[0.22, 0.5, 0.95]} />
        <meshStandardMaterial map={fabric} color="#e8e2da" roughness={0.88} />
      </mesh>
      {/* cushions — slightly offset for life */}
      <mesh position={[-0.55, 0.55, 0.15]} rotation={[0.12, 0.15, 0]} castShadow>
        <boxGeometry args={[0.85, 0.18, 0.55]} />
        <meshStandardMaterial map={fabric} color="#f5f0ea" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 0.55, 0.12]} rotation={[0.1, -0.12, 0]} castShadow>
        <boxGeometry args={[0.85, 0.18, 0.55]} />
        <meshStandardMaterial map={fabric} color="#f2ede7" roughness={0.9} />
      </mesh>
      {/* coffee table */}
      <mesh position={[0, 0.32, 1.35]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.07, 0.75]} />
        <meshStandardMaterial map={wood} color="#d4b896" roughness={0.45} metalness={0.08} />
      </mesh>
      {(
        [
          [-0.5, 0.14, 1.15],
          [0.5, 0.14, 1.15],
          [-0.5, 0.14, 1.55],
          [0.5, 0.14, 1.55],
        ] as const
      ).map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.28, 12]} />
          <meshStandardMaterial map={wood} color="#c4a878" roughness={0.5} />
        </mesh>
      ))}
      {/* side chair */}
      <mesh position={[-2.4, 0.28, 1.0]} castShadow>
        <boxGeometry args={[0.75, 0.38, 0.75]} />
        <meshStandardMaterial map={fabric} color="#ebe6e0" roughness={0.88} />
      </mesh>
      <mesh position={[-2.4, 0.58, 0.7]} castShadow>
        <boxGeometry args={[0.75, 0.55, 0.18]} />
        <meshStandardMaterial map={fabric} color="#e6e0d8" roughness={0.88} />
      </mesh>
    </group>
  );
}

function InteriorScene() {
  const { wall, floor, fabric, wood, windowView, sky } = useMaps();

  const W = 8.6;
  const D = 7.4;
  const H = 3.25;

  return (
    <group>
      <RendererQuality shadows />
      <ambientLight intensity={0.2} color="#ffe8d0" />
      <hemisphereLight args={["#ffe8c8", "#2a2438", 0.32]} />

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

      <SkylightWell sky={sky} width={W} depth={D} ceilingY={H} />

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

      {/* Window — lunar view */}
      <group position={[0, 1.55, -D / 2 + 0.03]}>
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
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[3.9, 2.05]} />
          <meshBasicMaterial map={windowView} toneMapped={false} />
        </mesh>
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

      <DigitalPanel position={[-W / 2 + 0.07, 1.65, -0.9]} rotation={[0, Math.PI / 2, 0]} />
      <DigitalPanel position={[W / 2 - 0.07, 1.5, 0.55]} rotation={[0, -Math.PI / 2, 0]} w={1.4} h={0.85} />

      {/* wall art — small framed crop of warm tones, not full-room poster */}
      <mesh position={[2.2, 1.85, D / 2 - 0.06]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.1, 0.75]} />
        <meshStandardMaterial map={wood} color="#c4a888" roughness={0.6} />
      </mesh>
      <mesh position={[2.2, 1.85, D / 2 - 0.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.18, 0.83]} />
        <meshStandardMaterial color="#2a2c34" metalness={0.4} roughness={0.4} />
      </mesh>

      <HydroponicChannel
        length={W * 0.9}
        plantHeight={0.55}
        position={[0, H - 0.32, D / 2 - 0.18]}
        rotation={[0, Math.PI, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.85}
        plantHeight={0.5}
        position={[-W / 2 + 0.18, H - 0.32, 0]}
        rotation={[0, Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.85}
        plantHeight={0.5}
        position={[W / 2 - 0.18, H - 0.32, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />

      <LoungeSet fabric={fabric} wood={wood} position={[0, 0, 0.15]} />

      {/* console under window */}
      <mesh position={[0, 0.4, -D / 2 + 0.48]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.7, 0.48]} />
        <meshStandardMaterial map={wood} color="#3a3848" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.78, -D / 2 + 0.55]}>
        <boxGeometry args={[1.7, 0.04, 0.24]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.95} />
      </mesh>

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
        opacity={0.5}
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
