"use client";

// Shared stylized construction kit for base scenes. House style is
// anime-extreme: organic curved silhouettes (teardrops, lenses, swept
// tubes), toon-stepped shading, saturated accents and emissive trim.
// Military scenes deliberately use almost none of these curves.

import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

// Neutral-gray detail texture for Teardrop hulls — panel seams, rivets, a
// grounding AO gradient at the base, faint weathering streaks. Drawn gray
// (not the hull's own color) so it multiplies against whatever `color` the
// call site passes, one texture works for every tint. LatheGeometry's UV.v
// runs 0 (base) -> 1 (tip) in the same order as the profile points below,
// so panel spacing is computed from the hull's real height, not a fixed
// count — a tall spire and a short shuttle body both read as built from
// similarly-sized plates.
function buildHullTexture(height: number, seed: number): HTMLCanvasElement {
  const w = 512;
  const h = 1024;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;

  ctx.fillStyle = "#9a9a9a";
  ctx.fillRect(0, 0, w, h);

  const nSeamsV = 10 + Math.floor(seedRand(seed * 3 + 1) * 4);
  for (let i = 0; i < nSeamsV; i++) {
    const x = (i / nSeamsV) * w;
    ctx.strokeStyle = "rgba(0,0,0,0.16)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  const seamSpacing = 1.7; // world units per panel ring
  const nSeamsH = Math.max(2, Math.round(height / seamSpacing));
  for (let i = 1; i < nSeamsH; i++) {
    const y = (i / nSeamsH) * h;
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    // bevel catch-light just below each seam
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y + 2.5);
    ctx.lineTo(w, y + 2.5);
    ctx.stroke();
  }

  // sparse rivets at seam intersections
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  for (let i = 1; i < nSeamsH; i++) {
    const y = (i / nSeamsH) * h;
    for (let j = 0; j < nSeamsV; j++) {
      if (seedRand(seed + i * 31 + j * 7) > 0.5) continue;
      const x = (j / nSeamsV) * w;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // grounding AO — texture.flipY means v=0 (hull base) samples canvas
  // y=h, so the dark end of this gradient belongs at the canvas bottom.
  const grad = ctx.createLinearGradient(0, h, 0, h * 0.72);
  grad.addColorStop(0, "rgba(0,0,0,0.38)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // faint weathering streaks, concentrated low on the hull
  for (let i = 0; i < 14; i++) {
    const x = seedRand(seed * 5 + i * 11) * w;
    const len = h * (0.15 + seedRand(seed * 7 + i) * 0.25);
    const y0 = h - len * seedRand(seed * 9 + i * 3);
    ctx.strokeStyle = `rgba(0,0,0,${(0.05 + seedRand(i) * 0.05).toFixed(3)})`;
    ctx.lineWidth = 3 + seedRand(i * 2) * 5;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x + (seedRand(i * 13) - 0.5) * 10, y0 - len);
    ctx.stroke();
  }

  return cv;
}

/** Teardrop hull of `height` along +Y: round belly, tapering to a point. */
export function Teardrop({
  height = 8,
  radius = 3,
  color = "#e8ecf4",
  emissive,
  emissiveIntensity = 0.35,
  seed,
  ...props
}: {
  height?: number;
  radius?: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  seed?: number;
} & ThreeElements["group"]) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      // belly low, long taper to the tip
      const r = radius * Math.sin(Math.PI * Math.pow(u, 0.62)) * (1 - u * 0.12);
      pts.push(new THREE.Vector2(Math.max(0.0001, r), u * height));
    }
    pts.push(new THREE.Vector2(0.0001, height));
    return new THREE.LatheGeometry(pts, 48);
  }, [height, radius]);

  const hullSeed = seed ?? Math.round(height * 37 + radius * 131);
  const texture = useMemo(() => {
    const canvas = buildHullTexture(height, hullSeed);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [height, hullSeed]);

  return (
    <group {...props}>
      <mesh geometry={geometry}>
        <meshToonMaterial
          color={color}
          map={texture}
          bumpMap={texture}
          bumpScale={0.045}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? emissiveIntensity : 0}
        />
      </mesh>
    </group>
  );
}

