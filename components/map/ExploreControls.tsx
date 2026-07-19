"use client";

// OrbitControls with auto-pan that pauses on user drag and resumes after idle.
// `enabled` gates input during cinematic transitions so CameraDirector owns the camera.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function ExploreControls({
  enabled,
  target,
  minDistance,
  maxDistance,
  minPolarAngle = 0.18,
  maxPolarAngle = Math.PI * 0.48,
  autoRotateSpeed = 0.32,
  rotateSpeed = 0.42,
  zoomSpeed = 0.7,
}: {
  enabled: boolean;
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  autoRotateSpeed?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
}) {
  const ref = useRef<OrbitControlsImpl | null>(null);
  // Resume auto-rotate this many seconds after last pointer up
  const resumeAt = useRef(0);
  const userPaused = useRef(false);

  useFrame(() => {
    const c = ref.current;
    if (!c || !enabled) return;
    if (userPaused.current && performance.now() >= resumeAt.current) {
      userPaused.current = false;
      c.autoRotate = true;
    }
  });

  return (
    <OrbitControls
      ref={ref as React.Ref<OrbitControlsImpl>}
      makeDefault
      enabled={enabled}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={rotateSpeed}
      zoomSpeed={zoomSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      target={target}
      autoRotate={enabled}
      autoRotateSpeed={autoRotateSpeed}
      onStart={() => {
        userPaused.current = true;
        if (ref.current) ref.current.autoRotate = false;
      }}
      onEnd={() => {
        resumeAt.current = performance.now() + 2800;
      }}
    />
  );
}
