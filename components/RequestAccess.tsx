"use client";

import { useState } from "react";
import BootOverlay from "./BootOverlay";

// The "Request Access" CTA. Like Tsukibase's "Enter Base", it opens a boot-
// sequence overlay (establishing the uplink) rather than navigating away.
// `onOpen`/`onDone` are optional — the landing page doesn't need them (the
// overlay closing just reveals the page underneath), but /map's lock screen
// uses both: `onOpen` marks that a live unlock is in flight (so the reveal
// doesn't fire early), `onDone` marks that the user actually dismissed the
// overlay, rather than reacting to the unlock flag directly (which flips
// mid-sequence, before the "temporary access granted" message even gets a
// chance to show).
export default function RequestAccess({
  onOpen,
  onDone,
}: {
  onOpen?: () => void;
  onDone?: () => void;
}) {
  const [booting, setBooting] = useState(false);
  // Bumped on each open so the overlay remounts and replays the sequence from
  // the top (a fresh mount resets its internal state cleanly).
  const [session, setSession] = useState(0);

  function open() {
    setSession((s) => s + 1);
    setBooting(true);
    onOpen?.();
  }

  return (
    <>
      <button type="button" className="la-cta" onClick={open}>
        Request Access <span className="arrow">→</span>
      </button>
      <BootOverlay
        key={session}
        active={booting}
        onDone={() => {
          setBooting(false);
          onDone?.();
        }}
      />
    </>
  );
}
