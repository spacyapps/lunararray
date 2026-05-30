"use client";

import { useState } from "react";
import BootOverlay from "./BootOverlay";

// The "Request Access" CTA. Like Tsukibase's "Enter Base", it opens a boot-
// sequence overlay (establishing the uplink) rather than navigating away.
export default function RequestAccess() {
  const [booting, setBooting] = useState(false);
  // Bumped on each open so the overlay remounts and replays the sequence from
  // the top (a fresh mount resets its internal state cleanly).
  const [session, setSession] = useState(0);

  function open() {
    setSession((s) => s + 1);
    setBooting(true);
  }

  return (
    <>
      <button type="button" className="la-cta" onClick={open}>
        Request Access <span className="arrow">→</span>
      </button>
      <BootOverlay
        key={session}
        active={booting}
        onDone={() => setBooting(false)}
      />
    </>
  );
}
