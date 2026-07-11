"use client";

// Distant procedural starfield — random points on a far sphere shell.

import { useMemo } from "react";
import * as THREE from "three";

function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function Starfield3D({ count = 1600 }: { count?: number }) {
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const tint = [
      new THREE.Color("#eef2f7"),
      new THREE.Color("#a8eaff"),
      new THREE.Color("#ffe9c9"),
    ];
    for (let i = 0; i < count; i++) {
      // uniform direction on sphere
      const u = seedRand(i * 3 + 1) * 2 - 1;
      const phi = seedRand(i * 3 + 2) * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 60 + seedRand(i * 3 + 3) * 30;
      positions[i * 3] = s * Math.cos(phi) * r;
      positions[i * 3 + 1] = u * r;
      positions[i * 3 + 2] = s * Math.sin(phi) * r;
      const c = tint[Math.floor(seedRand(i * 5 + 7) * 3)];
      const b = 0.4 + seedRand(i * 7 + 11) * 0.6;
      colors[i * 3] = c.r * b;
      colors[i * 3 + 1] = c.g * b;
      colors[i * 3 + 2] = c.b * b;
    }
    return { positions, colors };
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}