/** Flattened glass-like lens dome sitting on the ground. */
export function LensDome({
  r = 5,
  squash = 0.45,
  color = "#aef0ff",
  opacity = 0.85,
  emissive,
  ...props
}: {
  r?: number;
  squash?: number;
  color?: string;
  opacity?: number;
  emissive?: string;
} & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh scale={[1, squash, 1]}>
        <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.15}
          metalness={0.1}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.5 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Swept connector tube through world-space points (CatmullRom). */
export function SweepTube({
  pts,
  r = 0.5,
  color = "#d8dce6",
  emissive,
  toon = true,
  ...props
}: {
  pts: [number, number, number][];
  r?: number;
  color?: string;
  emissive?: string;
  toon?: boolean;
} & ThreeElements["group"]) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(...p)),
    );
    return new THREE.TubeGeometry(curve, 48, r, 12, false);
  }, [pts, r]);
  return (
    <group {...props}>
      <mesh geometry={geometry}>
        {toon ? (
          <meshToonMaterial
            color={color}
            emissive={emissive ?? "#000000"}
            emissiveIntensity={emissive ? 0.8 : 0}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            emissive={emissive ?? "#000000"}
            emissiveIntensity={emissive ? 0.8 : 0}
            roughness={0.6}
          />
        )}
      </mesh>
    </group>
  );
}

/** Landing pad: low cylinder, glowing edge ring, inner marking. */
export function Pad({
  r = 4,
  accent = "#5cd6ff",
  deck = "#3a3e4a",
  ...props
}: {
  r?: number;
  accent?: string;
  deck?: string;
} & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[r, r * 1.08, 0.3, 48]} />
        <meshStandardMaterial color={deck} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
        <ringGeometry args={[r * 0.9, r * 0.97, 48]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
        <ringGeometry args={[r * 0.32, r * 0.4, 40]} />
        <meshBasicMaterial color={accent} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

/** Parabolic comms dish on a mast, aimed up and out. */
export function Dish({
  r = 3,
  tilt = -0.9,
  color = "#e8ecf4",
  accent = "#5cd6ff",
  mast = 2,
  ...props
}: {
  r?: number;
  tilt?: number;
  color?: string;
  accent?: string;
  mast?: number;
} & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, mast / 2, 0]}>
        <cylinderGeometry args={[r * 0.06, r * 0.1, mast, 8]} />
        <meshToonMaterial color={color} />
      </mesh>
      <group position={[0, mast, 0]} rotation={[tilt, 0, 0]}>
        <mesh>
          <sphereGeometry args={[r, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.28]} />
          <meshToonMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, r * 0.55, 0]}>
          <cylinderGeometry args={[0.03, 0.03, r * 1.1, 6]} />
          <meshToonMaterial color={color} />
        </mesh>
        <mesh position={[0, r * 1.1, 0]}>
          <sphereGeometry args={[r * 0.08, 12, 12]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      </group>
    </group>
  );
}

/** Pulsing beacon light. */
export function Beacon({
  color = "#ff5c5c",
  speed = 2,
  size = 0.25,
  ...props
}: {
  color?: string;
  speed?: number;
  size?: number;
} & ThreeElements["group"]) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * speed));
    }
  });
  return (
    <group {...props}>
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial ref={mat} color={color} transparent />
      </mesh>
    </group>
  );
}

/** Flat glowing band wrapped around a radius — reads as lit windows. */
export function WindowBand({
  radius = 3,
  color = "#ffd9a0",
  thickness = 0.08,
  ...props
}: {
  radius?: number;
  color?: string;
  thickness?: number;
} & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, thickness, 8, 64]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/** Hull radius of a Teardrop(height, radius) at height y — for placing
 *  window bands so they sit on the skin instead of inside it. */
export function teardropRadiusAt(height: number, radius: number, y: number): number {
  const u = Math.min(1, Math.max(0, y / height));
  return radius * Math.sin(Math.PI * Math.pow(u, 0.62)) * (1 - u * 0.12) + 0.04;
}

/** Deterministic pseudo-random, shared convention across the map. */
export function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
