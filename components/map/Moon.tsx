"use client";

// Procedural Moon for the 3D map. The color/bump texture is drawn onto a
// canvas from the same MARIA/CRATERS data as the 2D globe, so both views
// show the same face. No external images.

import { useMemo } from "react";
import * as THREE from "three";
import { CRATERS, MARIA, smallCraters, tychoRays, C } from "@/lib/octogram-geometry";

export const MOON_RADIUS = 2;

const D2R = Math.PI / 180;

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

function drawMoonTexture(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;

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
    const stretch = 1 / Math.max(0.25, Math.cos(mare.lat * D2R));
    const rx = (angDeg(mare.rx) / 360) * w * stretch;
    const ry = (angDeg(mare.ry) / 180) * h;
    for (let j = 0; j < 7; j++) {
      const jx = (seedRand(m * 31 + j * 7 + 1) - 0.5) * rx * 0.5;
      const jy = (seedRand(m * 37 + j * 11 + 2) - 0.5) * ry * 0.5;
      const sr = 0.55 + seedRand(m * 13 + j * 3) * 0.55;
      ctx.fillStyle = C.mare;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(cx + jx, cy + jy, rx * sr, ry * sr, seedRand(m + j) * Math.PI, 0, Math.PI * 2);
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
  const { map, bump } = useMemo(() => {
    const canvas = drawMoonTexture();
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return { map, bump: new THREE.CanvasTexture(canvas) };
  }, []);

  const rimUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color("#5cd6ff") } }),
    [],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[MOON_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={map}
          bumpMap={bump}
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
