// Per-base cinematic orbit tuning. Anything not listed uses DEFAULT_ORBIT.

import { OrbitSpec } from "../view";

export const ORBITS: Record<string, OrbitSpec> = {
  "LA-00": { radius: 32, height: 13, focusHeight: 5, period: 50 },
  "LA-01": { radius: 34, height: 11, focusHeight: 3, period: 52 },
};
