// Per-base cinematic orbit + approach tuning. Anything not listed uses defaults.

import { ApproachSpec, InteriorSpec, OrbitSpec } from "../view";

export const ORBITS: Record<string, OrbitSpec> = {
  "LA-00": { radius: 32, height: 13, focusHeight: 5, period: 50 },
  "LA-01": { radius: 34, height: 11, focusHeight: 3, period: 52 },
  "LA-02": { radius: 38, height: 15, focusHeight: 4, period: 56 },
  "LA-03": { radius: 36, height: 14, focusHeight: 4.5, period: 50 },
  "LA-04": { radius: 36, height: 12, focusHeight: 3.5, period: 52 },
  "LA-05": { radius: 40, height: 18, focusHeight: 2, period: 58 },
  "LA-06": { radius: 38, height: 14, focusHeight: 5, period: 54 },
  "LA-07": { radius: 37, height: 12, focusHeight: 5, period: 50 },
  "LA-08": { radius: 52, height: 20, focusHeight: 5, period: 54 },
};

/** Closer framing after "Approach" — still exterior. */
export const APPROACHES: Record<string, ApproachSpec> = {
  "LA-00": { radius: 16, height: 7, focusHeight: 4, period: 40 },
  "LA-01": { radius: 15, height: 5, focusHeight: 3, period: 38 },
  "LA-02": { radius: 18, height: 8, focusHeight: 4, period: 42 },
  "LA-03": { radius: 17, height: 7, focusHeight: 4, period: 40 },
  "LA-04": { radius: 16, height: 6, focusHeight: 3, period: 40 },
  "LA-05": { radius: 18, height: 9, focusHeight: 2, period: 44 },
  "LA-06": { radius: 17, height: 7, focusHeight: 4, period: 40 },
  "LA-07": { radius: 16, height: 6, focusHeight: 4, period: 38 },
  "LA-08": { radius: 22, height: 9, focusHeight: 4.5, period: 42 },
};

/** Room-scale orbit for enterable stations. */
export const INTERIORS: Record<string, InteriorSpec> = {
  "LA-08": {
    radius: 3.2,
    height: 1.55,
    focus: [0, 1.45, 0],
    period: 52,
    fov: 55,
  },
};
