"use client";

// Photoreal local-scene environment: tiled NASA-style regolith, instanced
// rocks, circular Earth + Sun disks, horizon haze.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { loadTexture } from "@/lib/three/textureCache";
import { EarthDisk, SunDisk } from "../CelestialDisk";

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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[95, 130, 48]} />
        <meshBasicMaterial color="#05060a" transparent opacity={0.88} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <InstancedRocks seed={seed} tint={rockTint} map={regolith} count={72} />
      {/* Circular photoreal Earth + Sun (always visible in base orbit) */}
      <EarthDisk position={[-38, 42, -72]} size={16} />
      <SunDisk position={[-52, 48, 38]} size={7} />
    </group>
  );
}
