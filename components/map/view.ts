// View state machine for the map: high-level map → dive → base orbit → rise.

export type View =
  | { mode: "map" }
  | { mode: "dive"; id: string }
  | { mode: "base"; id: string }
  | { mode: "rise"; id: string };

export const DIVE_DUR = 2.4; // s
export const RISE_DUR = 2.0; // s

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

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
