"use client";

// LA-08 residential bay — zen Japanese lounge: tatami, living-wall crown,
// clear lunar window, sumi-e scrolls, tokonoma niche, soft ambient light.

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows, RoundedBox, useTexture } from "@react-three/drei";
import { CeilingPlantShelf, buildTatamiTexture } from "../parts";
import { RendererQuality } from "../BaseLighting";

const WARM = "#ffd9a0";
const ACCENT = "#c48aff";
const GROW = "#7cffc4";
const SUN = "#ffe8c4";
const WOOD = "#a89070";
const WOOD_DARK = "#6e5a42";

function prepMaps(
  fabric: THREE.Texture,
  wood: THREE.Texture,
  windowView: THREE.Texture,
  sky: THREE.Texture,
  scrollSumi: THREE.Texture,
  scrollKanji: THREE.Texture,
) {
  for (const t of [fabric, wood, windowView, sky, scrollSumi, scrollKanji]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
  }
  fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping;
  fabric.repeat.set(2, 2);
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(1.5, 1.5);
  windowView.wrapS = windowView.wrapT = THREE.ClampToEdgeWrapping;
  sky.wrapS = sky.wrapT = THREE.ClampToEdgeWrapping;
  scrollSumi.wrapS = scrollSumi.wrapT = THREE.ClampToEdgeWrapping;
  scrollKanji.wrapS = scrollKanji.wrapT = THREE.ClampToEdgeWrapping;
}

function useMaps() {
  const [fabric, wood, windowView, sky, scrollSumi, scrollKanji] = useTexture([
    "/textures/fabric-beige.jpg",
    "/textures/wood-oak.jpg",
    "/textures/window-zen-lunar.jpg",
    "/textures/interior-sky.jpg",
    "/textures/zen-scroll-sumi.jpg",
    "/textures/zen-scroll-kanji.jpg",
  ]);
  useLayoutEffect(() => {
    prepMaps(fabric, wood, windowView, sky, scrollSumi, scrollKanji);
  }, [fabric, wood, windowView, sky, scrollSumi, scrollKanji]);
  const tatami = useMemo(() => {
    const t = buildTatamiTexture(512);
    t.repeat.set(4, 3.5);
    return t;
  }, []);
  return { fabric, wood, windowView, sky, scrollSumi, scrollKanji, tatami };
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
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5f3ee" roughness={0.88} />
      </mesh>
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
          <meshStandardMaterial color="#f7f5f0" roughness={0.58} metalness={0.06} />
        </mesh>
      ))}
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(wellW, wellD) * 0.48, Math.min(wellW, wellD) * 0.52, 4]} />
        <meshBasicMaterial color={SUN} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={skyRef} position={[0, -wellDepth - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[wellW * 1.15, wellD * 1.15]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.5, 0]} intensity={24} color={SUN} distance={12} decay={2} />
      <pointLight position={[0.6, -0.4, 0.2]} intensity={8} color={WARM} distance={8} decay={2} />
    </group>
  );
}

