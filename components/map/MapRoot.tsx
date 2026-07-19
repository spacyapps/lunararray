"use client";

// Client boundary for the 3D map. The Canvas itself is loaded with
// ssr:false (WebGL only exists in the browser); this wrapper owns the
// full-viewport frame so there's no layout shift while it loads.
//
// Gated on the same access-request flow as the landing page: arriving here
// without having run the boot sequence shows a lock screen instead of the
// map, with its own Request Access CTA so there's no need to go back to "/".
// useAccessUnlocked() reads localStorage via useSyncExternalStore, so this
// renders "locked" during SSR/hydration and flips live once the client
// snapshot resolves — same one-frame flash the nav link already accepts.
//
// The reveal is deliberately NOT tied directly to the unlock flag: that flag
// flips the instant the boot sequence finishes, which — if the map swapped
// in right then — would unmount the lock screen (and the boot overlay still
// showing "temporary access granted" on it) mid-display. Instead it's gated
// on whether the user actually opened a live boot sequence on THIS screen:
// if they never did (already unlocked from a prior visit), the map shows
// immediately; if they did, the swap waits for them to dismiss the overlay.
// (A "was already unlocked at mount" check built from useState/useEffect
// timing was tried first and is unreliable — useSyncExternalStore's
// SSR-mismatch correction can resolve to the real value after that state
// already latched onto the stale server snapshot.)

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAccessUnlocked } from "@/lib/access";
import RequestAccess from "../RequestAccess";

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

const mono: React.CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

function LockedMap({
  onRequestOpen,
  onRequestDone,
}: {
  onRequestOpen: () => void;
  onRequestDone: () => void;
}) {
  return (
    <>
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
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.3em", color: "var(--accent)" }}>
          Access required
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--ink-dim)", maxWidth: 380 }}>
          The network map is locked to visitors who haven&rsquo;t requested access yet.
          Request access below to unlock all nine berths.
        </div>
      </div>

      <div style={{ position: "absolute", left: 32, bottom: 30 }}>
        <RequestAccess onOpen={onRequestOpen} onDone={onRequestDone} />
      </div>
    </>
  );
}

export default function MapRoot() {
  const unlocked = useAccessUnlocked();
  const [booted, setBooted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // If a live boot sequence was never opened on this screen, `unlocked`
  // alone decides (a returning visitor sees the map immediately). If one
  // was opened, the swap waits until it's dismissed, so the "temporary
  // access granted" message actually gets seen instead of being unmounted
  // out from under itself the instant the unlock flag flips.
  const showMap = unlocked && (!booted || dismissed);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {showMap ? (
        <MapScene />
      ) : (
        <LockedMap onRequestOpen={() => setBooted(true)} onRequestDone={() => setDismissed(true)} />
      )}
    </div>
  );
}
