"use client";

// Shared construction kit for base scenes — photoreal PBR materials,
// high-segment geometry, optional Imagine hero maps. House style keeps
// organic curved silhouettes (teardrops, lenses, swept tubes) with
// saturated accents; military scenes stay angular and colder.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

interface ResidentialWindow {
  x: number;
  yTop: number;
  w: number;
  h: number;
  lit: boolean;
  cool: boolean;
}

// Residential tower dressing: rows of windows (some lit warm, some cool blue,
// some dark — a lived-in mix, not a uniform grid), roofline eave clusters
// (a few close parallel lines per floor instead of one seam, nodding at
// stacked tile eaves rather than sci-fi panel plating — a wink at Tsukibase's
// Japanese theming), and periodic patio/balcony bands with a railing tick
// pattern. Returns a diffuse map (facade + unlit window silhouettes + eaves
// + patios) and a matching emissiveMap (black except lit windows, so they
// actually glow at night rather than just reading as a tinted patch) built
// from the same window layout so the two stay pixel-aligned.
function buildResidentialTextures(
  height: number,
  seed: number,
): { map: HTMLCanvasElement; emissive: HTMLCanvasElement } {
  const w = 512;
  const h = 1024;
  const floorSpacing = 1.05; // world units per floor — denser than hull panels
  const nFloors = Math.max(4, Math.round(height / floorSpacing));

  const windows: ResidentialWindow[] = [];
  for (let f = 0; f < nFloors; f++) {
    const yBot = h - (f / nFloors) * h;
    const yTop = h - ((f + 1) / nFloors) * h;
    const floorH = yBot - yTop;
    const nWin = 14 + Math.floor(seedRand(seed * 5 + f * 3) * 6);
    const winH = floorH * 0.42;
    const winY = yTop + floorH * 0.3;
    for (let i = 0; i < nWin; i++) {
      const roll = seedRand(seed * 7 + f * 11 + i * 3);
      if (roll < 0.28) continue; // gap — bare facade between windows
      const winW = (w / nWin) * 0.6;
      const x = (i / nWin) * w + (w / nWin) * 0.2;
      windows.push({ x, yTop: winY, w: winW, h: winH, lit: roll > 0.45, cool: roll > 0.72 });
    }
  }

  const map = document.createElement("canvas");
  map.width = w;
  map.height = h;
  const mctx = map.getContext("2d")!;
  mctx.fillStyle = "#c8c6d6";
  mctx.fillRect(0, 0, w, h);

  // Batched into one path + one stroke/fill per group, instead of hundreds
  // of individual fillRect/stroke calls (a beginPath+moveTo+lineTo+stroke
  // per tick, times ~40 ticks, times every third floor, times every tower
  // on a base like LA-08's 10-tower ring, was real synchronous main-thread
  // cost — enough to stall a whole animation frame right as a dive was
  // fading in).
  const eaveLinesByRank: [number, number][][] = [[], [], []]; // one bucket per k (0,1,2) — each ring's line always has the same k-based opacity, so bucketing by k directly avoids re-deriving/comparing floats
  const patioBands: { py: number; ph: number }[] = [];
  const patioTicks: { x: number; py: number; ph: number }[] = [];

  for (let f = 0; f < nFloors; f++) {
    const yBot = h - (f / nFloors) * h;
    const yTop = h - ((f + 1) / nFloors) * h;
    const floorH = yBot - yTop;

    if (f < nFloors - 1) {
      for (let k = 0; k < 3; k++) eaveLinesByRank[k].push([yTop + k * 2.2, yTop + k * 2.2]);
    }

    if (f > 0 && f % 3 === 0) {
      const py = yBot - floorH * 0.14;
      const ph = floorH * 0.1;
      patioBands.push({ py, ph });
      const nTicks = 40;
      for (let t = 0; t < nTicks; t++) patioTicks.push({ x: (t / nTicks) * w, py, ph });
    }
  }

  for (let k = 0; k < 3; k++) {
    mctx.strokeStyle = `rgba(0,0,0,${(0.15 - k * 0.035).toFixed(3)})`;
    mctx.lineWidth = 1.3;
    mctx.beginPath();
    for (const [y0, y1] of eaveLinesByRank[k]) {
      mctx.moveTo(0, y0);
      mctx.lineTo(w, y1);
    }
    mctx.stroke();
  }

  mctx.fillStyle = "rgba(0,0,0,0.12)";
  for (const band of patioBands) mctx.fillRect(0, band.py, w, band.ph);

  mctx.strokeStyle = "rgba(0,0,0,0.18)";
  mctx.lineWidth = 1;
  mctx.beginPath();
  for (const tick of patioTicks) {
    mctx.moveTo(tick.x, tick.py);
    mctx.lineTo(tick.x, tick.py + tick.ph);
  }
  mctx.stroke();

  mctx.fillStyle = "rgba(0,0,0,0.28)";
  mctx.beginPath();
  for (const win of windows) {
    if (win.lit) continue;
    mctx.rect(win.x, win.yTop, win.w, win.h);
  }
  mctx.fill();
  mctx.fillStyle = "rgba(0,0,0,0.05)";
  mctx.beginPath();
  for (const win of windows) {
    if (!win.lit) continue;
    mctx.rect(win.x, win.yTop, win.w, win.h);
  }
  mctx.fill();

  const grad = mctx.createLinearGradient(0, h, 0, h * 0.85);
  grad.addColorStop(0, "rgba(0,0,0,0.3)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  mctx.fillStyle = grad;
  mctx.fillRect(0, 0, w, h);

  const emissive = document.createElement("canvas");
  emissive.width = w;
  emissive.height = h;
  const ectx = emissive.getContext("2d")!;
  ectx.fillStyle = "#000000";
  ectx.fillRect(0, 0, w, h);
  ectx.fillStyle = "#ffd9a0";
  ectx.beginPath();
  for (const win of windows) {
    if (!win.lit || win.cool) continue;
    ectx.rect(win.x, win.yTop, win.w, win.h);
  }
  ectx.fill();
  ectx.fillStyle = "#a8d8ff";
  ectx.beginPath();
  for (const win of windows) {
    if (!win.lit || !win.cool) continue;
    ectx.rect(win.x, win.yTop, win.w, win.h);
  }
  ectx.fill();

  return { map, emissive };
}

/**
 * Radial profile for teardrop lathes.
 * - "sharp": classic needle tip (spires, military)
 * - "soft": fat belly, blunt rounded tip (residential glass drops)
 */
export function teardropProfileRadius(
  u: number,
  radius: number,
  tip: "sharp" | "soft" = "sharp",
): number {
  const t = Math.min(1, Math.max(0, u));
  if (tip === "sharp") {
    return Math.max(0.0001, radius * Math.sin(Math.PI * Math.pow(t, 0.62)) * (1 - t * 0.12));
  }
  // Soft drop: fuller midsection, tip rounds off instead of spiking
  const body = Math.sin(Math.PI * Math.pow(t, 0.78));
  // Stay wide longer, then ease to a small rounded tip
  const envelope = Math.pow(1 - Math.pow(t, 2.4), 0.62);
  let r = radius * body * (0.92 + 0.08 * (1 - t)) * envelope;
  if (t > 0.72) {
    const s = (t - 0.72) / 0.28;
    // Hemisphere-ish cap so the top reads soft, not pointed
    const cap = Math.sqrt(Math.max(0, 1 - s * s));
    const tipR = radius * 0.2 * cap;
    r = Math.max(tipR, r * (1 - s * 0.55));
  }
  if (t >= 0.995) r = 0.0001;
  return Math.max(0.0001, r);
}

/** Teardrop hull of `height` along +Y. Soft tip for residential glass towers. */
export function Teardrop({
  height = 8,
  radius = 3,
  color = "#e8ecf4",
  emissive,
  emissiveIntensity = 0.35,
  seed,
  imageMap,
  variant = "hull",
  /** "soft" = blunt rounded tip (default for residential). */
  tip = "auto",
  ...props
}: {
  height?: number;
  radius?: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  seed?: number;
  /** Hand-picked hero override — an AI-generated (e.g. Grok Imagine) image
   *  under public/textures/, wired in per AGENTS.md's named-exception policy.
   *  Falls back to the procedural texture while it loads or if absent. */
  imageMap?: string;
  /** "residential" swaps the procedural texture for rows of windows (some
   *  lit warm, some cool, some dark) with real emissive glow, roofline eave
   *  clusters, and periodic patio bands — for city/residential towers. */
  variant?: "hull" | "residential";
  tip?: "auto" | "sharp" | "soft";
} & ThreeElements["group"]) {
  const isResidential = variant === "residential";
  const tipMode: "sharp" | "soft" =
    tip === "auto" ? (isResidential ? "soft" : "sharp") : tip;

  // Profile 36 / radial 48 for soft glass drops; sharp stays lighter.
  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const N = tipMode === "soft" ? 36 : 28;
    const segs = tipMode === "soft" ? 48 : 40;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const r = teardropProfileRadius(u, radius, tipMode);
      pts.push(new THREE.Vector2(r, u * height));
    }
    pts.push(new THREE.Vector2(0.0001, height));
    return new THREE.LatheGeometry(pts, segs);
  }, [height, radius, tipMode]);

  const hullSeed = seed ?? Math.round(height * 37 + radius * 131);
  // Residential defaults to flowing glass facade texture (hero exception).
  const resolvedImageMap =
    imageMap ??
    (isResidential ? "/textures/drop-glass-facade.jpg" : "/textures/hull-panel.jpg");
  const residentialCanvases = useMemo(() => {
    if (!isResidential) return null;
    return buildResidentialTextures(height, hullSeed);
  }, [height, hullSeed, isResidential]);
  const proceduralMap = useMemo(() => {
    const canvas = residentialCanvases ? residentialCanvases.map : buildHullTexture(height, hullSeed);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [height, hullSeed, residentialCanvases]);
  const proceduralEmissiveMap = useMemo(() => {
    if (!residentialCanvases) return null;
    const tex = new THREE.CanvasTexture(residentialCanvases.emissive);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [residentialCanvases]);

  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!resolvedImageMap) return;
    let cancelled = false;
    new THREE.TextureLoader().load(resolvedImageMap, (tex) => {
      if (cancelled) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      setImageTexture(tex);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedImageMap]);

  const texture = imageTexture ?? proceduralMap;
  const glowing = isResidential;
  // Glass-like residential: translucent sheen, warm interior read via emissive
  const glassy = isResidential && !!imageTexture;

  return (
    <group {...props}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={color}
          map={texture}
          bumpMap={texture}
          bumpScale={glassy ? 0.06 : glowing ? 0.035 : 0.05}
          roughness={glassy ? 0.28 : glowing ? 0.42 : 0.38}
          metalness={glassy ? 0.12 : glowing ? 0.22 : 0.45}
          emissiveMap={glowing && !imageTexture ? proceduralEmissiveMap ?? undefined : undefined}
          emissive={
            glassy
              ? "#ffe8c8"
              : glowing
                ? "#ffffff"
                : (emissive ?? "#000000")
          }
          emissiveIntensity={glassy ? 0.35 : glowing ? 1.05 : emissive ? emissiveIntensity : 0}
          transparent={glassy}
          opacity={glassy ? 0.92 : 1}
          envMapIntensity={glassy ? 1.1 : 0.6}
        />
      </mesh>
      {/* Soft inner glow for glass drops — warm rooms through the facade */}
      {glassy && (
        <mesh geometry={geometry} scale={[0.92, 0.98, 0.92]}>
          <meshBasicMaterial
            color="#ffd9a0"
            transparent
            opacity={0.12}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Tapered residential tower:
 *  - INNER: horizontal glowing floor slices (lit levels)
 *  - OUTER: vertical glass pillars (InstancedMesh — one draw call)
 */
export function GlassTaperTower({
  height = 12,
  radius = 2.5,
  topScale = 0.78,
  color = "#e8f2fa",
  seed = 1,
  ...props
}: {
  height?: number;
  radius?: number;
  topScale?: number;
  color?: string;
  imageMap?: string;
  seed?: number;
} & ThreeElements["group"]) {
  const rTop = radius * topScale;
  const rBot = radius;
  const lean = Math.atan2(rBot - rTop, height);
  const pillarLen = Math.hypot(height, rBot - rTop);
  const midR = (rBot + rTop) * 0.5;

  const floors = useMemo(() => {
    const n = Math.max(6, Math.round(height / 1.3));
    const list: { y: number; r: number; bright: number }[] = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.55) / (n + 0.2);
      const y = Math.min(height * 0.96, u * height);
      const r = rBot + (rTop - rBot) * (y / height);
      const bright = 0.5 + seedRand(seed * 11 + i * 7) * 0.5;
      const on = seedRand(seed * 3 + i * 13) > 0.12;
      list.push({ y, r, bright: on ? bright : 0.12 });
    }
    return list;
  }, [height, rBot, rTop, seed]);

  const pillarCount = Math.max(20, Math.round(radius * 11));
  const pillarW = Math.max(0.11, (Math.PI * midR * 2) / pillarCount * 0.78);
  const pillarD = Math.max(0.09, radius * 0.06);

  const pillarMesh = useRef<THREE.InstancedMesh>(null);
  const pillarGeo = useMemo(() => new THREE.BoxGeometry(pillarW, pillarLen, pillarD), [pillarW, pillarLen, pillarD]);

  useLayoutEffect(() => {
    if (!pillarMesh.current) return;
    const dummy = new THREE.Object3D();
    const eul = new THREE.Euler();
    const q = new THREE.Quaternion();
    for (let i = 0; i < pillarCount; i++) {
      const a = (i / pillarCount) * Math.PI * 2 + 0.02;
      const x = Math.cos(a);
      const z = Math.sin(a);
      dummy.position.set(x * midR * 1.04, height / 2, z * midR * 1.04);
      // Face outward then lean with taper
      eul.set(lean, -a, 0, "YXZ");
      q.setFromEuler(eul);
      dummy.quaternion.copy(q);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pillarMesh.current.setMatrixAt(i, dummy.matrix);
    }
    pillarMesh.current.instanceMatrix.needsUpdate = true;
    pillarMesh.current.computeBoundingSphere();
  }, [pillarCount, midR, height, lean]);

  return (
    <group {...props}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[rTop * 0.55, rBot * 0.55, height * 0.98, 20, 1, false]} />
        <meshStandardMaterial
          color="#f2eee6"
          emissive="#fff4e4"
          emissiveIntensity={0.18}
          roughness={0.72}
          metalness={0.02}
        />
      </mesh>

      {floors.map((f, i) => (
        <group key={`floor-${i}`} position={[0, f.y, 0]}>
          <mesh>
            <cylinderGeometry args={[f.r * 0.88, f.r * 0.88, 0.08, 24]} />
            <meshStandardMaterial color="#3a342c" roughness={0.75} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[f.r * 0.9, f.r * 0.9, 0.28 + f.bright * 0.15, 24]} />
            <meshStandardMaterial
              color="#ffd8a0"
              emissive="#ffb850"
              emissiveIntensity={0.4 + f.bright * 1.5}
              roughness={0.5}
              metalness={0}
              transparent
              opacity={0.55 + f.bright * 0.4}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
            <torusGeometry args={[f.r * 0.91, 0.04, 5, 28]} />
            <meshBasicMaterial color="#ffd090" transparent opacity={0.35 + f.bright * 0.6} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, height * 0.08, 0]}>
        <cylinderGeometry args={[rBot * 0.9, rBot * 0.94, height * 0.14, 24]} />
        <meshStandardMaterial
          color="#ffe8c0"
          emissive="#ffc070"
          emissiveIntensity={2.0}
          roughness={0.4}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Glass pillars — single instanced draw */}
      <instancedMesh ref={pillarMesh} args={[pillarGeo, undefined, pillarCount]} frustumCulled>
        <meshStandardMaterial
          color={color}
          roughness={0.06}
          metalness={0.2}
          transparent
          opacity={0.5}
          emissive="#c8dcec"
          emissiveIntensity={0.14}
          depthWrite={false}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[rTop * 1.03, rBot * 1.03, height, 40, 1, true]} />
        <meshStandardMaterial
          color="#f2f8fc"
          transparent
          opacity={0.08}
          roughness={0.04}
          metalness={0.25}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, height + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <circleGeometry args={[rTop * 0.92, 32]} />
        <meshStandardMaterial color="#d0cac0" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, height + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[rTop * 1.03, 0.04, 6, 40]} />
        <meshStandardMaterial color="#e0dcd4" roughness={0.35} metalness={0.15} emissive="#e8f0ff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[rBot + 0.07, 0.05, 6, 40]} />
        <meshStandardMaterial color="#c4beb4" roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** Radius of a GlassTaperTower at height y (for rings / beacons). */
