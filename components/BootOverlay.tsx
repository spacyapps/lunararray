"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { unlockAccess } from "@/lib/access";

// SSR-safe "are we on the client yet" check — returns false during SSR and the
// hydration pass, true afterwards, without tripping a hydration mismatch.
const emptySubscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

// LunarArray access-request sequence — sister to Tsukibase's "Enter Base" boot
// overlay, re-themed for the spaceport/relay uplink in signal-cyan.
const BOOT_LINES = [
  "» lunararray.boot v1.27.0",
  "» handshake → EARTH-1 UPLINK ............. OK",
  "» auth → access key 0xLA-PRIME-00 ........ OK",
  "» calibrating octogram array ............. OK",
  "» locking on SINUS MEDII 0°00′N 0°00′E ... OK",
  "» opening berth manifest · 09 nodes ...... OK",
  "» credentials received · queued for review.",
  "» clearance status ......... NOT AVAILABLE",
];

export default function BootOverlay({
  active,
  onDone,
}: {
  active: boolean;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [progress, setProgress] = useState(0);
  const isClient = useIsClient();
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // State starts at 0 on mount; the parent remounts (via key) on each open,
    // so no synchronous reset is needed here.
    if (!active) return;
    let i = 0;
    const ids: ReturnType<typeof setTimeout>[] = [];
    function next() {
      i++;
      setShown(i);
      if (i < BOOT_LINES.length) {
        ids.push(setTimeout(next, 280 + Math.random() * 180));
      } else {
        // Full clearance is denied, but the request itself is what unlocks
        // the Array Map nav link — a consolation telemetry feed while
        // clearance is pending.
        ids.push(
          setTimeout(() => {
            setProgress(100);
            unlockAccess();
          }, 80),
        );
      }
    }
    ids.push(setTimeout(next, 120));
    return () => ids.forEach(clearTimeout);
  }, [active]);

  // Escape closes once the overlay is up.
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDoneRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  function dismiss() {
    onDoneRef.current();
  }

  const overlay = (
    <div
      className={"la-boot " + (active ? "on" : "")}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Request access — establishing uplink"
      aria-hidden={!active}
    >
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="ttl">▸ REQUEST ACCESS · ESTABLISHING UPLINK</div>
        <pre>
          {BOOT_LINES.slice(0, shown).map((l, i) => (
            <div key={i}>
              {l.endsWith("OK") ? (
                <>
                  <b>{l.replace(/ ?OK$/, "")}</b>
                  <span style={{ color: "#6ad8a8" }}> OK</span>
                </>
              ) : l.endsWith("NOT AVAILABLE") ? (
                <>
                  <b>{l.replace(/ ?NOT AVAILABLE$/, "")}</b>
                  <span style={{ color: "var(--ember)" }}> NOT AVAILABLE</span>
                </>
              ) : (
                l
              )}
            </div>
          ))}
        </pre>
        <div className="bar-row">
          <span>LINK</span>
          <div className="bar">
            <i style={{ width: progress + "%" }} />
          </div>
          <span>{progress}%</span>
        </div>
        {progress === 100 && (
          <div className="pending">
            <span className="pip" />
            CLEARANCE NOT AVAILABLE · STATION IN LOCK DOWN
          </div>
        )}
        {progress === 100 && (
          <button className="la-boot-close" onClick={dismiss}>
            Close · Stand By
          </button>
        )}
      </div>
    </div>
  );

  // Portal to <body> so the overlay escapes any ancestor stacking context
  // (e.g. the z-indexed copy block the CTA lives in) and covers everything.
  // Gated on isClient so SSR and the hydration pass both render nothing here.
  if (!isClient) return null;
  return createPortal(overlay, document.body);
}
