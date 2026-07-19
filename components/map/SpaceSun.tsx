"use client";

// Map-view sun — thin wrapper around shared circular celestial disk.

import { SunDisk } from "./CelestialDisk";

export default function SpaceSun({
  position = [-48, 28, 36] as [number, number, number],
  size = 9,
}: {
  position?: [number, number, number];
  size?: number;
}) {
  return <SunDisk position={position} size={size} />;
}