export function glassTaperRadiusAt(
  height: number,
  radius: number,
  y: number,
  topScale = 0.62,
): number {
  const u = Math.min(1, Math.max(0, y / height));
  return radius * (1 - u) + radius * topScale * u;
}

// Subtle structural-rib relief for glass domes — bump only, no color map,
// so it doesn't fight the transparency or tint. Same center-to-rim polar
// UV as Dish below (thetaStart=0 cap), so concentric rings read as the
// support frame you'd see embedded in real curved glass.
function buildDomeBump(): HTMLCanvasElement {
  const w = 512;
  const h = 512;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const nRings = 5;
  for (let i = 1; i <= nRings; i++) {
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, (i / nRings) * w * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  const nSpokes = 10;
  for (let i = 0; i < nSpokes; i++) {
    const a = (i / nSpokes) * Math.PI * 2;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * w * 0.5, cy + Math.sin(a) * h * 0.5);
    ctx.stroke();
  }
  return cv;
}

/** Flattened glass-like lens dome sitting on the ground. */
export function LensDome({
  r = 5,
  squash = 0.45,
  color = "#aef0ff",
  opacity = 0.85,
  emissive,
  imageMap,
  ...props
}: {
  r?: number;
  squash?: number;
  color?: string;
  opacity?: number;
  emissive?: string;
  /** Optional hero glass map (e.g. Grok Imagine under public/textures/). */
  imageMap?: string;
} & ThreeElements["group"]) {
  const bump = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildDomeBump());
    tex.anisotropy = 8;
    return tex;
  }, []);
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const resolvedMap = imageMap ?? "/textures/dome-glass.jpg";
  useEffect(() => {
    let cancelled = false;
    new THREE.TextureLoader().load(resolvedMap, (tex) => {
      if (cancelled) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      setImageTexture(tex);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedMap]);

  return (
    <group {...props}>
      {/* Standard glass look without transmission (GPU-heavy on mobile) */}
      <mesh scale={[1, squash, 1]} castShadow>
        <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          map={imageTexture ?? undefined}
          transparent
          opacity={opacity}
          roughness={0.12}
          metalness={0.08}
          bumpMap={bump}
          bumpScale={0.035}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.5 : 0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {emissive && (
        <mesh scale={[0.92, squash * 0.9, 0.92]}>
          <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={emissive} transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/** Long glass barrel vault — rectangular footprint, rounded roof. Unlike
 *  LensDome (a stretched sphere, always reads as round/oval), this is a
 *  genuine straight-sided run: a half-cylinder roof capped with half-disc
 *  ends, length along local +X. Sits on the ground, peak height == r. */
export function VaultDome({
  length = 20,
  r = 6,
  color = "#aef0ff",
  opacity = 0.85,
  emissive,
  ...props
}: {
  length?: number;
  r?: number;
  color?: string;
  opacity?: number;
  emissive?: string;
} & ThreeElements["group"]) {
  const bump = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildDomeBump());
    tex.anisotropy = 4;
    return tex;
  }, []);
  const matProps = {
    color,
    transparent: true,
    opacity,
    roughness: 0.15,
    metalness: 0.1,
    bumpMap: bump,
    bumpScale: 0.025,
    emissive: emissive ?? "#000000",
    emissiveIntensity: emissive ? 0.5 : 0,
    side: THREE.DoubleSide,
  } as const;
  return (
    <group {...props}>
      {/* roof: half-cylinder, rotated -90deg about Z so its length axis lies
          along local X. That rotation maps a cylinder point at theta to
          world (y, -x, z) — theta=270deg (x=-r,z=0) is the only point that
          lands at +Y (the peak), so the visible sweep has to be centered
          there: thetaStart=180deg, thetaLength=180deg. */}
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[r, r, length, 40, 1, true, Math.PI, Math.PI]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* half-disc end caps closing the tunnel */}
      <mesh position={[length / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[r, 40, 0, Math.PI]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[-length / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[r, 40, 0, Math.PI]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    </group>
  );
}

// One repeat-tile of pipe detail — a couple of longitudinal seams (baked
// directly, since TubeGeometry's UV.u already wraps 0-1 around the
// circumference with no repeat needed) plus a single ring seam positioned
// to tile seamlessly along v. The component sets texture.repeat.y from the
// curve's real arc length, so a short connector and a rail spanning the
// whole map both read as built from similarly-spaced pipe segments.
export function buildTubeTexture(): HTMLCanvasElement {
  const w = 256;
  const h = 256;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#9a9a9a";
  ctx.fillRect(0, 0, w, h);

  const nSeamsU = 4;
  for (let i = 0; i < nSeamsU; i++) {
    const x = (i / nSeamsU) * w;
    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(w, 4);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.lineTo(w, 9);
  ctx.stroke();

  return cv;
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
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))),
    [pts],
  );
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 40, r, 10, false), [curve, r]);
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildTubeTexture());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    const ringSpacing = 3;
    tex.repeat.set(1, Math.max(1, Math.round(curve.getLength() / ringSpacing)));
    tex.anisotropy = 2;
    return tex;
  }, [curve]);
  void toon;
  return (
    <group {...props}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          map={texture}
          bumpMap={texture}
          bumpScale={0.03}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.7 : 0}
          roughness={0.42}
          metalness={0.55}
        />
      </mesh>
    </group>
  );
}

