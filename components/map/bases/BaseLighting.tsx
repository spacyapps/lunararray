"use client";

// Shared lighting for local base scenes — warm key + cool fill, modest
// shadows, optional god-ray shafts. Tuned for 60fps (1024 shadow maps,
// 3 ray cones max, no SoftShadows — incompatible with three r185).

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function applyRendererQuality(gl: THREE.WebGLRenderer, shadows: boolean) {
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.12;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  if (shadows) {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
  }
}

export function RendererQuality({ shadows = true }: { shadows?: boolean }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    applyRendererQuality(gl, shadows);
  }, [gl, shadows]);
  return null;
}

const KEY_POS: [number, number, number] = [-40, 32, 24];

function GodRays({
  origin = KEY_POS,
  color = "#ffe6c4",
  count = 3,
}: {
  origin?: [number, number, number];
  color?: string;
  count?: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    const kids = group.current.children;
    for (let i = 0; i < kids.length; i++) {
      const m = (kids[i] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) m.opacity = 0.03 + 0.012 * Math.sin(t * 0.35 + i);
    }
  });

  const ox = origin[0];
  const oy = origin[1];
  const oz = origin[2];
  const rays = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number]; len: number; r: number }[] = [];
    const dir = new THREE.Vector3(-ox, -oy * 0.55, -oz).normalize();
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.1;
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
      const len = 50 + i * 5;
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      const e = new THREE.Euler().setFromQuaternion(q);
      const mid = new THREE.Vector3(ox, oy, oz).add(d.multiplyScalar(len * 0.45));
      list.push({ pos: [mid.x, mid.y, mid.z], rot: [e.x, e.y, e.z], len, r: 2.4 + i * 0.6 });
    }
    return list;
  }, [ox, oy, oz, count]);

  return (
    <group ref={group}>
      {rays.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot} frustumCulled>
          <coneGeometry args={[r.r, r.len, 12, 1, true]} />
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
  keyPos = KEY_POS,
  keyColor = "#fff1dc",
  keyIntensity = 3.0,
  fillPos = [28, 14, -30] as [number, number, number],
  fillColor = "#7ec8ff",
  fillIntensity = 1.0,
  ambient = 0.14,
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
      <hemisphereLight args={["#b8c8e8", "#3a3428", 0.28]} />

      <directionalLight
        position={keyPos}
        intensity={keyIntensity}
        color={keyColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={2}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0003}
        shadow-normalBias={0.05}
      />
      <directionalLight position={fillPos} intensity={fillIntensity} color={fillColor} />

      {godRays && <GodRays origin={keyPos} color={keyColor} count={3} />}
      {contact && (
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.4}
          scale={70}
          blur={2}
          far={22}
          resolution={512}
          frames={1}
          color="#0a0c12"
        />
      )}
    </group>
  );
}
