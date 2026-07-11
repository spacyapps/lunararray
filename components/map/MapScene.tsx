"use client";

// Root R3F scene for the LunarArray map.
// View flow: high-level moon map → click a hotspot → dive to that base's
// local scene (slow cinematic orbit) → Esc / "Return to array" flies back.

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Moon from "./Moon";
import OctogramLines from "./OctogramLines";
import Hotspots from "./Hotspots";
import Starfield3D from "./Starfield3D";
import CameraDirector from "./CameraDirector";
import BaseScene from "./bases/BaseScene";
import { View } from "./view";
import { STATIONS } from "@/lib/stations";

const mono: React.CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

export default function MapScene() {
  const [view, setView] = useState<View>({ mode: "map" });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const activeId = view.mode === "map" ? null : view.id;
  const active = STATIONS.find((s) => s.id === activeId) ?? null;
  const hovered = STATIONS.find((s) => s.id === hoveredId) ?? null;
  const onMap = view.mode === "map";
  const showMapWorld = view.mode !== "base";
  const mountBase = view.mode === "dive" || view.mode === "base";

  const returnToMap = useCallback(() => {
    setView((v) => (v.mode === "base" ? { mode: "rise", id: v.id } : v));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") returnToMap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [returnToMap]);

  // Label: hovered station on the map, active station during dive/orbit.
  const labelStation = onMap ? hovered : active;

  return (
    <>
      <Canvas
        camera={{ position: [0, 0.9, 6.4], fov: 42 }}
        gl={{ antialias: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#05060a"]} />
        <ambientLight intensity={0.18} />
        <Starfield3D />

        {/* High-level moon map */}
        <group visible={showMapWorld}>
          {/* Anime key lighting: warm key upper-left, cyan back rim */}
          <directionalLight position={[-6, 4, 5]} intensity={2.2} color="#fff4e0" />
          <directionalLight position={[7, -2, -4]} intensity={1.1} color="#5cd6ff" />
          <Moon />
          <OctogramLines />
          <Hotspots
            onHover={(id) => setHoveredId(id)}
            onSelect={(id) => {
              if (onMap) {
                setHoveredId(null);
                setView({ mode: "dive", id });
              }
            }}
          />
        </group>

        {/* Local base scene (origin), mounted from dive so it's warm on arrival */}
        {mountBase && active && (
          <group visible={view.mode === "base"}>
            <BaseScene station={active} />
          </group>
        )}

        <CameraDirector
          view={view}
          fadeRef={fadeRef}
          onArrived={() => setView((v) => (v.mode === "dive" ? { mode: "base", id: v.id } : v))}
          onReturned={() => setView({ mode: "map" })}
        />
        <OrbitControls
          enabled={onMap}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={3.2}
          maxDistance={10}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* Transition fade layer */}
      <div
        ref={fadeRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "#05060a",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Overlay — top-left identity */}
      <div style={{ position: "absolute", top: 28, left: 32, pointerEvents: "none" }}>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.3em", color: "var(--ink)" }}>
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
          {onMap ? "9 nodes · Near side · Octogram" : "On approach"}
        </div>
      </div>

      {/* Overlay — station name + purpose (hover on map, flyover at base) */}
      <div
        style={{
          position: "absolute",
          left: 32,
          bottom: 30,
          pointerEvents: "none",
          opacity: labelStation ? 1 : 0,
          transform: labelStation ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        <div
          style={{
            ...mono,
            fontSize: 10.5,
            letterSpacing: "0.26em",
            color: labelStation?.accent ?? "var(--accent)",
          }}
        >
          {labelStation ? `${labelStation.id} · ${labelStation.name}` : ""}
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
          {labelStation?.purpose}
        </div>
      </div>

      {/* Overlay — return control while orbiting a base */}
      <button
        onClick={returnToMap}
        style={{
          position: "absolute",
          right: 32,
          bottom: 30,
          ...mono,
          fontSize: 10.5,
          letterSpacing: "0.26em",
          color: "var(--ink)",
          background: "rgba(238, 242, 247, 0.06)",
          border: "1px solid rgba(238, 242, 247, 0.18)",
          padding: "10px 16px",
          cursor: "pointer",
          opacity: view.mode === "base" ? 1 : 0,
          pointerEvents: view.mode === "base" ? "auto" : "none",
          transition: "opacity 300ms ease",
        }}
      >
        ← Return to array
      </button>
    </>
  );
}