// Top-down plate marking for the pad's deck cap — CylinderGeometry's cap UV
// is an orthographic (x,z) -> (u,v) projection, same technique as the Moon
// photo, so a canvas drawn "as seen from above" maps directly onto it.
// Radial plate seams + rivets + a soft center wear scuff; the bright accent
// rings stay separate glowing geometry, this just adds the deck's own detail.
function buildPadTexture(seed: number): HTMLCanvasElement {
  const w = 512;
  const h = 512;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = "#9a9a9a";
  ctx.fillRect(0, 0, w, h);

  const nSlices = 10 + Math.floor(seedRand(seed * 3 + 2) * 4);
  ctx.strokeStyle = "rgba(0,0,0,0.16)";
  ctx.lineWidth = 2;
  for (let i = 0; i < nSlices; i++) {
    const a = (i / nSlices) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * w * 0.55, cy + Math.sin(a) * h * 0.55);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1.6;
  for (const f of [0.35, 0.62, 0.85]) {
    ctx.beginPath();
    ctx.arc(cx, cy, f * w * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  const nRiv = 28;
  for (let i = 0; i < nRiv; i++) {
    const a = (i / nRiv) * Math.PI * 2;
    const rr = w * 0.42;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const wear = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.28);
  wear.addColorStop(0, "rgba(0,0,0,0.22)");
  wear.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, w, h);

  return cv;
}

/** Landing pad: low cylinder, glowing edge ring, inner marking. */
export function Pad({
  r = 4,
  accent = "#5cd6ff",
  deck = "#3a3e4a",
  seed = 0,
  ...props
}: {
  r?: number;
  accent?: string;
  deck?: string;
  seed?: number;
} & ThreeElements["group"]) {
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildPadTexture(seed));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [seed]);
  return (
    <group {...props}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 1.08, 0.3, 64]} />
        <meshStandardMaterial
          color={deck}
          map={texture}
          bumpMap={texture}
          bumpScale={0.05}
          roughness={0.72}
          metalness={0.35}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
        <ringGeometry args={[r * 0.9, r * 0.97, 64]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
        <ringGeometry args={[r * 0.32, r * 0.4, 48]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} transparent opacity={0.75} roughness={0.35} />
      </mesh>
    </group>
  );
}