/** Hanging scroll — wood jiku rods + washi art. */
function HangingScroll({
  map,
  position,
  rotation,
  w = 0.55,
  h = 1.15,
}: {
  map: THREE.Texture;
  position: [number, number, number];
  rotation?: [number, number, number];
  w?: number;
  h?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* washi panel */}
      <mesh position={[0, 0, 0.01]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} color="#f7f2e8" roughness={0.9} />
      </mesh>
      {/* top rod */}
      <mesh position={[0, h / 2 + 0.02, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, w + 0.08, 12]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.55} />
      </mesh>
      {/* bottom rod */}
      <mesh position={[0, -h / 2 - 0.02, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, w + 0.1, 12]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.55} />
      </mesh>
      {/* hanging cord nubs */}
      <mesh position={[-w * 0.28, h / 2 + 0.05, 0.02]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#2a2418" roughness={0.6} />
      </mesh>
      <mesh position={[w * 0.28, h / 2 + 0.05, 0.02]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#2a2418" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Tokonoma-style recessed alcove with wood trim, shelf, vase + scroll. */
function Tokonoma({
  wood,
  scroll,
  position,
  rotation,
}: {
  wood: THREE.Texture;
  scroll: THREE.Texture;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* recessed back */}
      <mesh position={[0, 0.9, -0.08]}>
        <planeGeometry args={[1.35, 1.9]} />
        <meshStandardMaterial color="#f3efe6" roughness={0.85} />
      </mesh>
      {/* side posts */}
      <mesh position={[-0.7, 0.95, 0]} castShadow>
        <boxGeometry args={[0.06, 2.0, 0.12]} />
        <meshStandardMaterial map={wood} color={WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[0.7, 0.95, 0]} castShadow>
        <boxGeometry args={[0.06, 2.0, 0.12]} />
        <meshStandardMaterial map={wood} color={WOOD} roughness={0.55} />
      </mesh>
      {/* header beam */}
      <mesh position={[0, 1.95, 0.02]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.14]} />
        <meshStandardMaterial map={wood} color={WOOD_DARK} roughness={0.5} />
      </mesh>
      {/* floor of alcove */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[1.35, 0.1, 0.28]} />
        <meshStandardMaterial map={wood} color={WOOD_DARK} roughness={0.48} />
      </mesh>
      {/* raised display shelf */}
      <mesh position={[0, 0.42, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.04, 0.22]} />
        <meshStandardMaterial map={wood} color={WOOD} roughness={0.5} />
      </mesh>
      {/* ceramic vase */}
      <mesh position={[-0.18, 0.62, 0.02]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.38, 16]} />
        <meshStandardMaterial color="#d8d0c4" roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh position={[-0.18, 0.84, 0.02]}>
        <cylinderGeometry args={[0.04, 0.05, 0.08, 12]} />
        <meshStandardMaterial color="#c8c0b4" roughness={0.5} />
      </mesh>
      {/* ikebana stem suggestion */}
      <mesh position={[-0.16, 1.05, 0.02]} rotation={[0.15, 0, 0.2]}>
        <cylinderGeometry args={[0.008, 0.01, 0.45, 6]} />
        <meshStandardMaterial color="#3a5a38" roughness={0.8} />
      </mesh>
      <mesh position={[-0.12, 1.22, 0.04]} castShadow>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#4a7a48" roughness={0.75} />
      </mesh>
      {/* small scroll in alcove */}
      <HangingScroll map={scroll} position={[0.28, 1.15, 0.01]} w={0.38} h={0.85} />
    </group>
  );
}

/** Soft paper lantern. */
function PaperLantern({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.16, 20, 16]} />
        <meshStandardMaterial
          color="#f5ecd8"
          emissive="#ffe8c4"
          emissiveIntensity={0.55}
          roughness={0.85}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.04, 12]} />
        <meshStandardMaterial color="#3a3028" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.04, 12]} />
        <meshStandardMaterial color="#3a3028" roughness={0.6} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={3.5} color="#ffe2b0" distance={4} decay={2} />
    </group>
  );
}

