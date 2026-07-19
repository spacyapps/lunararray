"use client";

// Circular celestial billboard (Earth / Sun). Uses circleGeometry so the
// photo never shows as a square frame; soft alpha falloff at the limb.

import { Suspense, useLayoutEffect, useMemo } from "react";
import { Billboard, useTexture } from "@react-three/drei";
import * as THREE from "three";

function makeCircleAlpha(size = 256, soft = 0.04): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d")!;
  const c = size / 2;
  const r = size / 2 - 1;
  const g = ctx.createRadialGradient(c, c, r * (1 - soft * 3), c, c, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.92, "#ffffff");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function prepMap(map: THREE.Texture) {
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  map.needsUpdate = true;
}

function DiskMesh({
  url,
  size,
  position,
  glowColor,
  glowScale = 1.12,
  glowOpacity = 0.14,
}: {
  url: string;
  size: number;
  position: [number, number, number];
  glowColor: string;
  glowScale?: number;
  glowOpacity?: number;
}) {
  const map = useTexture(url);
  const alpha = useMemo(() => makeCircleAlpha(256, 0.05), []);
  useLayoutEffect(() => {
    prepMap(map);
  }, [map]);

  return (
    <Billboard position={position} follow>
      {/* soft atmospheric / corona halo — also circular */}
      <mesh scale={[size * glowScale, size * glowScale, 1]} renderOrder={-2}>
        <circleGeometry args={[0.5, 64]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={glowOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={[size, size, 1]} renderOrder={-1}>
        <circleGeometry args={[0.5, 64]} />
        <meshBasicMaterial
          map={map}
          alphaMap={alpha}
          transparent
          depthWrite={false}
          toneMapped={false}
          color="#ffffff"
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
      <DiskMesh
        url="/textures/earth-disk.jpg"
        size={size}
        position={position}
        glowColor="#7db4ff"
        glowScale={1.14}
        glowOpacity={0.16}
      />
    </Suspense>
  );
}

/** Sun disk — usable in map space and base sky. */
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
        <DiskMesh
          url="/textures/sun-disk.jpg"
          size={size}
          position={position}
          glowColor="#ffb45c"
          glowScale={1.55}
          glowOpacity={0.22}
        />
        <pointLight position={position} color="#ffe6c4" intensity={1.6} distance={100} decay={2} />
      </group>
    </Suspense>
  );
}
