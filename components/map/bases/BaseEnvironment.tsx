"use client";

// Photoreal local-scene environment: tiled NASA-style regolith, instanced
// rocks (one draw call), simplified Earth, horizon haze.
// Built for 60fps — no per-rock materials, no rock shadows.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
// useMemo still needed for geometry + texture helpers
import * as THREE from "three";
import { loadTexture } from "@/lib/three/textureCache";

function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function useSharedMap(url: string, repeat: number) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadTexture(url, { repeat: [repeat, repeat], anisotropy: 4 }).then((t) => {
      if (!cancelled) setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [url, repeat]);
  return tex;
}

/** One draw call for ~80 rocks via InstancedMesh. */
function InstancedRocks({
  seed = 1,
  tint = "#7a766c",
  map,
  count = 80,
}: {
  seed?: number;
  tint?: string;
  map?: THREE.Texture | null;
  count?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = seedRand(seed * 100 + i * 3) * Math.PI * 2;
      const r = 14 + seedRand(seed * 100 + i * 3 + 1) * 68;
      const s0 = 0.18 + seedRand(seed * 100 + i * 3 + 2) ** 2 * 1.15;
      dummy.position.set(Math.cos(a) * r, s0 * 0.28, Math.sin(a) * r);
      dummy.scale.set(
        s0,
        s0 * (0.55 + seedRand(i * 5) * 0.55),
        s0 * (0.7 + seedRand(i * 7) * 0.5),
      );
      dummy.rotation.set(
        seedRand(seed * 100 + i * 7) * Math.PI,
        seedRand(seed * 100 + i * 11) * Math.PI,
        seedRand(seed * 100 + i * 13) * Math.PI,
      );
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [seed, count]);

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, count]} frustumCulled>
      <meshStandardMaterial
        color={tint}
        map={map ?? undefined}
        bumpMap={map ?? undefined}
        bumpScale={0.06}
        roughness={0.96}
        metalness={0.02}
      />
    </instancedMesh>
  );
}

function Earth() {
  // Photoreal Earth disk (Blue Marble) as a camera-facing billboard — sphere
  // UVs fight a full-disk photo; from the lunar near side a billboard reads true.
  const [map, setMap] = useState<THREE.Texture | null>(null);
  const group = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;
    loadTexture("/textures/earth-disk.jpg", {
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

  // Face the base origin (viewer looks outward at Earth)
  useLayoutEffect(() => {
    if (!group.current) return;
    group.current.lookAt(0, 8, 0);
  }, []);

  return (
    <group ref={group} position={[-42, 52, -88]}>
      <sprite scale={[16, 16, 1]}>
        <spriteMaterial
          map={map ?? undefined}
          color={map ? "#ffffff" : "#3d6fd6"}
          transparent
          depthWrite={false}
        />
      </sprite>
      {/* atmospheric halo */}
      <sprite scale={[19.5, 19.5, 1]}>
        <spriteMaterial
          color="#7db4ff"
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

export default function BaseEnvironment({
  groundColor = "#9a9588",
  rockTint = "#7a766c",
  seed = 1,
  regolithMap = "/textures/lunar-regolith.jpg",
}: {
  groundColor?: string;
  rockTint?: string;
  seed?: number;
  regolithMap?: string;
}) {
  const regolith = useSharedMap(regolithMap, 12);

  return (
    <group>
      {/* Single disc — was 3 layered rings with separate materials */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[110, 64]} />
        <meshStandardMaterial
          color={groundColor}
          map={regolith ?? undefined}
          bumpMap={regolith ?? undefined}
          bumpScale={0.14}
          roughness={0.97}
          metalness={0.02}
        />
      </mesh>
      {/* horizon fade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[95, 130, 48]} />
        <meshBasicMaterial color="#05060a" transparent opacity={0.88} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <InstancedRocks seed={seed} tint={rockTint} map={regolith} count={72} />
      <Earth />
    </group>
  );
}
