"use client";

// Root R3F scene for the LunarArray map. Step 2: high-level moon map with
// nine clickable hotspots on the octogram, plus a minimal DOM overlay that
// names whatever the pointer is over. Click-to-fly arrives in step 3.

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Moon from "./Moon";
import OctogramLines from "./OctogramLines";
import Hotspots from "./Hotspots";
import Starfield3D from "./Starfield3D";
import { STATIONS } from "@/lib/stations";

const mono: React.CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

export default function MapScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hovered = STATIONS.find((s) => s.id === hoveredId) ?? null;

  return (
    <>
      <Canvas
        camera={{ position: [0, 0.9, 6.4], fov: 42 }}
        gl={{ antialias: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#05060a"]} />
        {/* Anime key lighting: warm key upper-left, cool fill, cyan back rim */}
        <ambientLight intensity={0.18} />
        <directionalLight position={[-6, 4, 5]} intensity={2.2} color="#fff4e0" />
        <directionalLight position={[7, -2, -4]} intensity={1.1} color="#5cd6ff" />
        <Starfield3D />
        <Moon />
        <OctogramLines />
        <Hotspots
          onHover={setHoveredId}
          onSelect={() => {
            /* step 3: fly to base */
          }}
        />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={3.2}
          maxDistance={10}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* Overlay — top-left identity */}
      <div style={{ position: "absolute", top: 28, left: 32, pointerEvents: "none" }}>
        <div
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "var(--ink)",
          }}
        >
          LunarArray · Network Map
        </div>
        <div
          style={{
            ...mono,
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--ink-ghost)",
            marginTop: 6,
          }}
        >
          9 nodes · Near side · Octogram
        </div>
      </div>

      {/* Overlay — hovered station, bottom-left */}
      <div
        style={{
          position: "absolute",
          left: 32,
          bottom: 30,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        <div
          style={{
            ...mono,
            fontSize: 10.5,
            letterSpacing: "0.26em",
            color: hovered?.accent ?? "var(--accent)",
          }}
        >
          {hovered?.id} · {hovered?.name}
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 13.5,
            color: "var(--ink-dim)",
            marginTop: 6,
            maxWidth: 340,
          }}
        >
          {hovered?.purpose}
        </div>
      </div>
    </>
  );
}
