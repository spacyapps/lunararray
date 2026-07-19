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

/** Soft fabric material helper. */
function fabricMat(map: THREE.Texture, color: string) {
  return (
    <meshStandardMaterial map={map} color={color} roughness={0.92} metalness={0.02} />
  );
}

/**
 * Rounded lounge facing the lunar window (−Z wall).
 * Built in world space: seat faces −Z, back toward +Z (door), table between
 * sofa and window. Capsules / spheres only — no boxy cushions.
 */
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
      {/* —— Sofa: back of room, looking toward window (−Z) —— */}
      {/* plinth / base (soft cylinder slab) */}
      <mesh position={[0, 0.12, 0.15]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.18, 28]} />
        <meshStandardMaterial map={wood} color="#8a7a68" roughness={0.55} />
      </mesh>
      {/* seat — long horizontal capsule along X, slightly toward door so face −Z */}
      <mesh position={[0, 0.36, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.38, 1.85, 10, 20]} />
        {fabricMat(fabric, "#f2eee8")}
      </mesh>
      {/* seat depth bolster (second capsule slightly toward window) */}
      <mesh position={[0, 0.34, -0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.3, 1.7, 10, 18]} />
        {fabricMat(fabric, "#efeae3")}
      </mesh>
      {/* backrest — upright-ish capsule along X, at +Z edge of seat */}
      <mesh position={[0, 0.68, 0.48]} rotation={[0.35, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.26, 1.75, 10, 18]} />
        {fabricMat(fabric, "#ebe6df")}
      </mesh>
      {/* rounded arms (vertical-ish capsules along Z) */}
      <mesh position={[-1.15, 0.48, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.62, 8, 14]} />
        {fabricMat(fabric, "#e8e2da")}
      </mesh>
      <mesh position={[1.15, 0.48, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.62, 8, 14]} />
        {fabricMat(fabric, "#e8e2da")}
      </mesh>
      {/* arm caps */}
      <mesh position={[-1.15, 0.58, -0.22]} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
        {fabricMat(fabric, "#e8e2da")}
      </mesh>
      <mesh position={[1.15, 0.58, -0.22]} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
        {fabricMat(fabric, "#e8e2da")}
      </mesh>
      {/* throw pillows on seat, facing window */}
      <mesh position={[-0.45, 0.55, 0.05]} rotation={[0.15, 0.35, 0.08]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        {fabricMat(fabric, "#f8f4ee")}
      </mesh>
      <mesh
        position={[0.4, 0.52, 0.02]}
        rotation={[0.12, -0.28, -0.06]}
        scale={[1.15, 0.8, 0.72]}
        castShadow
      >
        <sphereGeometry args={[0.2, 16, 12]} />
        {fabricMat(fabric, "#f0ebe4")}
      </mesh>

      {/* —— Oval coffee table between sofa and window —— */}
      <mesh position={[0, 0.32, -1.05]} scale={[1.15, 1, 0.78]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 40]} />
        <meshStandardMaterial map={wood} color="#d4b896" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.15, -1.05]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.28, 18]} />
        <meshStandardMaterial map={wood} color="#c4a878" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.02, -1.05]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.04, 24]} />
        <meshStandardMaterial map={wood} color="#b89870" roughness={0.55} />
      </mesh>

      {/* —— Lounge chair (L of sofa), also faces window (−Z) —— */}
      <group position={[-2.25, 0, -0.15]}>
        <mesh position={[0, 0.32, 0.08]} castShadow>
          <sphereGeometry args={[0.36, 22, 18]} />
          {fabricMat(fabric, "#eee9e2")}
        </mesh>
        <mesh position={[0, 0.58, 0.28]} rotation={[0.45, 0, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.38, 8, 14]} />
          {fabricMat(fabric, "#e8e2da")}
        </mesh>
        <mesh position={[0, 0.1, 0.05]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.1, 16]} />
          <meshStandardMaterial map={wood} color="#a89070" roughness={0.5} />
        </mesh>
      </group>

      {/* —— Lounge chair (R), faces window —— */}
      <group position={[2.2, 0, 0.05]}>
        <mesh position={[0, 0.32, 0.08]} castShadow>
          <sphereGeometry args={[0.34, 22, 18]} />
          {fabricMat(fabric, "#f0ebe5")}
        </mesh>
        <mesh position={[0, 0.56, 0.26]} rotation={[0.42, 0, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.36, 8, 14]} />
          {fabricMat(fabric, "#eae4dc")}
        </mesh>
        <mesh position={[0, 0.1, 0.05]} castShadow>
          <cylinderGeometry args={[0.2, 0.24, 0.1, 16]} />
          <meshStandardMaterial map={wood} color="#a89070" roughness={0.5} />
        </mesh>
      </group>
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

      {/* Hydro at roof height; foliage hangs down from lights/roof into the room */}
      <HydroponicChannel
        length={W * 0.9}
        plantHeight={1.35}
        position={[0, H - 0.06, D / 2 - 0.14]}
        rotation={[0, Math.PI, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.88}
        plantHeight={1.4}
        position={[-W / 2 + 0.14, H - 0.06, 0]}
        rotation={[0, Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      <HydroponicChannel
        length={D * 0.88}
        plantHeight={1.4}
        position={[W / 2 - 0.14, H - 0.06, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        accent={GROW}
        grow={ACCENT}
      />
      {/* short runs flanking the window */}
      <HydroponicChannel
        length={1.6}
        plantHeight={1.15}
        position={[-2.5, H - 0.06, -D / 2 + 0.14]}
        accent={GROW}
        grow={WARM}
      />
      <HydroponicChannel
        length={1.6}
        plantHeight={1.15}
        position={[2.5, H - 0.06, -D / 2 + 0.14]}
        accent={GROW}
        grow={WARM}
      />

      {/* Lounge at back of room, seats face the window (−Z) */}
      <LoungeSet fabric={fabric} wood={wood} position={[0, 0, 0.85]} />

      {/* low oval console under window — rounded, doesn't block the view */}
      <mesh position={[0, 0.28, -D / 2 + 0.42]} scale={[1.4, 1, 0.55]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.58, 0.42, 32]} />
        <meshStandardMaterial map={wood} color="#4a4658" metalness={0.22} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.52, -D / 2 + 0.42]} scale={[1.15, 1, 0.45]}>
        <cylinderGeometry args={[0.42, 0.42, 0.03, 28]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.85} />
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
