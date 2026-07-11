// LunarArray — 3D map station data
// Nine nodes: LA-00 prime hub at Sinus Medii plus eight outstations on the
// octogram (LA-01..LA-08 in numerical order around the ring, N = 0°,
// clockwise). Positions derive from the same bearing math as the 2D globe
// (lib/octogram-geometry.ts) so the two views agree.
//
// Note: purposes here are the 3D-map lore and intentionally differ from the
// older roles in lib/installations.ts (landing-page copy) — do not merge the
// two without checking with Walter.

import { bearingPoint, OCTO_RADIUS_DEG } from "./octogram-geometry";

export type StationTone =
  | "house" // anime-extreme, warm & organic
  | "military" // hard, cold, geometric (LA-02, LA-05)
  | "foundation"; // severe/utilitarian but not militarized (LA-06)

export interface Station {
  id: string; // "LA-00"
  name: string; // "Sinus Medii"
  purpose: string; // overlay line during flyover
  tone: StationTone;
  /** Degrees clockwise from north on the octogram ring; null = center hub. */
  angle: number | null;
  /** Lunar lat/lon in degrees (derived from angle for outstations). */
  lat: number;
  lon: number;
  /** Accent color for hotspot + scene identity. */
  accent: string;
}

function ringLatLon(angle: number): { lat: number; lon: number } {
  return bearingPoint(OCTO_RADIUS_DEG, angle);
}

function station(
  id: string,
  name: string,
  purpose: string,
  tone: StationTone,
  angle: number | null,
  accent: string,
): Station {
  const { lat, lon } = angle === null ? { lat: 0, lon: 0 } : ringLatLon(angle);
  return { id, name, purpose, tone, angle, lat, lon, accent };
}

export const STATIONS: Station[] = [
  station("LA-00", "Sinus Medii", "Primary spaceport & deep-space communications relay", "house", null, "#5cd6ff"),
  station("LA-01", "Serenitatis", "Inter-Moon transit hub", "house", 0, "#ffb45c"),
  station("LA-02", "Tranquillitatis", "Restricted — military installation", "military", 45, "#8b93a3"),
  station("LA-03", "Nectaris", "Mining", "house", 90, "#ffd75c"),
  station("LA-04", "Fecunditatis", "Manufacturing & communications", "house", 135, "#7cffc4"),
  station("LA-05", "Nubium", "Restricted — military installation", "military", 180, "#a3b0c8"),
  station("LA-06", "Humorum", "Foundation — restricted", "foundation", 225, "#d8c8a8"),
  station("LA-07", "Procellarum", "City expansion zone", "house", 270, "#ff8a5c"),
  station("LA-08", "Imbrium", "City — residential core", "house", 315, "#c48aff"),
];

/** Convert lunar lat/lon to a Three.js position on a sphere of radius r.
 *  +Z faces the viewer (sub-Earth point, LA-00), +Y is lunar north. */
export function latLonToVec3(
  lat: number,
  lon: number,
  r: number,
): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [
    r * Math.cos(la) * Math.sin(lo),
    r * Math.sin(la),
    r * Math.cos(la) * Math.cos(lo),
  ];
}
