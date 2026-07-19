"use client";

// Photoreal local-scene environment: detailed regolith, instanced craters +
// rocks, circular Earth + Sun disks, horizon haze. Draw-call light by design.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { loadTexture } from "@/lib/three/textureCache";
import { EarthDisk, SunDisk } from "../CelestialDisk";
import { isLowPowerDevice } from "./perf";

function seedRand(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function useSharedMap(url: string, repeat: number, anisotropy = 8) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadTexture(url, { repeat: [repeat, repeat], anisotropy }).then((t) => {
      if (!cancelled) setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [url, repeat, anisotropy]);
  return tex;
}

/** One draw call for rocks via InstancedMesh. */
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
  // Slightly denser icosa for silhouette without full sphere cost
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = seedRand(seed * 100 + i * 3) * Math.PI * 2;
      const r = 12 + seedRand(seed * 100 + i * 3 + 1) * 72;
      const s0 = 0.16 + seedRand(seed * 100 + i * 3 + 2) ** 2 * 1.25;
      dummy.position.set(Math.cos(a) * r, s0 * 0.26, Math.sin(a) * r);
      dummy.scale.set(
        s0,
        s0 * (0.5 + seedRand(i * 5) * 0.6),
        s0 * (0.65 + seedRand(i * 7) * 0.55),
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
    <instancedMesh ref={mesh} args={[geo, undefined, count]} frustumCulled castShadow={false}>
      <meshStandardMaterial
        color={tint}
        map={map ?? undefined}
        bumpMap={map ?? undefined}
        bumpScale={0.09}
        roughness={0.97}
        metalness={0.02}
      />
    </instancedMesh>
  );
}

/** Shallow crater bowls — instanced rings + dark floors for surface detail. */
function InstancedCraters({
  seed = 1,
  count = 28,
  map,
}: {
  seed?: number;
  count?: number;
  map?: THREE.Texture | null;
}) {
  const floorRef = useRef<THREE.InstancedMesh>(null);
  const rimRef = useRef<THREE.InstancedMesh>(null);
  const floorGeo = useMemo(() => new THREE.CircleGeometry(1, 20), []);
  const rimGeo = useMemo(() => new THREE.RingGeometry(0.82, 1.08, 24), []);

  useLayoutEffect(() => {
    if (!floorRef.current || !rimRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = seedRand(seed * 50 + i * 5) * Math.PI * 2;
      const dist = 10 + seedRand(seed * 50 + i * 5 + 1) * 78;
      const s = 1.2 + seedRand(seed * 50 + i * 5 + 2) ** 1.4 * 6.5;
      const x = Math.cos(a) * dist;
      const z = Math.sin(a) * dist;
      const rot = seedRand(seed * 50 + i * 5 + 3) * Math.PI * 2;

      dummy.position.set(x, 0.03, z);
      dummy.rotation.set(-Math.PI / 2, 0, rot);
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      floorRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, 0.045, z);
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      rimRef.current.setMatrixAt(i, dummy.matrix);
    }
    floorRef.current.instanceMatrix.needsUpdate = true;
    rimRef.current.instanceMatrix.needsUpdate = true;
    floorRef.current.computeBoundingSphere();
    rimRef.current.computeBoundingSphere();
  }, [seed, count]);

  return (
    <group>
      <instancedMesh ref={floorRef} args={[floorGeo, undefined, count]} frustumCulled>
        <meshStandardMaterial
          color="#6a665c"
          map={map ?? undefined}
          bumpMap={map ?? undefined}
          bumpScale={0.05}
          roughness={0.98}
          metalness={0.01}
        />
      </instancedMesh>
      <instancedMesh ref={rimRef} args={[rimGeo, undefined, count]} frustumCulled>
        <meshStandardMaterial
          color="#8a867c"
          map={map ?? undefined}
          bumpMap={map ?? undefined}
          bumpScale={0.08}
          roughness={0.96}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
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
  const low = typeof window !== "undefined" && isLowPowerDevice();
  const regolith = useSharedMap(regolithMap, low ? 8 : 14, low ? 4 : 8);
  const rockCount = low ? 48 : 90;
  const craterCount = low ? 16 : 32;

  return (
    <group>
      {/* Main regolith pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[110, low ? 48 : 72]} />
        <meshStandardMaterial
          color={groundColor}
          map={regolith ?? undefined}
          bumpMap={regolith ?? undefined}
          bumpScale={low ? 0.12 : 0.2}
          roughness={0.98}
          metalness={0.015}
        />
      </mesh>
      {/* Mid-ring detail band (finer tile scale) */}
      {!low && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
          <ringGeometry args={[8, 42, 64]} />
          <meshStandardMaterial
            color={groundColor}
            map={regolith ?? undefined}
            bumpMap={regolith ?? undefined}
            bumpScale={0.16}
            roughness={0.97}
            metalness={0.02}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[95, 130, 48]} />
        <meshBasicMaterial color="#05060a" transparent opacity={0.88} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <InstancedCraters seed={seed} count={craterCount} map={regolith} />
      <InstancedRocks seed={seed} tint={rockTint} map={regolith} count={rockCount} />
      <EarthDisk position={[-38, 42, -72]} size={16} />
      <SunDisk position={[-52, 48, 38]} size={7} />
    </group>
  );
}
