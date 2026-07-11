"use client";

import { useSyncExternalStore } from "react";

// Cosmetic access-gate for the Array Map nav link — not real auth, just the
// "request access" lore paying off: once the boot sequence in BootOverlay
// runs to completion, the map link on the landing page goes from locked
// text to a real link. Persisted in localStorage so it stays unlocked
// across reloads; the /map route itself is never blocked, only the nav
// link's appearance.
const KEY = "la-access-requested";
const EVENT = "la-access-changed";

export function unlockAccess() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, "1");
  window.dispatchEvent(new Event(EVENT));
}

function getSnapshot(): boolean {
  return window.localStorage.getItem(KEY) === "1";
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useAccessUnlocked(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
