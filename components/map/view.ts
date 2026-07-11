// View state machine for the map: high-level map → dive → base orbit → rise.

export type View =
  | { mode: "map" }
  | { mode: "dive"; id: string }
  | { mode: "base"; id: string }
  | { mode: "rise"; id: string };

export const DIVE_DUR = 2.4; // s
export const RISE_DUR = 2.0; // s

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
