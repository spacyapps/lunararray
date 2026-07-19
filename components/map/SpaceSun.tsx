"use client";

// Photoreal sun disk for the high-level map / space view — billboard sprite
// so it always faces the camera without expensive sphere UV mapping.

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { loadTexture } from "@/lib/three/textureCache";

export default function SpaceSun({
  position = [-48, 28, 36] as [number, number, number],
  size = 7.5,
}: {
  position?: [number, number, number];
  size?: number;
}) {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  const matRef = useRef<THREE.SpriteMaterial>(null);

  useEffect(() => {
    let cancelled = false;
    loadTexture("/textures/sun-disk.jpg", {
      wrap: THREE.ClampToEdgeWrapping,
      repeat: [1, 1],
      anisotropy: 4,
    }).then((t) => {
      if (!cancelled) setMap(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.92 + 0.06 * Math.sin(clock.getElapsedTime() * 0.7);
    }
  });

  return (
    <group position={position}>
      <sprite scale={[size, size, 1]} renderOrder={-1}>
        <spriteMaterial
          ref={matRef}
          map={map ?? undefined}
          color="#ffffff"
          transparent
          depthWrite={false}
          opacity={0.95}
        />
      </sprite>
      <sprite scale={[size * 1.55, size * 1.55, 1]} renderOrder={-2}>
        <spriteMaterial
          color="#ffb45c"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight color="#ffe6c4" intensity={1.2} distance={80} decay={2} />
    </group>
  );
}