// Dish-surface detail: concentric mesh rings (v = center-to-rim, matching
// the sphere cap's polar UV) + radial support spokes (u = azimuth, wraps
// naturally) + sparse perforation dots for a wire-mesh-antenna feel.
function buildDishTexture(): HTMLCanvasElement {
  const w = 512;
  const h = 512;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#9c9c9c";
  ctx.fillRect(0, 0, w, h);

  const nRings = 10;
  for (let i = 1; i < nRings; i++) {
    const y = (i / nRings) * h;
    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const nSpokes = 16;
  for (let i = 0; i < nSpokes; i++) {
    const x = (i / nSpokes) * w;
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.1)";
  for (let ry = 0; ry < 20; ry++) {
    for (let rx = 0; rx < 40; rx++) {
      if (seedRand(ry * 40 + rx) > 0.4) continue;
      ctx.beginPath();
      ctx.arc((rx / 40) * w, (ry / 20) * h, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return cv;
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
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildDishTexture());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
  return (
    <group {...props}>
      <mesh position={[0, mast / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 0.06, r * 0.1, mast, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
      </mesh>
      <group position={[0, mast, 0]} rotation={[tilt, 0, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[r, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.28]} />
          <meshStandardMaterial
            color={color}
            map={texture}
            bumpMap={texture}
            bumpScale={0.05}
            roughness={0.35}
            metalness={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, r * 0.55, 0]}>
          <cylinderGeometry args={[0.03, 0.03, r * 1.1, 10]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, r * 1.1, 0]}>
          <sphereGeometry args={[r * 0.08, 16, 16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} roughness={0.25} />
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
  // No per-beacon PointLight — dozens of dynamic lights destroy fillrate.
  return (
    <group {...props}>
      <mesh>
        <sphereGeometry args={[size, 10, 10]} />
        <meshBasicMaterial ref={mat} color={color} transparent />
      </mesh>
    </group>
  );
}

/** Iridescent chrome accent ring, for a spire tip or other crowning point.
 *  Uses meshPhysicalMaterial's built-in `iridescence` — a real, cheap
 *  view-dependent rainbow-chrome sheen (like a soap bubble or anodized
 *  titanium) that shifts as the camera orbits, unlike a rainbow baked into
 *  a texture, which would look painted-on and static from every angle. */
export function ChromeCrown({
  radius = 0.6,
  thickness = 0.18,
  ...props
}: {
  radius?: number;
  thickness?: number;
} & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, thickness, 20, 48]} />
        <meshPhysicalMaterial
          color="#d8dce6"
          metalness={0.4}
          roughness={0.15}
          iridescence={1}
          iridescenceIOR={1.9}
          iridescenceThicknessRange={[200, 800]}
        />
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
        <torusGeometry args={[radius, thickness, 12, 96]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          roughness={0.25}
          metalness={0.15}
          transparent
          opacity={0.92}
        />
      </mesh>
    </group>
  );
}

/** Hull radius of a Teardrop(height, radius) at height y — for placing
 *  window bands so they sit on the skin instead of inside it. */
export function teardropRadiusAt(
  height: number,
  radius: number,
  y: number,
  tip: "sharp" | "soft" = "sharp",
): number {
  const u = Math.min(1, Math.max(0, y / height));
  return teardropProfileRadius(u, radius, tip) + 0.04;
}

/** Pod-like sunlight collector: translucent lens on a slender mast, optional
 *  hero imageMap for the collector skin. Used on LA-08's outer rim. */
export function SunlightPod({
  scale = 1,
  accent = "#c48aff",
  warm = "#ffd9a0",
  imageMap = "/textures/sunlight-pod.jpg",
  ...props
}: {
  scale?: number;
  accent?: string;
  warm?: string;
  imageMap?: string;
} & ThreeElements["group"]) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!imageMap) return;
    let cancelled = false;
    new THREE.TextureLoader().load(imageMap, (t) => {
      if (cancelled) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [imageMap]);
  // No per-pod point light — the ring has one shared glow.
  return (
    <group {...props} scale={scale}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.11, 2.2, 10]} />
        <meshStandardMaterial color="#b8bcc8" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 2.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.045, 10, 20]} />
        <meshStandardMaterial color="#9aa0b4" metalness={0.75} roughness={0.25} />
      </mesh>
      <group position={[0, 2.85, 0]} rotation={[0.35, 0, 0.15]}>
        <mesh scale={[1, 1.35, 0.72]} castShadow>
          <sphereGeometry args={[0.55, 24, 16]} />
          <meshStandardMaterial
            color="#f4ecff"
            map={tex ?? undefined}
            bumpMap={tex ?? undefined}
            bumpScale={0.04}
            transparent
            opacity={0.82}
            roughness={0.12}
            metalness={0.28}
            emissive={warm}
            emissiveIntensity={0.55}
            envMapIntensity={1.2}
          />
        </mesh>
        <mesh position={[0, 0.08, 0]} scale={[0.72, 0.9, 0.45]}>
          <sphereGeometry args={[0.42, 14, 12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.95} roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <torusGeometry args={[0.52, 0.032, 8, 24]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.15} roughness={0.25} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Ring of sunlight pods around a radius — rim collectors for a residential base. */
export function SunlightPodRing({
  radius = 28,
  count = 12,
  accent = "#c48aff",
  y = 0,
  scale = 1,
  phase = 0.15,
}: {
  radius?: number;
  count?: number;
  accent?: string;
  y?: number;
  scale?: number;
  phase?: number;
}) {
  // Shared warm fill for the whole ring instead of N point lights.
  return (
    <group>
      <pointLight position={[0, 4, 0]} intensity={18} color="#ffd9a0" distance={radius * 1.4} decay={2} />
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + phase;
        const s = scale * (0.85 + seedRand(i * 17 + 4) * 0.35);
        return (
          <SunlightPod
            key={i}
            accent={accent}
            scale={s}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
            rotation={[0, -a + Math.PI / 2, 0]}
          />
        );
      })}
    </group>
  );
}