/** Habitat digital screen + slim control rail — zen-tech, not neon arcade. */
function HabitatControlPanel({
  wood,
  position,
  rotation,
}: {
  wood: THREE.Texture;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* wood surround */}
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[1.35, 1.05, 0.06]} />
        <meshStandardMaterial map={wood} color="#6a5a48" roughness={0.5} metalness={0.08} />
      </mesh>
      {/* main display */}
      <mesh position={[0, 0.08, 0.02]}>
        <planeGeometry args={[1.15, 0.72]} />
        <meshStandardMaterial
          color="#0a1018"
          emissive="#2a6a8a"
          emissiveIntensity={0.45}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>
      {/* soft UI bands */}
      {(
        [
          [0, 0.28, 0.9, 0.03],
          [0, 0.12, 0.75, 0.02],
          [0, -0.02, 0.55, 0.02],
          [-0.28, -0.18, 0.35, 0.08],
          [0.22, -0.18, 0.28, 0.08],
        ] as const
      ).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.025]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial
            color={i < 3 ? ACCENT : GROW}
            transparent
            opacity={i < 3 ? 0.55 : 0.4}
          />
        </mesh>
      ))}
      {/* status glyph */}
      <mesh position={[0.42, 0.28, 0.03]}>
        <circleGeometry args={[0.04, 12]} />
        <meshBasicMaterial color={GROW} />
      </mesh>
      {/* control strip under screen */}
      <mesh position={[0, -0.42, 0.03]} castShadow>
        <boxGeometry args={[1.1, 0.12, 0.04]} />
        <meshStandardMaterial color="#1a1c22" metalness={0.45} roughness={0.35} />
      </mesh>
      {[-0.35, -0.12, 0.12, 0.35].map((x, i) => (
        <mesh key={`btn-${i}`} position={[x, -0.42, 0.06]}>
          <cylinderGeometry args={[0.028, 0.028, 0.02, 12]} />
          <meshStandardMaterial
            color={i === 0 ? GROW : "#3a4050"}
            emissive={i === 0 ? GROW : "#000000"}
            emissiveIntensity={i === 0 ? 0.6 : 0}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
      <pointLight position={[0, 0.1, 0.35]} intensity={2.4} color="#5cb8d8" distance={2.8} decay={2} />
    </group>
  );
}

/** Quiet zen corner: low pedestal, ceramic, stone, small plant. */
function ZenCorner({
  wood,
  position,
  rotation,
}: {
  wood: THREE.Texture;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* low wood pedestal */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.22, 24]} />
        <meshStandardMaterial map={wood} color="#8a7a62" roughness={0.55} />
      </mesh>
      {/* ceramic vessel */}
      <mesh position={[-0.06, 0.38, 0.04]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.32, 14]} />
        <meshStandardMaterial color="#e0d8cc" roughness={0.42} metalness={0.04} />
      </mesh>
      <mesh position={[-0.06, 0.56, 0.04]}>
        <cylinderGeometry args={[0.045, 0.055, 0.06, 12]} />
        <meshStandardMaterial color="#d4ccc0" roughness={0.45} />
      </mesh>
      {/* ikebana stem + leaf */}
      <mesh position={[-0.04, 0.78, 0.05]} rotation={[0.2, 0, 0.15]}>
        <cylinderGeometry args={[0.008, 0.012, 0.38, 6]} />
        <meshStandardMaterial color="#3a5a38" roughness={0.8} />
      </mesh>
      <mesh position={[0.02, 0.92, 0.08]} castShadow>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#4a7a48" roughness={0.75} />
      </mesh>
      {/* river stones */}
      {(
        [
          [0.14, 0.28, -0.06, 0.06],
          [0.2, 0.26, 0.06, 0.045],
          [0.1, 0.25, 0.1, 0.035],
        ] as const
      ).map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.55, 0.85]} castShadow>
          <sphereGeometry args={[s, 10, 8]} />
          <meshStandardMaterial color={i % 2 ? "#7a766e" : "#9a968c"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Low shoji-style wood rail / picture rail detail on a wall. */
function WoodRail({
  wood,
  length,
  position,
  rotation,
}: {
  wood: THREE.Texture;
  length: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[length, 0.04, 0.05]} />
        <meshStandardMaterial map={wood} color={WOOD} roughness={0.55} />
      </mesh>
    </group>
  );
}

const BOOK_SPINES = [
  "#5c4a3a",
  "#7a6a55",
  "#3d4a3a",
  "#8b7355",
  "#4a3f38",
  "#6b5a48",
  "#2f3a32",
  "#9a8470",
  "#4a5560",
  "#6e5040",
  "#3a4540",
  "#857060",
];

/** Floating wood shelf with a row of books (zen / japandi neutrals). */
function BookShelf({
  wood,
  position,
  rotation,
  width = 1.35,
  shelves = 2,
  seed = 1,
}: {
  wood: THREE.Texture;
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  shelves?: number;
  seed?: number;
}) {
  const depth = 0.22;
  const thick = 0.035;
  const gap = 0.38;
  const sideH = shelves * gap + thick;

  const books: { x: number; y: number; w: number; h: number; d: number; color: string }[] = [];
  for (let s = 0; s < shelves; s++) {
    let x = -width * 0.42;
    const y = thick + s * gap + 0.02;
    let bi = 0;
    while (x < width * 0.42) {
      const r = Math.sin(seed * 12.9 + s * 7.1 + bi * 3.3) * 0.5 + 0.5;
      const bw = 0.045 + r * 0.05;
      const bh = 0.2 + r * 0.12;
      const bd = 0.14 + r * 0.04;
      if (x + bw > width * 0.42) break;
      books.push({
        x: x + bw / 2,
        y: y + bh / 2,
        w: bw,
        h: bh,
        d: bd,
        color: BOOK_SPINES[(seed + s * 5 + bi) % BOOK_SPINES.length],
      });
      x += bw + 0.012 + r * 0.02;
      bi++;
    }
  }

  return (
    <group position={position} rotation={rotation}>
      {/* side uprights */}
      <mesh position={[-width / 2, sideH / 2, 0]} castShadow>
        <boxGeometry args={[0.04, sideH, depth + 0.02]} />
        <meshStandardMaterial map={wood} color={WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[width / 2, sideH / 2, 0]} castShadow>
        <boxGeometry args={[0.04, sideH, depth + 0.02]} />
        <meshStandardMaterial map={wood} color={WOOD} roughness={0.55} />
      </mesh>
      {/* shelf boards */}
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <mesh key={`board-${i}`} position={[0, i * gap, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, thick, depth]} />
          <meshStandardMaterial map={wood} color={WOOD} roughness={0.52} />
        </mesh>
      ))}
      {/* books */}
      {books.map((b, i) => (
        <mesh key={`book-${i}`} position={[b.x, b.y, depth * 0.15]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.75} metalness={0.02} />
        </mesh>
      ))}
      {/* small ceramic on top shelf end */}
      <mesh position={[width * 0.28, shelves * gap + 0.08, 0.02]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.12, 12]} />
        <meshStandardMaterial color="#d4cbc0" roughness={0.45} />
      </mesh>
    </group>
  );
}

