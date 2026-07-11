"use client";

// Root R3F scene for the LunarArray map. Step 1: empty scene that renders —
// a placeholder wireframe sphere standing in for the Moon.

import { Canvas } from "@react-three/fiber";

export default function MapScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 45 }}
      gl={{ antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#05060a"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#969aa6" wireframe />
      </mesh>
    </Canvas>
  );
}