/** Build color+alpha maps from a white-wall hydro photo. Soft key keeps the
 *  strip reading as continuous foliage rather than swiss-cheese cutouts. */
function prepHydroMaps(
  src: THREE.Texture,
  length: number,
  seamless = false,
): { color: THREE.CanvasTexture; alpha: THREE.CanvasTexture } | null {
  const img = src.image as HTMLImageElement | ImageBitmap | undefined;
  if (!img || !("width" in img) || !img.width) return null;

  const w = img.width;
  const h = img.height;
  // Source photo: tubes/lights along the top, hanging plants fill the middle.
  const cropY0 = Math.floor(h * 0.06);
  const cropY1 = Math.floor(h * 0.94);
  const ch = cropY1 - cropY0;

  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = ch;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(img, 0, cropY0, w, ch, 0, 0, w, ch);
  const data = ctx.getImageData(0, 0, w, ch);
  const px = data.data;
  const alphaCv = document.createElement("canvas");
  alphaCv.width = w;
  alphaCv.height = ch;
  const aCtx = alphaCv.getContext("2d")!;
  const aImg = aCtx.createImageData(w, ch);
  const ap = aImg.data;

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const maxc = Math.max(r, g, b);
    const minc = Math.min(r, g, b);
    const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
    // Soft key: only pure pale wall goes fully transparent. Greens, tubes,
    // midtones stay mostly opaque so the crown reads as one continuous band.
    let a = 255;
    if (maxc > 210 && sat < 0.12) {
      // near-white wall → soft fade
      a = Math.max(0, Math.round(255 - (maxc - 210) * 4.5));
    } else if (maxc > 185 && sat < 0.08) {
      a = 90;
    } else if (g > 50 && g >= r * 0.85) {
      a = 255; // foliage solid
    } else if (sat > 0.15) {
      a = 230; // lit tubes / fixtures
    } else if (maxc < 90) {
      a = 180;
    }
    ap[i] = ap[i + 1] = ap[i + 2] = a;
    ap[i + 3] = 255;
  }
  aCtx.putImageData(aImg, 0, 0);

  const repeatX = seamless
    ? Math.max(2.4, length / 1.6)
    : Math.max(1.15, length / 2.2);

  const color = new THREE.CanvasTexture(cv);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.ClampToEdgeWrapping;
  color.repeat.set(repeatX, 1);
  color.anisotropy = 4;
  color.needsUpdate = true;

  const alpha = new THREE.CanvasTexture(alphaCv);
  alpha.colorSpace = THREE.NoColorSpace;
  alpha.wrapS = THREE.RepeatWrapping;
  alpha.wrapT = THREE.ClampToEdgeWrapping;
  alpha.repeat.set(repeatX, 1);
  alpha.needsUpdate = true;

  return { color, alpha };
}