function fabricMat(map: THREE.Texture, color: string) {
  return <meshStandardMaterial map={map} color={color} roughness={0.92} metalness={0.02} />;
}

/**
 * Low zen sofa facing the window (−Z) — rectangular with small rounded corners.
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
  const seatW = 2.35;
  const seatD = 0.88;
  const seatH = 0.16;
  const backH = 0.52;
  const armW = 0.14;
  const armH = 0.32;
  // Small radius keeps the box silhouette, softens edges only
  const r = 0.045;
  const rSoft = 0.055;

  return (
    <group position={position}>
      {/* wood plinth */}
      <RoundedBox
        args={[seatW + 0.12, 0.1, seatD + 0.08]}
        radius={0.03}
        smoothness={4}
        position={[0, 0.08, 0.12]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial map={wood} color="#8a7a68" roughness={0.55} />
      </RoundedBox>
      {/* seat cushion */}
      <RoundedBox
        args={[seatW, seatH, seatD]}
        radius={r}
        smoothness={4}
        position={[0, 0.22, 0.08]}
        castShadow
        receiveShadow
      >
        {fabricMat(fabric, "#f0ebe4")}
      </RoundedBox>
      {/* seat top pad */}
      <RoundedBox
        args={[seatW - 0.12, 0.06, seatD - 0.14]}
        radius={0.03}
        smoothness={4}
        position={[0, 0.32, 0.06]}
        castShadow
      >
        {fabricMat(fabric, "#f5f0ea")}
      </RoundedBox>
      {/* backrest */}
      <RoundedBox
        args={[seatW - 0.08, backH, 0.16]}
        radius={r}
        smoothness={4}
        position={[0, 0.48, 0.48]}
        castShadow
      >
        {fabricMat(fabric, "#ebe6df")}
      </RoundedBox>
      {/* back cushion pad */}
      <RoundedBox
        args={[seatW - 0.28, backH - 0.12, 0.1]}
        radius={0.035}
        smoothness={4}
        position={[0, 0.5, 0.38]}
        castShadow
      >
        {fabricMat(fabric, "#f0ebe5")}
      </RoundedBox>
      {/* arms */}
      <RoundedBox
        args={[armW, armH, seatD - 0.06]}
        radius={0.035}
        smoothness={4}
        position={[-(seatW / 2 - armW / 2), 0.34, 0.08]}
        castShadow
      >
        {fabricMat(fabric, "#e8e2da")}
      </RoundedBox>
      <RoundedBox
        args={[armW, armH, seatD - 0.06]}
        radius={0.035}
        smoothness={4}
        position={[seatW / 2 - armW / 2, 0.34, 0.08]}
        castShadow
      >
        {fabricMat(fabric, "#e8e2da")}
      </RoundedBox>
      {/* throw pillows */}
      <RoundedBox
        args={[0.38, 0.28, 0.1]}
        radius={rSoft}
        smoothness={4}
        position={[-0.5, 0.48, 0.12]}
        rotation={[0.12, 0.25, 0.05]}
        castShadow
      >
        {fabricMat(fabric, "#f8f4ee")}
      </RoundedBox>
      <RoundedBox
        args={[0.36, 0.26, 0.09]}
        radius={rSoft}
        smoothness={4}
        position={[0.45, 0.46, 0.1]}
        rotation={[0.1, -0.2, -0.04]}
        castShadow
      >
        {fabricMat(fabric, "#f2ede7")}
      </RoundedBox>

      {/* low oval chabudai-style table */}
      <mesh position={[0, 0.28, -1.05]} scale={[1.15, 1, 0.78]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 40]} />
        <meshStandardMaterial map={wood} color="#d4b896" roughness={0.4} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.14, -1.05]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.22, 18]} />
        <meshStandardMaterial map={wood} color="#c4a878" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.02, -1.05]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.04, 24]} />
        <meshStandardMaterial map={wood} color="#b89870" roughness={0.55} />
      </mesh>

      {/* zabuton — flat with soft corners */}
      <RoundedBox
        args={[0.58, 0.08, 0.58]}
        radius={0.04}
        smoothness={4}
        position={[-1.85, 0.06, -0.55]}
        castShadow
      >
        {fabricMat(fabric, "#e8e0d4")}
      </RoundedBox>
      <RoundedBox
        args={[0.58, 0.08, 0.58]}
        radius={0.04}
        smoothness={4}
        position={[1.85, 0.06, -0.45]}
        castShadow
      >
        {fabricMat(fabric, "#ebe4d8")}
      </RoundedBox>
    </group>
  );
}

