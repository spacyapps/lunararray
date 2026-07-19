"use client";

// Root R3F scene for the LunarArray map.
// View flow: high-level moon map → dive → base orbit ⇄ approach →
// (LA-08) interior → rise back to map.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Moon from "./Moon";
import OctogramLines from "./OctogramLines";
import Hotspots from "./Hotspots";
import Starfield3D from "./Starfield3D";
import SpaceSun from "./SpaceSun";
import ExploreControls from "./ExploreControls";
import CameraDirector from "./CameraDirector";
import BaseScene from "./bases/BaseScene";
import { RendererQuality } from "./bases/BaseLighting";
import { AdaptivePerformance, useAdaptiveDpr } from "./bases/perf";
import { View, EMBED_CAM_POS, EMBED_FOV, MAP_CAM_POS, MAP_FOV, canEnter } from "./view";
import { STATIONS } from "@/lib/stations";
import { APPROACHES, INTERIORS, ORBITS } from "./bases/orbits";
import { DEFAULT_APPROACH, DEFAULT_INTERIOR, DEFAULT_ORBIT } from "./view";

const mono: React.CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

const btnBase: React.CSSProperties = {
  ...mono,
  fontSize: 10.5,
  letterSpacing: "0.26em",
  color: "var(--ink)",
  background: "rgba(238, 242, 247, 0.06)",
  border: "1px solid rgba(238, 242, 247, 0.18)",
  padding: "10px 16px",
  cursor: "pointer",
  transition: "opacity 300ms ease, border-color 200ms ease, background 200ms ease",
};

