"use client";

// Production greenery under glass: densely tiled crop-row texture so plants
// read as many small beds (industrial greenhouse), not one giant bush.

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
  // Many small rows across the pad — scale with radius so large park dome
  // has denser tiling than tiny satellite domes.
  const repeat = Math.max(4, Math.round(radius * 0.85));

  useEffect(() => {
    let cancelled = false;
    loadTexture("/textures/greenhouse-rows.jpg", {
      wrap: THREE.RepeatWrapping,
      repeat: [repeat, repeat],
      anisotropy: 4,
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
          color={map ? "#e8f0e4" : "#2a6a3a"}
          roughness={0.9}
          metalness={0.02}
          emissive="#0a2010"
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* walkway ring at glass edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[radius * 0.86, radius * 0.94, 48]} />
        <meshStandardMaterial color="#c8c4b8" roughness={0.75} metalness={0.15} />
      </mesh>
      <pointLight position={[0, 1.0, 0]} intensity={4} color="#9be8b0" distance={radius * 1.5} decay={2} />
    </group>
  );
}
