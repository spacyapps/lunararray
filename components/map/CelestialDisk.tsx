"use client";

// Circular celestial billboard (Earth / Sun). Hard-edged alpha — no soft
// halo ring. Sun UVs zoom to the photosphere so baked corona rays are gone.

import { Suspense, useLayoutEffect, useMemo } from "react";
import { Billboard, useTexture } from "@react-three/drei";
import * as THREE from "three";

/** Hard circular alpha. Soft stays tiny so there is no pale outer ring. */
function makeCircleAlpha(size = 256, soft = 0.01): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d")!;
  const c = size / 2;
  const r = size / 2 - 1;
  const g = ctx.createRadialGradient(c, c, r * Math.max(0, 1 - soft * 10), c, c, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.9, "#ffffff");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function prepMap(map: THREE.Texture, uvZoom = 1) {
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  // uvZoom < 1 crops outer texture (e.g. sun corona) into the disk
  const z = Math.min(1, Math.max(0.2, uvZoom));
  map.repeat.set(z, z);
  map.offset.set((1 - z) / 2, (1 - z) / 2);
  map.needsUpdate = true;
}

function DiskMesh({
  url,
  size,
  position,
  /** Fraction of source image used (1 = full). Sun uses ~0.7 to drop rays. */
  uvZoom = 1,
}: {
  url: string;
  size: number;
  position: [number, number, number];
  uvZoom?: number;
}) {
  const map = useTexture(url);
  const alpha = useMemo(() => makeCircleAlpha(256, 0.012), []);
  useLayoutEffect(() => {
    prepMap(map, uvZoom);
  }, [map, uvZoom]);

  return (
    <Billboard position={position} follow>
      <mesh scale={[size, size, 1]} renderOrder={-1}>
        <circleGeometry args={[0.5, 64]} />
        <meshBasicMaterial
          map={map}
          alphaMap={alpha}
          transparent
          depthWrite={false}
          toneMapped={false}
          color="#ffffff"
          alphaTest={0.5}
        />
      </mesh>
    </Billboard>
  );
}

/** Earth disk for base-sky views. */
export function EarthDisk({
  position = [-38, 42, -72] as [number, number, number],
  size = 16,
}: {
  position?: [number, number, number];
  size?: number;
}) {
  return (
    <Suspense fallback={null}>
      <DiskMesh url="/textures/earth-disk.jpg" size={size} position={position} uvZoom={0.96} />
    </Suspense>
  );
}

/** Sun disk — photosphere only; source corona / rays cropped out of UV. */
export function SunDisk({
  position = [-48, 36, 40] as [number, number, number],
  size = 8,
}: {
  position?: [number, number, number];
  size?: number;
}) {
  return (
    <Suspense fallback={null}>
      <group>
        <DiskMesh url="/textures/sun-disk.jpg" size={size} position={position} uvZoom={0.68} />
        <pointLight position={position} color="#ffe6c4" intensity={1.4} distance={100} decay={2} />
      </group>
    </Suspense>
  );
}
