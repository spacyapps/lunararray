// Per-base cinematic orbit tuning. Anything not listed uses DEFAULT_ORBIT.

import { OrbitSpec } from "../view";

export const ORBITS: Record<string, OrbitSpec> = {
  "LA-00": { radius: 32, height: 13, focusHeight: 5, period: 50 },
  "LA-01": { radius: 34, height: 11, focusHeight: 3, period: 52 },
  "LA-02": { radius: 38, height: 15, focusHeight: 4, period: 56 },
  "LA-03": { radius: 36, height: 14, focusHeight: 4.5, period: 50 },
  "LA-04": { radius: 36, height: 12, focusHeight: 3.5, period: 52 },
  "LA-05": { radius: 40, height: 18, focusHeight: 2, period: 58 },
};
