// LunarArray — GlobeOctogram geometry
// Orthographic projection of the lunar near-side. Stations sit on real lat/lon;
// connecting lines follow great-circle arcs. Surface detail uses solid fills +
// opacity only (gradients produced rendering artifacts in clipped contexts).

const D2R = Math.PI / 180;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

function sph2cart(latD: number, lonD: number): Vec3 {
  const lat = latD * D2R;
  const lon = lonD * D2R;
  return {
    x: Math.cos(lat) * Math.sin(lon),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.cos(lon),
  };
}

export function project(latD: number, lonD: number): ProjectedPoint {
  const p = sph2cart(latD, lonD);
  return { x: p.x, y: -p.y, z: p.z, visible: p.z > -0.005 };
}

export function gcArc(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
  n = 36,
): ProjectedPoint[] {
  const a = sph2cart(latA, lonA);
  const b = sph2cart(latB, lonB);
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return [{ x: a.x, y: -a.y, z: a.z, visible: a.z > 0 }];
  const so = Math.sin(omega);
  const pts: ProjectedPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = Math.sin((1 - t) * omega) / so;
    const s2 = Math.sin(t * omega) / so;
    pts.push({
      x: s1 * a.x + s2 * b.x,
      y: -(s1 * a.y + s2 * b.y),
      z: s1 * a.z + s2 * b.z,
      visible: s1 * a.z + s2 * b.z > -0.005,
    });
  }
  return pts;
}

export function sphereRing(
  centerLat: number,
  centerLon: number,
  radiusDeg: number,
  n = 64,
): ProjectedPoint[] {
  const pts: ProjectedPoint[] = [];
  const lat1 = centerLat * D2R;
  const lon1 = centerLon * D2R;
  const d = radiusDeg * D2R;
  for (let i = 0; i <= n; i++) {
    const A = (i / n) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(A),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(A) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      );
    pts.push(project(lat2 / D2R, lon2 / D2R));
  }
  return pts;
}

export function ptsToPath(pts: ProjectedPoint[]): string {
  let path = "";
  let started = false;
  for (const p of pts) {
    if (!p.visible) {
      started = false;
      continue;
    }
    path += `${started ? "L" : "M"}${p.x.toFixed(4)} ${p.y.toFixed(4)} `;
    started = true;
  }
  return path.trim();
}

export interface Maria {
  name: string;
  lat: number;
  lon: number;
  rx: number;
  ry: number;
}

// Maria — real near-side positions, fudged sizes
export const MARIA: Maria[] = [
  { name: "Imbrium",         lat: 33,  lon: -16, rx: 0.22, ry: 0.18 },
  { name: "Serenitatis",     lat: 28,  lon: 17,  rx: 0.17, ry: 0.16 },
  { name: "Tranquillitatis", lat: 8,   lon: 31,  rx: 0.18, ry: 0.14 },
  { name: "Crisium",         lat: 17,  lon: 59,  rx: 0.13, ry: 0.11 },
  { name: "Fecunditatis",    lat: -8,  lon: 51,  rx: 0.14, ry: 0.17 },
  { name: "Nectaris",        lat: -15, lon: 35,  rx: 0.11, ry: 0.11 },
  { name: "Nubium",          lat: -21, lon: -16, rx: 0.18, ry: 0.14 },
  { name: "Humorum",         lat: -24, lon: -38, rx: 0.11, ry: 0.1 },
  { name: "Procellarum",     lat: 18,  lon: -57, rx: 0.3,  ry: 0.34 },
  { name: "Vaporum",         lat: 13,  lon: 4,   rx: 0.07, ry: 0.06 },
  { name: "Frigoris",        lat: 56,  lon: 1,   rx: 0.3,  ry: 0.06 },
  { name: "Cognitum",        lat: -10, lon: -22, rx: 0.07, ry: 0.05 },
  { name: "Insularum",       lat: 8,   lon: -31, rx: 0.1,  ry: 0.08 },
];

export type CraterKind = "bright" | "very-bright" | "dark" | "normal";

export interface Crater {
  name: string;
  lat: number;
  lon: number;
  r: number;
  kind: CraterKind;
}

