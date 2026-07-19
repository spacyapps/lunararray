"use client";

// Photoreal vegetation floor under a glass dome — textured disc + soft
// under-glow, no low-poly plant meshes.

import { useEffect, useState } from "react";
import * as THREE from "three";
import { loadTexture } from "@/lib/three/textureCache";

export default function DomeGarden({
  radius = 8.5,
  y = 0.08,
}: {
  radius?: number;
  y?: number;
}) {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadTexture("/textures/dome-vegetation.jpg", {
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

  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius * 0.92, 48]} />
        <meshStandardMaterial
          map={map ?? undefined}
          color={map ? "#ffffff" : "#2a6a3a"}
          roughness={0.88}
          metalness={0.02}
          emissive="#0a2810"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* soft moss rim under glass skirt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[radius * 0.88, radius * 0.96, 48]} />
        <meshStandardMaterial
          color="#1e4a2c"
          roughness={0.9}
          emissive="#0d3018"
          emissiveIntensity={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight position={[0, 1.2, 0]} intensity={6} color="#9be8b0" distance={radius * 1.6} decay={2} />
    </group>
  );
}
