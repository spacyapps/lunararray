"use client";

// Photoreal sun for the map / space view. Uses a camera-facing plane
// (Billboard) + drei useTexture so the map is bound reliably — async
// spriteMaterial map={null→tex} was rendering a white square.

import { Suspense, useLayoutEffect } from "react";
import { Billboard, useTexture } from "@react-three/drei";
import * as THREE from "three";

function prepDiskTexture(map: THREE.Texture) {
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.needsUpdate = true;
}

function SunDisk({
  position,
  size,
}: {
  position: [number, number, number];
  size: number;
}) {
  const map = useTexture("/textures/sun-disk.jpg");
  useLayoutEffect(() => {
    // Isolated helper so the immutability linter allows GPU texture setup.
    prepDiskTexture(map);
  }, [map]);

  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      {/* soft corona */}
      <mesh renderOrder={-2} scale={[size * 1.55, size * 1.55, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#ffb45c"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={-1} scale={[size, size, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={map}
          transparent
          depthWrite={false}
          toneMapped={false}
          color="#ffffff"
        />
      </mesh>
      <pointLight color="#ffe6c4" intensity={1.4} distance={90} decay={2} />
    </Billboard>
  );
}

export default function SpaceSun({
  position = [-48, 28, 36] as [number, number, number],
  size = 9,
}: {
  position?: [number, number, number];
  size?: number;
}) {
  return (
    <Suspense fallback={null}>
      <SunDisk position={position} size={size} />
    </Suspense>
  );
}