/** Wall-top hydroponic channel: trough at roof line, foliage hangs down. */
export function HydroponicChannel({
  length = 6,
  accent = "#7cffc4",
  grow = "#c48aff",
  imageMap = "/textures/hydroponic-greenery.jpg",
  plantHeight = 1.25,
  /** Hide trough geometry when a parent shelf already provides the ledge. */
  showTrough = true,
  /** Tighter UV repeat for a continuous crown band. */
  seamless = false,
  ...props
}: {
  length?: number;
  accent?: string;
  grow?: string;
  imageMap?: string;
  plantHeight?: number;
  showTrough?: boolean;
  seamless?: boolean;
} & ThreeElements["group"]) {
  const [maps, setMaps] = useState<{
    color: THREE.Texture;
    alpha: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    if (!imageMap) return;
    let cancelled = false;
    new THREE.TextureLoader().load(
      imageMap,
      (t) => {
        if (cancelled) return;
        const built = prepHydroMaps(t, length, seamless);
        if (built) setMaps(built);
      },
      undefined,
      () => {
        /* keep null */
      },
    );
    return () => {
      cancelled = true;
    };
  }, [imageMap, length, seamless]);

  return (
    <group {...props}>
      {showTrough && (
        <>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[length, 0.08, 0.26]} />
            <meshStandardMaterial color="#2a3040" metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, length * 0.96, 10]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.05, 0.07]}>
            <boxGeometry args={[length * 0.94, 0.022, 0.03]} />
            <meshBasicMaterial color={grow} transparent opacity={0.72} />
          </mesh>
        </>
      )}
      {maps && (
        <>
          {/* primary foliage plane */}
          <mesh position={[0, -plantHeight * 0.5 - 0.02, 0.04]}>
            <planeGeometry args={[length * 1.02, plantHeight]} />
            <meshStandardMaterial
              map={maps.color}
              alphaMap={maps.alpha}
              transparent
              alphaTest={0.12}
              roughness={0.85}
              metalness={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              emissive="#0a2814"
              emissiveIntensity={0.1}
            />
          </mesh>
          {/* second slightly offset layer for denser continuous fill */}
          <mesh position={[0, -plantHeight * 0.48 - 0.06, 0.1]} scale={[1.02, 0.92, 1]}>
            <planeGeometry args={[length * 1.02, plantHeight]} />
            <meshStandardMaterial
              map={maps.color}
              alphaMap={maps.alpha}
              transparent
              alphaTest={0.18}
              roughness={0.88}
              metalness={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              emissive="#0a2814"
              emissiveIntensity={0.08}
              opacity={0.92}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

/**
 * Dense living-wall strip — solid continuous foliage like a planted green wall
 * (no swiss-cheese alpha). Soft fade only at the bottom edge so it blends.
 */
function LivingWallStrip({
  length,
  height,
  imageMap = "/textures/living-wall.jpg",
  swayPhase = 0,
  ...props
}: {
  length: number;
  height: number;
  imageMap?: string;
  /** Phase offset so neighboring strips don't sway in lockstep. */
  swayPhase?: number;
} & ThreeElements["group"]) {
  const [maps, setMaps] = useState<{
    color: THREE.Texture;
    alpha: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    new THREE.TextureLoader().load(imageMap, (t) => {
      if (cancelled) return;
      const img = t.image as HTMLImageElement | ImageBitmap | undefined;
      if (!img || !("width" in img) || !img.width) return;

      const w = img.width;
      const h = img.height;
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img as CanvasImageSource, 0, 0);
      const color = new THREE.CanvasTexture(cv);
      color.colorSpace = THREE.SRGBColorSpace;
      color.wrapS = THREE.RepeatWrapping;
      color.wrapT = THREE.ClampToEdgeWrapping;
      color.repeat.set(Math.max(1.8, length / 2.4), 1);
      color.anisotropy = 8;
      color.needsUpdate = true;

      // Soft bottom fade
      const aCv = document.createElement("canvas");
      aCv.width = 4;
      aCv.height = 256;
      const aCtx = aCv.getContext("2d")!;
      const g = aCtx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.72, "#ffffff");
      g.addColorStop(0.9, "#b0b0b0");
      g.addColorStop(1, "#000000");
      aCtx.fillStyle = g;
      aCtx.fillRect(0, 0, 4, 256);
      const alpha = new THREE.CanvasTexture(aCv);
      alpha.colorSpace = THREE.NoColorSpace;
      alpha.wrapS = alpha.wrapT = THREE.ClampToEdgeWrapping;
      alpha.needsUpdate = true;

      setMaps({ color, alpha });
    });
    return () => {
      cancelled = true;
    };
  }, [imageMap, length]);

  // Pivot groups at the mount (y=0) so hang tips swing; all walls including window
  const pivotA = useRef<THREE.Group>(null);
  const pivotB = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Short strips (e.g. over window) get a bit more angular motion
    const amp = 0.04 * Math.min(1.5, 1.35 / Math.max(0.45, height));
    const sway = Math.sin(t * 0.65 + swayPhase) * amp;
    const sway2 = Math.sin(t * 0.9 + swayPhase * 1.4) * amp * 0.6;
    const bob = Math.sin(t * 0.5 + swayPhase * 0.7) * 0.014;
    if (pivotA.current) {
      pivotA.current.rotation.z = sway;
      pivotA.current.rotation.x = sway2 * 0.35;
      pivotA.current.position.x = bob;
    }
    if (pivotB.current) {
      pivotB.current.rotation.z = -sway * 0.75 + sway2 * 0.5;
      pivotB.current.rotation.x = sway * 0.25;
      pivotB.current.position.x = -bob * 1.2;
    }
  });

  if (!maps) return <group {...props} />;

  return (
    <group {...props}>
      {/* Pivot at ceiling mount so leaves hang and sway from the top */}
      <group ref={pivotA}>
        <mesh position={[0, -height * 0.5, 0.03]} castShadow>
          <planeGeometry args={[length, height, 1, 6]} />
          <meshStandardMaterial
            map={maps.color}
            alphaMap={maps.alpha}
            transparent
            alphaTest={0.04}
            roughness={0.72}
            metalness={0}
            side={THREE.DoubleSide}
            depthWrite
            emissive="#0a2814"
            emissiveIntensity={0.16}
          />
        </mesh>
      </group>
      <group ref={pivotB}>
        <mesh position={[0, -height * 0.5 - 0.04, 0.1]} scale={[1.02, 0.94, 1]}>
          <planeGeometry args={[length, height, 1, 6]} />
          <meshStandardMaterial
            map={maps.color}
            alphaMap={maps.alpha}
            transparent
            alphaTest={0.08}
            roughness={0.78}
            metalness={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            emissive="#0c3018"
            emissiveIntensity={0.1}
            opacity={0.9}
          />
        </mesh>
      </group>
    </group>
  );
}

