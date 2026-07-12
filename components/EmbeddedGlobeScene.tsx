"use client";

// The landing-page hero: the same Moon + octogram + hotspots as /map's
// high-level view, at a smaller size and pulled back a touch further so the
// moon doesn't dominate the frame the way the full-viewport /map does.
// Locked (per lib/access.ts) until Request Access completes — pointer-events
// are cut at the wrapper level so nothing in the scene is hoverable or
// clickable while locked, no per-component changes needed. Once unlocked, a
// hotspot click deep-links into /map?station=ID rather than diving in place,
// since porting the full dive/base state machine into this smaller embedded
// view isn't worth the complexity for a landing-page preview.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Moon from "./map/Moon";
import OctogramLines from "./map/OctogramLines";
import Hotspots from "./map/Hotspots";
import Starfield3D from "./map/Starfield3D";
import { STATIONS } from "@/lib/stations";
import { useAccessUnlocked } from "@/lib/access";

const mono: React.CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

export default function EmbeddedGlobeScene() {
  const unlocked = useAccessUnlocked();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hovered = STATIONS.find((s) => s.id === hoveredId) ?? null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: unlocked ? "auto" : "none" }}>
      {/* R3F's Canvas wraps the actual <canvas> in its own internal div that
          sets pointer-events explicitly, breaking inheritance from the
          wrapper above — so the lock has to be set here too, directly. */}
      <Canvas
        camera={{ position: [0, 0.9, 8.4], fov: 38 }}
        gl={{ antialias: true }}
        style={{ position: "absolute", inset: 0, pointerEvents: unlocked ? "auto" : "none" }}
      >
        <color attach="background" args={["#05060a"]} />
        <ambientLight intensity={0.18} />
        <Starfield3D count={500} />
        <directionalLight position={[-6, 4, 5]} intensity={2.2} color="#fff4e0" />
        <directionalLight position={[7, -2, -4]} intensity={1.1} color="#5cd6ff" />
        <Moon />
        <OctogramLines />
        <Hotspots
          onHover={(id) => setHoveredId(id)}
          onSelect={(id) => router.push(`/map?station=${id}`)}
        />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={4.2}
          maxDistance={12}
          rotateSpeed={0.4}
          minAzimuthAngle={-Math.PI * 0.18}
          maxAzimuthAngle={Math.PI * 0.18}
          minPolarAngle={Math.PI * 0.36}
          maxPolarAngle={Math.PI * 0.53}
        />
      </Canvas>

      {/* hover label — bottom-left, matching /map's overlay convention */}
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 16,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.24em", color: hovered?.accent ?? "var(--accent)" }}>
          {hovered ? `${hovered.id} · ${hovered.name}` : ""}
        </div>
      </div>

      {/* locked overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: unlocked ? 0 : 1,
          transition: "opacity 400ms ease",
        }}
      >
        <div
          style={{
            ...mono,
            fontSize: 10.5,
            letterSpacing: "0.3em",
            color: "var(--ink-ghost)",
            background: "rgba(5, 6, 10, 0.55)",
            border: "1px solid rgba(238, 242, 247, 0.14)",
            padding: "10px 18px",
          }}
        >
          Request access to explore
        </div>
      </div>
    </div>
  );
}
