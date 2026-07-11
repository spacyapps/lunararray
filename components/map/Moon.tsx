"use client";

// Procedural Moon for the 3D map, with the real NASA photo (same
// /moon-nasa.jpg used on the landing page hero) reprojected onto the near
// (Earth-facing) hemisphere for a sharp, authentic "money shot" face. The
// far hemisphere — which no photo of the real Moon shows anyway, since it's
// never visible from Earth — stays procedural, generated from the same
// MARIA/CRATERS data as the 2D globe. A soft feather blends the two where
// they meet near the limb.

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CRATERS, MARIA, smallCraters, tychoRays, C } from "@/lib/octogram-geometry";

export const MOON_RADIUS = 2;

const D2R = Math.PI / 180;
const TEX_W = 2048;
const TEX_H = 1024;

function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Equirect mapping matched to THREE.SphereGeometry UVs: lon 0 faces +Z.
function px(lon: number, w: number): number {
  return (((lon + 90 + 360) % 360) / 360) * w;
}
function py(lat: number, h: number): number {
  return ((90 - lat) / 180) * h;
}
// Angular size (deg) of a projected unit-sphere radius (sin of the angle).
function angDeg(unit: number): number {
  return Math.asin(Math.min(1, unit)) / D2R;
}

function drawProceduralBase(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Highland base with soft mottling
  ctx.fillStyle = C.moonMid;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = seedRand(i * 2 + 1) * w;
    const y = seedRand(i * 2 + 2) * h;
    const r = 8 + seedRand(i * 3 + 5) * 60;
    const light = seedRand(i * 5 + 9) > 0.5;
    ctx.fillStyle = light ? C.moonLit : C.moonDark;
    ctx.globalAlpha = 0.05 + seedRand(i * 7 + 3) * 0.07;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + seedRand(i) * 0.8), seedRand(i * 11) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Maria — irregular dark plains (each drawn as jittered overlapping blobs)
  for (let m = 0; m < MARIA.length; m++) {
    const mare = MARIA[m];
    const cx = px(mare.lon, w);
    const cy = py(mare.lat, h);
    // cap the equirect stretch near the poles: high-lat maria (Frigoris)
    // otherwise smear into petals converging on the pole
    const stretch = 1 / Math.max(0.62, Math.cos(mare.lat * D2R));
    const highLat = Math.abs(mare.lat) > 45;
    const jitterK = highLat ? 0.18 : 0.5;
    const rx = (angDeg(mare.rx) / 360) * w * stretch;
    const ry = (angDeg(mare.ry) / 180) * h;
    for (let j = 0; j < 7; j++) {
      const jx = (seedRand(m * 31 + j * 7 + 1) - 0.5) * rx * jitterK;
      const jy = (seedRand(m * 37 + j * 11 + 2) - 0.5) * ry * jitterK;
      const sr = 0.55 + seedRand(m * 13 + j * 3) * 0.55;
      ctx.fillStyle = C.mare;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      // keep long axes horizontal near the poles or they fan into petals
      ctx.ellipse(cx + jx, cy + jy, rx * sr, ry * sr, highLat ? 0 : seedRand(m + j) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // darker core
    ctx.fillStyle = C.mareDark;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Tycho rays — bright streaks radiating from Tycho
  const tycho = { lat: -43, lon: -11 };
  for (const ray of tychoRays()) {
    ctx.strokeStyle = C.rim;
    ctx.globalAlpha = ray.op * 0.9;
    ctx.lineWidth = 2 + seedRand(ray.end.lat) * 3;
    ctx.beginPath();
    ctx.moveTo(px(tycho.lon, w), py(tycho.lat, h));
    ctx.lineTo(px(ray.end.lon, w), py(ray.end.lat, h));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Small anonymous craters
  for (const sc of smallCraters()) {
    const r = (angDeg(sc.r) / 180) * h;
    const x = px(sc.lon, w);
    const y = py(sc.lat, h);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = C.craterFloor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = C.rim;
    ctx.lineWidth = Math.max(1, r * 0.3);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Named craters
  for (const cr of CRATERS) {
    const r = (angDeg(cr.r) / 180) * h;
    const x = px(cr.lon, w);
    const y = py(cr.lat, h);
    if (cr.kind === "bright" || cr.kind === "very-bright") {
      ctx.fillStyle = cr.kind === "very-bright" ? C.aristarchus : C.craterBright;
      ctx.globalAlpha = cr.kind === "very-bright" ? 0.9 : 0.55;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // halo
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (cr.kind === "dark") {
      ctx.fillStyle = C.craterFloor;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.rim;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = Math.max(1.5, r * 0.18);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = C.moonDark;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.rim;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = Math.max(1.5, r * 0.22);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// The photo's disc fills ~98% of the square frame (measured), centered.
// Sample slightly inside that so grazing rays never pick up the black
// letterboxing around the disc.
const PHOTO_SCALE = 0.965;
// Feather band (in z = cos(lat)cos(lon), i.e. cosine of angle from the
// sub-camera point) where the real photo fades into the procedural far
// side — a few degrees is enough since both sides read as grayscale rock.
const FEATHER_Z = 0.16;

// Reproject the orthographic disc photo onto the near-hemisphere band of
// the equirect canvas (lon -90..90, all lat — exactly half the canvas
// width, since that's the visible hemisphere from directly in front) and
// composite it over the procedural base with a soft edge feather.
function paintPhotoHemisphere(
  mainCtx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = sw;
  srcCanvas.height = sh;
  const srcCtx = srcCanvas.getContext("2d")!;
  srcCtx.drawImage(img, 0, 0);
  const src = srcCtx.getImageData(0, 0, sw, sh).data;

  const destW = Math.round(w / 2);
  const destH = h;
  const dest = mainCtx.createImageData(destW, destH);

  for (let py_ = 0; py_ < destH; py_++) {
    const lat = 90 - (py_ / destH) * 180;
    const latR = lat * D2R;
    const sinLat = Math.sin(latR);
    const cosLat = Math.cos(latR);
    for (let px_ = 0; px_ < destW; px_++) {
      const lon = (px_ / destW) * 180 - 90;
      const lonR = lon * D2R;
      const x = cosLat * Math.sin(lonR);
      const y = sinLat;
      const z = cosLat * Math.cos(lonR);
      if (z <= 0) continue;

      const su = 0.5 + (x / PHOTO_SCALE) * 0.5;
      const sv = 0.5 - (y / PHOTO_SCALE) * 0.5;
      if (su < 0 || su > 1 || sv < 0 || sv > 1) continue;
      const sx = Math.min(sw - 1, Math.max(0, Math.round(su * sw)));
      const sy = Math.min(sh - 1, Math.max(0, Math.round(sv * sh)));
      const si = (sy * sw + sx) * 4;

      const alpha = z < FEATHER_Z ? z / FEATHER_Z : 1;
      const di = (py_ * destW + px_) * 4;
      dest.data[di] = src[si];
      dest.data[di + 1] = src[si + 1];
      dest.data[di + 2] = src[si + 2];
      dest.data[di + 3] = Math.round(255 * alpha);
    }
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = destW;
  tempCanvas.height = destH;
  tempCanvas.getContext("2d")!.putImageData(dest, 0, 0);
  // destX = px(-90, w) = 0 — the visible band starts at the canvas's left edge.
  mainCtx.drawImage(tempCanvas, 0, 0);
}

async function buildMoonTexture(): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas");
  cv.width = TEX_W;
  cv.height = TEX_H;
  const ctx = cv.getContext("2d")!;
  drawProceduralBase(ctx, TEX_W, TEX_H);
  try {
    const img = await loadImage("/moon-nasa.jpg");
    paintPhotoHemisphere(ctx, img, TEX_W, TEX_H);
  } catch {
    // photo failed to load — procedural base already drawn, carry on
  }
  return cv;
}

// Additive fresnel rim — the anime key-visual glow around the limb.
const rimVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const rimFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
    gl_FragColor = vec4(uColor, fres * 0.55);
  }
`;

export default function Moon() {
  const [textures, setTextures] = useState<{ map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    let cancelled = false;
    buildMoonTexture().then((canvas) => {
      if (cancelled) return;
      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
      setTextures({ map, bump: new THREE.CanvasTexture(canvas) });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Assigning `map`/`bumpMap` on an already-compiled material doesn't
  // recompile its shader on its own — without this the texture is silently
  // ignored and the sphere stays a flat lit gradient.
  useEffect(() => {
    if (materialRef.current) materialRef.current.needsUpdate = true;
  }, [textures]);

  const rimUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color("#5cd6ff") } }),
    [],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[MOON_RADIUS, 96, 96]} />
        <meshStandardMaterial
          ref={materialRef}
          // Plain white once the texture is in, so the photo reads at full
          // brightness (map and color multiply) — moonMid is only a tint for
          // the brief untextured flash before load completes.
          color={textures ? "#ffffff" : C.moonMid}
          map={textures?.map}
          bumpMap={textures?.bump}
          bumpScale={0.6}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      {/* Fresnel rim glow */}
      <mesh scale={1.002}>
        <sphereGeometry args={[MOON_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={rimVertex}
          fragmentShader={rimFragment}
          uniforms={rimUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
