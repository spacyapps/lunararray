"use client";

// Client boundary for the landing-page embedded globe — same ssr:false
// pattern as MapRoot, since the Canvas needs a real browser/WebGL context.

import dynamic from "next/dynamic";

const EmbeddedGlobeScene = dynamic(() => import("./EmbeddedGlobeScene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "var(--ink-ghost)",
      }}
    >
      Acquiring array…
    </div>
  ),
});

export default function EmbeddedGlobe({ size = 620 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <EmbeddedGlobeScene />
    </div>
  );
}
