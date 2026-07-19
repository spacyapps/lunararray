"use client";

// Embeds the Godot 4 HTML5 export of the network map.
// Falls back to a clear install message if public/godot/index.html is missing.
//
// After: godot/lunararray_map/scripts/export_web.sh
// serves at: /godot/index.html

import { useEffect, useState } from "react";
import Link from "next/link";

const mono: React.CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

export default function GodotMapEmbed() {
  const [status, setStatus] = useState<"checking" | "ready" | "missing">("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/godot/index.html", { method: "HEAD" })
      .then((r) => {
        if (!cancelled) setStatus(r.ok ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...mono,
          fontSize: 11,
          letterSpacing: "0.24em",
          color: "var(--ink-ghost)",
        }}
      >
        Loading Godot map…
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.3em", color: "var(--accent)" }}>
          Godot map not exported yet
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-dim)", maxWidth: 440 }}>
          Source lives in <code style={{ color: "var(--accent)" }}>godot/lunararray_map/</code>. Install Godot 4,
          open the project, install Web export templates, then run:
        </div>
        <pre
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "none",
            background: "rgba(238,242,247,0.06)",
            border: "1px solid rgba(238,242,247,0.12)",
            padding: "14px 18px",
            color: "var(--ink)",
            textAlign: "left",
            maxWidth: 520,
            overflow: "auto",
          }}
        >
          {`brew install --cask godot
# open godot/lunararray_map once, install Web templates
./godot/lunararray_map/scripts/export_web.sh`}
        </pre>
        <Link
          href="/"
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.26em",
            color: "var(--ink)",
            textDecoration: "none",
            marginTop: 8,
          }}
        >
          ← Back to site
        </Link>
      </div>
    );
  }

  return (
    <iframe
      title="LunarArray Network Map (Godot)"
      src="/godot/index.html"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        background: "#05060a",
      }}
      allow="fullscreen; autoplay; gamepad"
    />
  );
}