function InteriorScene() {
  const { fabric, wood, windowView, sky, scrollSumi, scrollKanji, tatami } = useMaps();

  const W = 8.6;
  const D = 7.4;
  const H = 4.05; // taller bay — more air under the plant crown

  // Window geometry — keep greenery clear of this
  const winW = 4.0;
  const winH = 2.25;
  const winCenterY = 1.65;
  const winTopY = winCenterY + winH / 2;

  return (
    <group>
      <RendererQuality shadows />
      <ambientLight intensity={0.3} color="#fff6ea" />
      <hemisphereLight args={["#fff4e4", "#3a3428", 0.38]} />

      {/* tatami */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={tatami}
          color="#e8e0c4"
          bumpMap={tatami}
          bumpScale={0.028}
          roughness={0.88}
          metalness={0}
        />
      </mesh>
      {(
        [
          [0, 0.015, -D / 2 + 0.04, W, 0.08],
          [0, 0.015, D / 2 - 0.04, W, 0.08],
          [-W / 2 + 0.04, 0.015, 0, 0.08, D],
          [W / 2 - 0.04, 0.015, 0, 0.08, D],
        ] as const
      ).map(([x, y, z, sx, sz], i) => (
        <mesh key={`fbase-${i}`} position={[x, y, z]} receiveShadow>
          <boxGeometry args={[sx, 0.03, sz]} />
          <meshStandardMaterial map={wood} color="#8a7355" roughness={0.65} />
        </mesh>
      ))}

      <SkylightWell sky={sky} width={W} depth={D} ceilingY={H} />

      {/* pure white walls */}
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
          <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0} />
        </mesh>
      ))}

      {/* —— Lunar window (clear of greenery) —— */}
      <group position={[0, winCenterY, -D / 2 + 0.04]} renderOrder={2}>
        {/* wood frame (zen, not metal) */}
        {(
          [
            [0, winH / 2 + 0.04, 0, winW + 0.22, 0.12, 0.1],
            [0, -winH / 2 - 0.04, 0, winW + 0.22, 0.12, 0.1],
            [-(winW / 2 + 0.05), 0, 0, 0.12, winH + 0.08, 0.1],
            [winW / 2 + 0.05, 0, 0, 0.12, winH + 0.08, 0.1],
          ] as const
        ).map(([x, y, z, sx, sy, sz], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial map={wood} color="#e8e2d6" roughness={0.48} metalness={0.05} />
          </mesh>
        ))}
        {/* white surround flush with wall */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[winW + 0.35, winH + 0.35, 0.04]} />
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
        </mesh>
        {/* Flat photo view — no bump/PBR glare (reads as distant landscape, not a 3D panel) */}
        <mesh position={[0, 0, 0.02]} renderOrder={3}>
          <planeGeometry args={[winW, winH]} />
          <meshBasicMaterial map={windowView} toneMapped={false} depthWrite />
        </mesh>
      </group>

      {/* Living-wall crown — gap keeps the window clear; all strips sway */}
      <CeilingPlantShelf
        width={W}
        depth={D}
        y={H - 0.06}
        plantHeight={1.55}
        inset={0.1}
        accent={GROW}
        grow={ACCENT}
        imageMap="/textures/living-wall.jpg"
        windowGap={{ width: winW + 0.35, topY: winTopY + 0.08 }}
      />

      {/* —— Zen wall decorations (all below greenery ~y 1.8) —— */}
      {/* Tokonoma on +X wall */}
      <Tokonoma
        wood={wood}
        scroll={scrollKanji}
        position={[W / 2 - 0.12, 0.05, 0.35]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* Door wall (+Z): lanterns flanking tapestry, control in empty gap, shelf */}
      <PaperLantern position={[-2.4, 1.75, D / 2 - 0.18]} scale={0.9} />
      <HangingScroll
        map={scrollSumi}
        position={[-1.55, 1.15, D / 2 - 0.06]}
        rotation={[0, Math.PI, 0]}
        w={0.5}
        h={1.0}
      />
      <PaperLantern position={[-0.7, 1.75, D / 2 - 0.18]} scale={0.9} />
      <WoodRail wood={wood} length={2.5} position={[-1.55, 1.95, D / 2 - 0.05]} rotation={[0, Math.PI, 0]} />
      {/* digital habitat control between right lantern and bookshelf */}
      <HabitatControlPanel
        wood={wood}
        position={[0.55, 1.4, D / 2 - 0.08]}
        rotation={[0, Math.PI, 0]}
      />
      <BookShelf
        wood={wood}
        width={1.35}
        shelves={1}
        seed={11}
        position={[2.15, 0.55, D / 2 - 0.14]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Left wall (−X): 星 tapestry with lanterns on both sides */}
      <PaperLantern position={[-W / 2 + 0.22, 1.72, 1.35]} scale={0.88} />
      <HangingScroll
        map={scrollKanji}
        position={[-W / 2 + 0.06, 1.12, 0.55]}
        rotation={[0, Math.PI / 2, 0]}
        w={0.48}
        h={1.05}
      />
      <PaperLantern position={[-W / 2 + 0.22, 1.72, -0.25]} scale={0.88} />
      <WoodRail wood={wood} length={2.2} position={[-W / 2 + 0.05, 1.95, 0.55]} rotation={[0, Math.PI / 2, 0]} />
      <BookShelf
        wood={wood}
        width={1.45}
        shelves={2}
        seed={3}
        position={[-W / 2 + 0.14, 0.35, -1.45]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* Right wall / tokonoma side */}
      <BookShelf
        wood={wood}
        width={1.25}
        shelves={2}
        seed={7}
        position={[W / 2 - 0.14, 0.4, -1.6]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <PaperLantern position={[2.25, 1.7, -0.45]} scale={0.8} />

      {/* Zen corner (−X / window side) */}
      <ZenCorner wood={wood} position={[-W / 2 + 0.55, 0, -D / 2 + 0.7]} />

      {/* Low wood console under window — tansu-inspired oval */}
      <mesh position={[0, 0.22, -D / 2 + 0.48]} scale={[1.5, 1, 0.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.36, 32]} />
        <meshStandardMaterial map={wood} color="#7a6a52" roughness={0.55} metalness={0.06} />
      </mesh>
      {/* ceramic bowl on console */}
      <mesh position={[0.15, 0.48, -D / 2 + 0.48]} castShadow>
        <sphereGeometry args={[0.1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#c4b8a8" roughness={0.4} />
      </mesh>
      {/* pebble tray */}
      <mesh position={[-0.25, 0.42, -D / 2 + 0.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
        <meshStandardMaterial color="#8a8478" roughness={0.85} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`peb-${i}`}
          position={[
            -0.25 + Math.sin(i * 1.7) * 0.08,
            0.46,
            -D / 2 + 0.5 + Math.cos(i * 2.1) * 0.06,
          ]}
          scale={[0.7 + (i % 3) * 0.15, 0.5, 0.65]}
          castShadow
        >
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color={i % 2 ? "#6a6560" : "#9a958c"} roughness={0.9} />
        </mesh>
      ))}

      {/* Lounge faces the window */}
      <LoungeSet fabric={fabric} wood={wood} position={[0, 0, 0.9]} />

      <ContactShadows
        position={[0, 0.03, 0]}
        opacity={0.32}
        scale={12}
        blur={2.4}
        far={6}
        resolution={512}
        frames={1}
        color="#2a2418"
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
