"use client";

// Shared stylized construction kit for base scenes. House style is
// anime-extreme: organic curved silhouettes (teardrops, lenses, swept
// tubes), toon-stepped shading, saturated accents and emissive trim.
// Military scenes deliberately use almost none of these curves.

import { useEffect, useMemo, useRef, useState } from "react";
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

  for (let f = 0; f < nFloors; f++) {
    const yBot = h - (f / nFloors) * h;
    const yTop = h - ((f + 1) / nFloors) * h;
    const floorH = yBot - yTop;

    // roofline eave cluster — a few close lines rather than one seam
    if (f < nFloors - 1) {
      for (let k = 0; k < 3; k++) {
        mctx.strokeStyle = `rgba(0,0,0,${(0.15 - k * 0.035).toFixed(3)})`;
        mctx.lineWidth = 1.3;
        mctx.beginPath();
        mctx.moveTo(0, yTop + k * 2.2);
        mctx.lineTo(w, yTop + k * 2.2);
        mctx.stroke();
      }
    }

    // periodic patio/balcony band with a railing tick pattern
    if (f > 0 && f % 3 === 0) {
      const py = yBot - floorH * 0.14;
      const ph = floorH * 0.1;
      mctx.fillStyle = "rgba(0,0,0,0.12)";
      mctx.fillRect(0, py, w, ph);
      const nTicks = 40;
      mctx.strokeStyle = "rgba(0,0,0,0.18)";
      mctx.lineWidth = 1;
      for (let t = 0; t < nTicks; t++) {
        const x = (t / nTicks) * w;
        mctx.beginPath();
        mctx.moveTo(x, py);
        mctx.lineTo(x, py + ph);
        mctx.stroke();
      }
    }
  }

  for (const win of windows) {
    mctx.fillStyle = win.lit ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.28)";
    mctx.fillRect(win.x, win.yTop, win.w, win.h);
  }

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
  for (const win of windows) {
    if (!win.lit) continue;
    ectx.fillStyle = win.cool ? "#a8d8ff" : "#ffd9a0";
    ectx.fillRect(win.x, win.yTop, win.w, win.h);
  }

  return { map, emissive };
}

/** Teardrop hull of `height` along +Y: round belly, tapering to a point. */
export function Teardrop({
  height = 8,
  radius = 3,
  color = "#e8ecf4",
  emissive,
  emissiveIntensity = 0.35,
  seed,
  imageMap,
  variant = "hull",
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
  const isResidential = variant === "residential";
  const proceduralMap = useMemo(() => {
    const canvas = isResidential
      ? buildResidentialTextures(height, hullSeed).map
      : buildHullTexture(height, hullSeed);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [height, hullSeed, isResidential]);
  const proceduralEmissiveMap = useMemo(() => {
    if (!isResidential) return null;
    const tex = new THREE.CanvasTexture(buildResidentialTextures(height, hullSeed).emissive);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [height, hullSeed, isResidential]);

  // imageMap is a fixed per-instance override (set once at the call site,
  // never toggled at runtime), so there's no "revert to procedural" case to
  // handle here — only the async load needs to set state.
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!imageMap) return;
    let cancelled = false;
    new THREE.TextureLoader().load(imageMap, (tex) => {
      if (cancelled) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      setImageTexture(tex);
    });
    return () => {
      cancelled = true;
    };
  }, [imageMap]);

  const texture = imageTexture ?? proceduralMap;
  const glowing = isResidential && !imageTexture;

  return (
    <group {...props}>
      <mesh geometry={geometry}>
        <meshToonMaterial
          color={color}
          map={texture}
          bumpMap={texture}
          bumpScale={glowing ? 0.03 : 0.045}
          emissiveMap={glowing ? proceduralEmissiveMap : undefined}
          emissive={glowing ? "#ffffff" : emissive ?? "#000000"}
          emissiveIntensity={glowing ? 0.9 : emissive ? emissiveIntensity : 0}
        />
      </mesh>
    </group>
  );
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
  ...props
}: {
  r?: number;
  squash?: number;
  color?: string;
  opacity?: number;
  emissive?: string;
} & ThreeElements["group"]) {
  const bump = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildDomeBump());
    tex.anisotropy = 4;
    return tex;
  }, []);
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
          bumpMap={bump}
          bumpScale={0.025}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.5 : 0}
          side={THREE.DoubleSide}
        />
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
function buildTubeTexture(): HTMLCanvasElement {
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
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 48, r, 12, false), [curve, r]);
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildTubeTexture());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    const ringSpacing = 3; // world units per ring seam
    tex.repeat.set(1, Math.max(1, Math.round(curve.getLength() / ringSpacing)));
    tex.anisotropy = 4;
    return tex;
  }, [curve]);
  return (
    <group {...props}>
      <mesh geometry={geometry}>
        {toon ? (
          <meshToonMaterial
            color={color}
            map={texture}
            bumpMap={texture}
            bumpScale={0.02}
            emissive={emissive ?? "#000000"}
            emissiveIntensity={emissive ? 0.8 : 0}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            map={texture}
            bumpMap={texture}
            bumpScale={0.02}
            emissive={emissive ?? "#000000"}
            emissiveIntensity={emissive ? 0.8 : 0}
            roughness={0.6}
          />
        )}
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
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[r, r * 1.08, 0.3, 48]} />
        <meshStandardMaterial color={deck} map={texture} bumpMap={texture} bumpScale={0.03} roughness={0.9} />
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
      <mesh position={[0, mast / 2, 0]}>
        <cylinderGeometry args={[r * 0.06, r * 0.1, mast, 8]} />
        <meshToonMaterial color={color} />
      </mesh>
      <group position={[0, mast, 0]} rotation={[tilt, 0, 0]}>
        <mesh>
          <sphereGeometry args={[r, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.28]} />
          <meshToonMaterial color={color} map={texture} bumpMap={texture} bumpScale={0.035} side={THREE.DoubleSide} />
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
