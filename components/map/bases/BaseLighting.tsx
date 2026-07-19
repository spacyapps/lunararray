"use client";

// Shared lighting for local base scenes — warm key + cool fill, modest
// shadows. God-ray cones removed (looked like visual noise).

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
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

export default function BaseLighting({
  keyPos = KEY_POS,
  keyColor = "#fff1dc",
  keyIntensity = 3.0,
  fillPos = [28, 14, -30] as [number, number, number],
  fillColor = "#7ec8ff",
  fillIntensity = 1.0,
  ambient = 0.14,
  contact = true,
}: {
  keyPos?: [number, number, number];
  keyColor?: string;
  keyIntensity?: number;
  fillPos?: [number, number, number];
  fillColor?: string;
  fillIntensity?: number;
  ambient?: number;
  /** @deprecated ignored — god rays removed */
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
