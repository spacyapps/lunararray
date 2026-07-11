"use client";

// Client boundary for the 3D map. The Canvas itself is loaded with
// ssr:false (WebGL only exists in the browser); this wrapper owns the
// full-viewport frame so there's no layout shift while it loads.

import dynamic from "next/dynamic";

const MapScene = dynamic(() => import("./MapScene"), {
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

export default function MapRoot() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <MapScene />
    </div>
  );
}
