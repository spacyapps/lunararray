// View state machine for the map:
//   map → dive → base ⇄ approach → interior → (exit) → base → rise → map
//
// LA-00 easter egg lives inside the base scene and is independent of this FSM.

export type View =
  | { mode: "map" }
  | { mode: "dive"; id: string }
  | { mode: "base"; id: string }
  | { mode: "approach"; id: string }
  | { mode: "interior"; id: string }
  | { mode: "rise"; id: string };

export const DIVE_DUR = 2.4; // s
export const RISE_DUR = 2.0; // s
export const APPROACH_DUR = 2.2; // s — orbit → close framing
export const ENTER_DUR = 2.0; // s — approach/base → interior
export const EXIT_INTERIOR_DUR = 1.6; // s — interior → base orbit

// The full /map view's resting camera (used once the dive lands, and as the
// target fov a deep-linked dive eases toward). The landing page's embedded
// preview sits further back and narrower — EMBED_CAM_POS/EMBED_FOV — so a
// deep link (?station=ID) can start /map's camera matched to that framing
// instead of snapping straight to the full-map pose, making the page
// transition read as one continuous zoom rather than a cut-then-zoom.
export const MAP_CAM_POS: [number, number, number] = [0, 0.9, 6.4];
export const MAP_FOV = 42;
export const EMBED_CAM_POS: [number, number, number] = [0, 0.9, 8.4];
export const EMBED_FOV = 38;

// A deep-linked dive (landing page → /map?station=ID) is also the very first
// paint of the Moon, hotspots, and starfield in this tab — real one-time
// generation cost that a same-page dive never pays (everything's already
// warm). Rather than chase every source of that cost, hold the screen at
// full black for DEEP_LINK_HOLD before the dive's motion starts at all, then
// reveal over DEEP_LINK_REVEAL — whatever settling happens during the hold
// is never on screen.
export const DEEP_LINK_HOLD = 1.0; // s
export const DEEP_LINK_REVEAL = 0.4; // s

/** Per-base cinematic orbit parameters (world units, local scene at origin). */
export interface OrbitSpec {
  radius: number;
  height: number;
  focusHeight: number;
  period: number; // seconds per revolution
}

export const DEFAULT_ORBIT: OrbitSpec = {
  radius: 26,
  height: 10,
  focusHeight: 2.5,
  period: 46,
};

/** Close approach framing — tighter, lower, still outside the structures. */
export interface ApproachSpec {
  radius: number;
  height: number;
  focusHeight: number;
  period: number;
}

export const DEFAULT_APPROACH: ApproachSpec = {
  radius: 14,
  height: 5.5,
  focusHeight: 3.2,
  period: 38,
};

/** Interior cinematic orbit (room-scale, slow). */
export interface InteriorSpec {
  radius: number;
  height: number;
  focus: [number, number, number];
  period: number;
  fov: number;
}

export const DEFAULT_INTERIOR: InteriorSpec = {
  radius: 3.4,
  height: 1.55,
  focus: [0, 1.45, 0],
  period: 48,
  fov: 55,
};

/** Stations that support approach + enter (residential). */
export const ENTERABLE_STATIONS = new Set(["LA-08"]);

export function canEnter(id: string): boolean {
  return ENTERABLE_STATIONS.has(id);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Soft ease out for camera handoffs that should settle without a kick. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
