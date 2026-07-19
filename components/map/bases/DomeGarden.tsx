"use client";

// Production greenery under sealed glass. Domes sit in dug crater bowls for
// micrometeorite/radiation protection — beds read as many crop rows, not one bush.

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
  const repeat = Math.max(5, Math.round(radius * 0.95));

  useEffect(() => {
    let cancelled = false;
    loadTexture("/textures/greenhouse-rows.jpg", {
      wrap: THREE.RepeatWrapping,
      repeat: [repeat, repeat],
      anisotropy: 8,
    }).then((t) => {
      if (!cancelled) setMap(t);
    });
    return () => {
      cancelled = true;
    };
  }, [repeat]);

  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius * 0.9, 48]} />
        <meshStandardMaterial
          map={map ?? undefined}
          color={map ? "#eef6ea" : "#2a6a3a"}
          bumpMap={map ?? undefined}
          bumpScale={0.04}
          roughness={0.88}
          metalness={0.02}
          emissive="#0c2814"
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* Secondary soil bed ring for depth under glass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[radius * 0.55, radius * 0.82, 40]} />
        <meshStandardMaterial
          map={map ?? undefined}
          color="#d8e8d0"
          bumpMap={map ?? undefined}
          bumpScale={0.03}
          roughness={0.9}
          metalness={0.02}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
      {/* walkway ring at glass edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[radius * 0.86, radius * 0.94, 48]} />
        <meshStandardMaterial color="#c8c4b8" roughness={0.7} metalness={0.18} />
      </mesh>
      <pointLight position={[0, 1.0, 0]} intensity={3.5} color="#9be8b0" distance={radius * 1.4} decay={2} />
    </group>
  );
}