type PlantSide = {
  pos: [number, number, number];
  rot: [number, number, number];
  length: number;
  height: number;
  /** Skip the thick shelf rail (used for short over-window strips). */
  thinRail?: boolean;
};

/**
 * Continuous living-wall crown. Optional gap on the −Z wall keeps a window
 * clear: plants run on both flanks + a short band only above the frame.
 */
export function CeilingPlantShelf({
  width,
  depth,
  y,
  plantHeight = 1.35,
  inset = 0.12,
  grow = "#c48aff",
  imageMap = "/textures/living-wall.jpg",
  /** Clear opening on the −Z wall so a window stays visible. */
  windowGap,
}: {
  width: number;
  depth: number;
  y: number;
  plantHeight?: number;
  inset?: number;
  /** @deprecated unused — kept for call-site compat */
  accent?: string;
  grow?: string;
  imageMap?: string;
  windowGap?: {
    /** Opening width (glass + frame). */
    width: number;
    /** Top of window frame in world Y — plants above this only in the center. */
    topY: number;
  };
}) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const lenX = width + 0.12;
  const lenZ = depth + 0.12;
  const shelfDepth = 0.28;
  const shelfH = 0.06;
  // Light wood matching the lunar window frame
  const frameWood = "#e8e2d6";
  const zFront = halfD - inset;
  const zBack = -halfD + inset;

  const sides: PlantSide[] = [
    // +Z (door)
    { pos: [0, y, zFront], rot: [0, Math.PI, 0], length: lenX, height: plantHeight },
    // ±X
    { pos: [-halfW + inset, y, 0], rot: [0, Math.PI / 2, 0], length: lenZ, height: plantHeight },
    { pos: [halfW - inset, y, 0], rot: [0, -Math.PI / 2, 0], length: lenZ, height: plantHeight },
  ];

  if (windowGap) {
    const gap = windowGap.width + 0.25; // margin past frame
    const flank = Math.max(0.55, (width - gap) / 2);
    const leftX = -halfW + inset + flank / 2 - 0.02;
    const rightX = halfW - inset - flank / 2 + 0.02;
    // Full-height flanks beside the window
    sides.push(
      { pos: [leftX, y, zBack], rot: [0, 0, 0], length: flank + 0.08, height: plantHeight },
      { pos: [rightX, y, zBack], rot: [0, 0, 0], length: flank + 0.08, height: plantHeight },
    );
    // Short band hanging from the ceiling only — stops above the window frame
    const aboveH = Math.max(0.38, y - windowGap.topY - 0.1);
    sides.push({
      pos: [0, y, zBack],
      rot: [0, 0, 0],
      length: gap + 0.12,
      height: aboveH,
      thinRail: true,
    });
  } else {
    sides.push({
      pos: [0, y, zBack],
      rot: [0, 0, 0],
      length: lenX,
      height: plantHeight,
    });
  }

  return (
    <group>
      {sides.map((s, i) => {
        // Wood border sits just under the hanging foliage bottom edge
        const borderY = -s.height + 0.04;
        return (
          <group key={`ledge-${i}`} position={s.pos} rotation={s.rot}>
            {/* ceiling shelf rail — light wood like the window */}
            {!s.thinRail && (
              <mesh position={[0, 0.02, 0.02]} castShadow receiveShadow>
                <boxGeometry args={[s.length, shelfH, shelfDepth]} />
                <meshStandardMaterial color={frameWood} roughness={0.48} metalness={0.05} />
              </mesh>
            )}
            {/* wood border under greenery (picture-rail trim) */}
            <mesh position={[0, borderY, 0.06]} castShadow receiveShadow>
              <boxGeometry args={[s.length + 0.04, 0.055, 0.09]} />
              <meshStandardMaterial color={frameWood} roughness={0.48} metalness={0.05} />
            </mesh>
            {/* thin inner lip for depth */}
            <mesh position={[0, borderY + 0.03, 0.1]}>
              <boxGeometry args={[s.length + 0.02, 0.018, 0.04]} />
              <meshStandardMaterial color="#ddd6c8" roughness={0.52} />
            </mesh>
          </group>
        );
      })}
      {(
        [
          [halfW - inset, halfD - inset],
          [halfW - inset, -halfD + inset],
          [-halfW + inset, halfD - inset],
          [-halfW + inset, -halfD + inset],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={`corner-${i}`} position={[x, y + 0.02, z]} castShadow>
          <boxGeometry args={[shelfDepth + 0.02, shelfH, shelfDepth + 0.02]} />
          <meshStandardMaterial color={frameWood} roughness={0.48} metalness={0.05} />
        </mesh>
      ))}
      {sides.map((s, i) => (
        <LivingWallStrip
          key={`plants-${i}`}
          length={s.length}
          height={s.height}
          imageMap={imageMap}
          position={s.pos}
          rotation={s.rot}
          swayPhase={i * 1.7}
        />
      ))}
      <pointLight position={[0, y - 0.4, 0]} intensity={2.8} color="#c8ffd8" distance={7} decay={2} />
    </group>
  );
}

