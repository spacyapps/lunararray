"use client";

// Shared photoreal lighting for local base scenes: warm key sun, cool fill,
// soft contact shadows, and additive god-ray shafts. Mount once per exterior base.
//
// Note: do NOT use @react-three/drei SoftShadows with three r185 — its PCSS
// shader still calls unpackRGBAToDepth, which was removed, and floods the
// console with MeshStandardMaterial compile errors.

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/** Isolated so the immutability linter doesn't treat useThree().gl writes
 *  as direct hook-value mutation (same pattern as CameraDirector.applyFov). */
function applyRendererQuality(gl: THREE.WebGLRenderer, shadows: boolean) {
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.15;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  if (shadows) {
    gl.shadowMap.enabled = true;
    // PCFSoftShadowMap is deprecated in r185 — use PCFShadowMap.
    gl.shadowMap.type = THREE.PCFShadowMap;
  }
}

/** Configure the WebGL renderer for ACES filmic tone mapping once per canvas. */
export function RendererQuality({ shadows = true }: { shadows?: boolean }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    applyRendererQuality(gl, shadows);
  }, [gl, shadows]);
  return null;
}

/** Volumetric-looking god rays: elongated cones along the key-sun direction. */
function GodRays({
  origin = [-48, 36, 22] as [number, number, number],
  color = "#ffe6c4",
  count = 5,
}: {
  origin?: [number, number, number];
  color?: string;
  count?: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) m.opacity = 0.028 + 0.012 * Math.sin(t * 0.35 + i * 1.1);
    });
  });

  const rays = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number]; len: number; r: number }[] = [];
    const ox = origin[0];
    const oy = origin[1];
    const oz = origin[2];
    const dir = new THREE.Vector3(-ox, -oy * 0.55, -oz).normalize();
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.08;
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
      const len = 55 + i * 4;
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      const e = new THREE.Euler().setFromQuaternion(q);
      const mid = new THREE.Vector3(ox, oy, oz).add(d.clone().multiplyScalar(len * 0.45));
      list.push({
        pos: [mid.x, mid.y, mid.z],
        rot: [e.x, e.y, e.z],
        len,
        r: 2.2 + i * 0.55,
      });
    }
    return list;
  }, [origin, count]);

  return (
    <group ref={group}>
      {rays.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot}>
          <coneGeometry args={[r.r, r.len, 24, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.035}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function BaseLighting({
  keyPos = [-40, 32, 24] as [number, number, number],
  keyColor = "#fff1dc",
  keyIntensity = 3.4,
  fillPos = [28, 14, -30] as [number, number, number],
  fillColor = "#7ec8ff",
  fillIntensity = 1.15,
  ambient = 0.12,
  godRays = true,
  contact = true,
}: {
  keyPos?: [number, number, number];
  keyColor?: string;
  keyIntensity?: number;
  fillPos?: [number, number, number];
  fillColor?: string;
  fillIntensity?: number;
  ambient?: number;
  godRays?: boolean;
  contact?: boolean;
}) {
  return (
    <group>
      <ambientLight intensity={ambient} color="#c8d4e8" />
      <hemisphereLight args={["#b8c8e8", "#3a3428", 0.35]} />

      <directionalLight
        position={keyPos}
        intensity={keyIntensity}
        color={keyColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.00025}
        shadow-normalBias={0.04}
      />
      <directionalLight position={fillPos} intensity={fillIntensity} color={fillColor} />
      <directionalLight position={[0, 50, 0]} intensity={0.25} color="#e8f0ff" />

      {godRays && <GodRays origin={keyPos} color={keyColor} />}
      {contact && (
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.45}
          scale={90}
          blur={2.4}
          far={28}
          resolution={1024}
          color="#0a0c12"
        />
      )}
    </group>
  );
}
