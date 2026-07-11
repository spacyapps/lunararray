"use client";

import Link from "next/link";
import { useAccessUnlocked } from "@/lib/access";

// Brand mark + wordmark + tagline on the left; nav on the right.
// "Tsukibase" is the external sister-site link. "Array Map" is the one live
// link in the nav — the rest are decorative anchors on this single-frame
// page — so it goes first, right after the pip. It starts locked (plain
// text) until the Request Access boot sequence completes, then becomes a
// real link — see lib/access.ts.
export default function Topbar() {
  const unlocked = useAccessUnlocked();
  return (
    <div className="la-topbar">
      <div className="la-brand">
        <span className="mark" />
        <span className="word">
          LUNAR<span className="light">ARRAY</span>
        </span>
        <span className="tag">Near-Side Spaceport · est. M-127</span>
      </div>
      <nav className="la-nav">
        <span className="pip" />
        {unlocked ? (
          <Link href="/map">Array Map</Link>
        ) : (
          <span className="locked" title="Request access to unlock">
            Array Map
          </span>
        )}
        <a href="#status">Status</a>
        <a href="#beacons">Beacons</a>
        <a href="#access">Access</a>
        <a
          href="https://tsukibase.com"
          className="ext"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tsukibase
        </a>
      </nav>
    </div>
  );
}