// Named craters — bright = light spot, dark = dark floor, normal = ringed
export const CRATERS: Crater[] = [
  { name: "Tycho",        lat: -43, lon: -11, r: 0.022, kind: "bright" },
  { name: "Copernicus",   lat: 10,  lon: -20, r: 0.02,  kind: "bright" },
  { name: "Kepler",       lat: 8,   lon: -38, r: 0.012, kind: "bright" },
  { name: "Plato",        lat: 51,  lon: -9,  r: 0.02,  kind: "dark" },
  { name: "Aristarchus",  lat: 24,  lon: -48, r: 0.012, kind: "very-bright" },
  { name: "Grimaldi",     lat: -5,  lon: -68, r: 0.025, kind: "dark" },
  { name: "Langrenus",    lat: -9,  lon: 61,  r: 0.018, kind: "normal" },
  { name: "Petavius",     lat: -25, lon: 61,  r: 0.02,  kind: "normal" },
  { name: "Theophilus",   lat: -11, lon: 26,  r: 0.018, kind: "bright" },
  { name: "Bullialdus",   lat: -21, lon: -22, r: 0.012, kind: "normal" },
  { name: "Eratosthenes", lat: 15,  lon: -11, r: 0.012, kind: "bright" },
  { name: "Archimedes",   lat: 30,  lon: -4,  r: 0.015, kind: "dark" },
  { name: "Endymion",     lat: 53,  lon: 57,  r: 0.016, kind: "dark" },
  { name: "Atlas",        lat: 47,  lon: 44,  r: 0.014, kind: "normal" },
  { name: "Stevinus",     lat: -33, lon: 54,  r: 0.012, kind: "bright" },
  { name: "Schickard",    lat: -44, lon: -55, r: 0.022, kind: "dark" },
  { name: "Clavius",      lat: -58, lon: -14, r: 0.025, kind: "normal" },
  { name: "Maginus",      lat: -50, lon: -6,  r: 0.02,  kind: "normal" },
  { name: "Ptolemaeus",   lat: -9,  lon: -2,  r: 0.018, kind: "dark" },
  { name: "Arzachel",     lat: -18, lon: -2,  r: 0.014, kind: "normal" },
  { name: "Pythagoras",   lat: 64,  lon: -63, r: 0.018, kind: "normal" },
];

function bearingFrom(
  lat1D: number,
  lon1D: number,
  distDeg: number,
  azDeg: number,
): { lat: number; lon: number } {
  const lat1 = lat1D * D2R;
  const lon1 = lon1D * D2R;
  const d = distDeg * D2R;
  const A = azDeg * D2R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(A),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(A) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: lat2 / D2R, lon: lon2 / D2R };
}

function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export interface SmallCrater {
  lat: number;
  lon: number;
  r: number;
}

export function smallCraters(): SmallCrater[] {
  const list: SmallCrater[] = [];
  for (let i = 0; i < 500 && list.length < 90; i++) {
    const lon = (seedRand(i * 2 + 1) - 0.5) * 160;
    const lat = (seedRand(i * 2 + 7) - 0.5) * 160;
    if (Math.abs(lat) > 78) continue;
    const r = 0.0035 + seedRand(i * 3 + 11) * 0.008;
    list.push({ lat, lon, r });
  }
  return list;
}

export interface TychoRay {
  end: { lat: number; lon: number };
  op: number;
}

export function tychoRays(): TychoRay[] {
  const center = { lat: -43, lon: -11 };
  const rays: TychoRay[] = [];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const az = (i / N) * 360 + (seedRand(i + 13) - 0.5) * 16;
    const len = 35 + seedRand(i * 2 + 31) * 40;
    const end = bearingFrom(center.lat, center.lon, len, az);
    rays.push({ end, op: 0.06 + seedRand(i * 3 + 53) * 0.08 });
  }
  return rays;
}

export const OCTO_RADIUS_DEG = 3;
export const AZIMUTHS = [0, 45, 90, 135, 180, 225, 270, 315];

export function bearingPoint(d: number, A: number): { lat: number; lon: number } {
  const Ar = A * D2R;
  const dr = d * D2R;
  const lat = Math.asin(Math.sin(dr) * Math.cos(Ar)) / D2R;
  const lon = Math.atan2(Math.sin(Ar) * Math.sin(dr), Math.cos(dr)) / D2R;
  return { lat, lon };
}

// Surface palette — solid colors only, no gradients
export const C = {
  moonLit: "#bcc0cc", // highland base
  moonMid: "#969aa6", // mid surface
  moonDark: "#5e6270", // shadow side
  mare: "#3e424e", // mare basalt
  mareDark: "#2b2e3a", // mare core
  rim: "#d8dce6", // crater rim highlight
  craterFloor: "#1d2028", // crater shadow
  craterBright: "#dfe3ef",
  aristarchus: "#f0f3ff",
  inset: "#1a1d27", // inset surface (darkened)
  accent: "#5cd6ff",
  accentLight: "#a8eaff",
} as const;
