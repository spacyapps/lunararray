"use client";

// The octogram overlay on the moon: two rotated squares through the eight
// outstations, spokes to the prime hub, and the outer ring — same structure
// as the 2D GlobeOctogram.

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { MAP_OCTO_DEG, STATIONS, mapLatLon } from "@/lib/stations";
import { arcPoints, ringPoints } from "./arcs";
import { MOON_RADIUS } from "./Moon";

const LINE_R = MOON_RADIUS * 1.004;

export default function OctogramLines() {
  const { squares, spokes, ring } = useMemo(() => {
    const outs = STATIONS.filter((s) => s.angle !== null).map((s) => mapLatLon(s));
    const sq = (idxs: number[]) => {
      const pts: THREE.Vector3[][] = [];
      for (let i = 0; i < idxs.length - 1; i++) {
        const a = outs[idxs[i]];
        const b = outs[idxs[i + 1]];
        pts.push(arcPoints(a.lat, a.lon, b.lat, b.lon, LINE_R));
      }
      return pts;
    };
    return {
      squares: [...sq([0, 2, 4, 6, 0]), ...sq([1, 3, 5, 7, 1])],
      spokes: outs.map((o) => arcPoints(0, 0, o.lat, o.lon, LINE_R)),
      ring: ringPoints(0, 0, MAP_OCTO_DEG, LINE_R),
    };
  }, []);

  return (
    <group>
      {squares.map((pts, i) => (
        <Line
          key={`sq-${i}`}
          points={pts}
          color="#5cd6ff"
          transparent
          opacity={0.55}
          lineWidth={1.4}
        />
      ))}
      {spokes.map((pts, i) => (
        <Line
          key={`sp-${i}`}
          points={pts}
          color="#5cd6ff"
          transparent
          opacity={0.22}
          lineWidth={1}
        />
      ))}
      <Line points={ring} color="#5cd6ff" transparent opacity={0.3} lineWidth={1} dashed dashSize={0.05} gapSize={0.03} />
    </group>
  );
}