export default function MapScene() {
  const searchParams = useSearchParams();
  const requestedStation = searchParams.get("station");
  const isDeepLink = !!requestedStation && STATIONS.some((s) => s.id === requestedStation);
  const [view, setView] = useState<View>(() =>
    isDeepLink ? { mode: "dive", id: requestedStation! } : { mode: "map" },
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [exploreReady, setExploreReady] = useState(false);
  const fadeRef = useRef<HTMLDivElement>(null);

  const activeId = view.mode === "map" ? null : view.id;
  const active = STATIONS.find((s) => s.id === activeId) ?? null;
  const hovered = STATIONS.find((s) => s.id === hoveredId) ?? null;
  const onMap = view.mode === "map";
  const showMapWorld = view.mode !== "base" && view.mode !== "approach" && view.mode !== "interior";
  const mountBase =
    view.mode === "dive" ||
    view.mode === "base" ||
    view.mode === "approach" ||
    view.mode === "interior";
  const showInterior = view.mode === "interior";
  const enterable = activeId ? canEnter(activeId) : false;

  const returnToMap = useCallback(() => {
    setView((v) => {
      if (v.mode === "interior") return { mode: "base", id: v.id };
      if (v.mode === "approach" || v.mode === "base") return { mode: "rise", id: v.id };
      return v;
    });
  }, []);

  const approachBase = useCallback(() => {
    setExploreReady(false);
    setView((v) => {
      if (v.mode === "base") return { mode: "approach", id: v.id };
      if (v.mode === "approach") return { mode: "base", id: v.id };
      return v;
    });
  }, []);

  const enterResidence = useCallback(() => {
    // Black out before the exterior unmounts so the swap never flashes.
    if (fadeRef.current) fadeRef.current.style.opacity = "1";
    setView((v) => {
      if ((v.mode === "base" || v.mode === "approach") && canEnter(v.id)) {
        return { mode: "interior", id: v.id };
      }
      return v;
    });
  }, []);

  const exitResidence = useCallback(() => {
    if (fadeRef.current) fadeRef.current.style.opacity = "1";
    setView((v) => (v.mode === "interior" ? { mode: "base", id: v.id } : v));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view.mode === "interior") exitResidence();
        else returnToMap();
      }
      if (e.key === "e" || e.key === "E") {
        if (view.mode === "interior") exitResidence();
        else if (enterable && (view.mode === "base" || view.mode === "approach")) enterResidence();
      }
      if (e.key === "a" || e.key === "A") {
        if (view.mode === "base" || view.mode === "approach") approachBase();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.mode, enterable, returnToMap, approachBase, enterResidence, exitResidence]);

  const labelStation = onMap ? hovered : active;

  const statusLine = (() => {
    if (onMap) return "9 nodes · Near side · Octogram";
    if (view.mode === "interior") return "Residence · drag to look · Esc exit";
    if (view.mode === "approach") return "Close approach · drag explore · A / Esc";
    if (view.mode === "base") return "Explore · drag orbit · scroll zoom · A / Esc";
    return "On approach";
  })();

  const orbitSpec = activeId ? ORBITS[activeId] ?? DEFAULT_ORBIT : DEFAULT_ORBIT;
  const approachSpec = activeId ? APPROACHES[activeId] ?? DEFAULT_APPROACH : DEFAULT_APPROACH;
  const interiorSpec = activeId ? INTERIORS[activeId] ?? DEFAULT_INTERIOR : DEFAULT_INTERIOR;
  const exploreExterior = exploreReady && (view.mode === "base" || view.mode === "approach");
  const exploreInterior = exploreReady && view.mode === "interior";
  // Shadows only when the local base is fully visible (not the tiny warm-up scale).
  const baseLive =
    view.mode === "base" || view.mode === "approach" || view.mode === "interior";
  const dprRange = useAdaptiveDpr();

  return (
    <>
      <Canvas
        shadows={baseLive}
        camera={{ position: isDeepLink ? EMBED_CAM_POS : MAP_CAM_POS, fov: isDeepLink ? EMBED_FOV : MAP_FOV }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={dprRange}
        style={{ position: "absolute", inset: 0 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap;
          gl.shadowMap.autoUpdate = true;
        }}
      >
        <RendererQuality shadows={baseLive} />
        <AdaptivePerformance floor={dprRange[0]} ceiling={dprRange[1]} />
        <color attach="background" args={["#05060a"]} />
        <ambientLight intensity={showInterior ? 0 : 0.18} />
        {/* Starfield only on the moon map — not inside bases (saves draw). */}
        {showMapWorld && (
          <>
            <Starfield3D />
            <SpaceSun />
          </>
        )}

        <group visible={showMapWorld}>
          <directionalLight position={[-6, 4, 5]} intensity={2.2} color="#fff4e0" />
          <directionalLight position={[7, -2, -4]} intensity={1.1} color="#5cd6ff" />
          <Moon />
          <OctogramLines />
          <Hotspots
            onHover={(id) => setHoveredId(id)}
            onSelect={(id) => {
              if (onMap) {
                setHoveredId(null);
                setExploreReady(false);
                setView({ mode: "dive", id });
              }
            }}
          />
        </group>

        {mountBase && active && (
          <group scale={baseLive ? 1 : 0.001}>
            <BaseScene station={active} interior={showInterior} />
          </group>
        )}

        <CameraDirector
          view={view}
          fadeRef={fadeRef}
          deepLink={isDeepLink}
          onArrived={() => setView((v) => (v.mode === "dive" ? { mode: "base", id: v.id } : v))}
          onReturned={() => {
            setExploreReady(false);
            setView({ mode: "map" });
          }}
          onExploreReady={setExploreReady}
        />
        {onMap && (
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={3.2}
            maxDistance={10}
            rotateSpeed={0.5}
            minAzimuthAngle={-Math.PI * 0.18}
            maxAzimuthAngle={Math.PI * 0.18}
            minPolarAngle={Math.PI * 0.36}
            maxPolarAngle={Math.PI * 0.53}
            autoRotate
            autoRotateSpeed={0.12}
          />
        )}
        {/* Exterior explore: always mounted while at base so handoff is seamless */}
        {(view.mode === "base" || view.mode === "approach") && (
          <ExploreControls
            enabled={exploreExterior}
            target={[0, view.mode === "approach" ? approachSpec.focusHeight : orbitSpec.focusHeight, 0]}
            minDistance={view.mode === "approach" ? approachSpec.radius * 0.55 : orbitSpec.radius * 0.45}
            maxDistance={view.mode === "approach" ? approachSpec.radius * 1.45 : orbitSpec.radius * 1.55}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI * 0.48}
            autoRotateSpeed={0.35}
          />
        )}
        {view.mode === "interior" && (
          <ExploreControls
            enabled={exploreInterior}
            target={interiorSpec.focus}
            minDistance={1.4}
            maxDistance={4.2}
            minPolarAngle={0.55}
            maxPolarAngle={Math.PI * 0.58}
            autoRotateSpeed={0.22}
            rotateSpeed={0.45}
            zoomSpeed={0.55}
          />
        )}
      </Canvas>

      <div
        ref={fadeRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "#05060a",
          opacity: isDeepLink ? 1 : 0,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "absolute", top: 28, left: 32 }}>
        <Link
          href="/"
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          ← LunarArray · Network Map
        </Link>
        <div
          style={{
            ...mono,
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--ink-ghost)",
            marginTop: 6,
            pointerEvents: "none",
          }}
        >
          {statusLine}
        </div>
      </div>

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
            maxWidth: 360,
          }}
        >
          {view.mode === "interior"
            ? "Residential bay · hydroponic CO₂ recycle · wall-crown gardens"
            : labelStation?.purpose}
        </div>
      </div>

      {/* Right-side controls */}
      <div
        style={{
          position: "absolute",
          right: 32,
          bottom: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {enterable && (view.mode === "base" || view.mode === "approach") && (
          <button
            onClick={enterResidence}
            style={{
              ...btnBase,
              borderColor: "rgba(196, 138, 255, 0.45)",
              background: "rgba(196, 138, 255, 0.12)",
            }}
          >
            Enter residence
          </button>
        )}
        {(view.mode === "base" || view.mode === "approach") && (
          <button
            onClick={approachBase}
            style={{
              ...btnBase,
              opacity: 1,
              pointerEvents: "auto",
            }}
          >
            {view.mode === "approach" ? "← Wider orbit" : "Approach base"}
          </button>
        )}
        {view.mode === "interior" && (
          <button onClick={exitResidence} style={{ ...btnBase, opacity: 1, pointerEvents: "auto" }}>
            ← Exit residence
          </button>
        )}
        {(view.mode === "base" || view.mode === "approach") && (
          <button onClick={returnToMap} style={{ ...btnBase, opacity: 1, pointerEvents: "auto" }}>
            ← Return to array
          </button>
        )}
      </div>
    </>
  );
}