/** Procedural tileable tatami mat texture (igusa weave + fabric binding). */
export function buildTatamiTexture(size = 512): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d")!;

  // Base straw tone
  ctx.fillStyle = "#d2c8a4";
  ctx.fillRect(0, 0, size, size);

  // Two classic half-mats side by side (each ~2:1), binding borders
  const mats: [number, number, number, number][] = [
    [0, 0, size / 2, size],
    [size / 2, 0, size / 2, size],
  ];
  const border = Math.max(4, Math.floor(size * 0.028));

  for (const [mx, my, mw, mh] of mats) {
    // weave: fine horizontal straw lines
    for (let y = my + border; y < my + mh - border; y += 2) {
      const n = ((y * 17 + mx * 3) % 7) / 7;
      const g = 180 + Math.floor(n * 35);
      const r = g + 8 + Math.floor(n * 10);
      const b = g - 40 + Math.floor(n * 12);
      ctx.fillStyle = `rgb(${r},${g},${Math.max(80, b)})`;
      ctx.fillRect(mx + border, y, mw - border * 2, 1);
    }
    // subtle vertical stitch every few px
    for (let x = mx + border; x < mx + mw - border; x += 5) {
      ctx.fillStyle = "rgba(120, 110, 70, 0.12)";
      ctx.fillRect(x, my + border, 1, mh - border * 2);
    }
    // fabric binding — light heri cloth (warm taupe, not black)
    ctx.fillStyle = "#b8a888";
    ctx.fillRect(mx, my, mw, border);
    ctx.fillRect(mx, my + mh - border, mw, border);
    ctx.fillRect(mx, my, border, mh);
    ctx.fillRect(mx + mw - border, my, border, mh);
    // soft inner edge
    ctx.fillStyle = "#c9ba9a";
    ctx.fillRect(mx + border - 1, my + border - 1, mw - border * 2 + 2, 2);
    ctx.fillRect(mx + border - 1, my + mh - border - 1, mw - border * 2 + 2, 2);
    ctx.fillRect(mx + border - 1, my + border, 2, mh - border * 2);
    ctx.fillRect(mx + mw - border - 1, my + border, 2, mh - border * 2);
  }

  // center seam between the two mats — lighter too
  ctx.fillStyle = "#a89878";
  ctx.fillRect(size / 2 - 1, 0, 2, size);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Deterministic pseudo-random, shared convention across the map. */
export function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
