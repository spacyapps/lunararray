"use client";

import { useSyncExternalStore } from "react";

// Access-gate lore, not real auth: once the boot sequence in BootOverlay
// runs to completion, this flips true — the landing page's nav link goes
// from locked text to a real link, and MapRoot swaps its lock screen for
// the actual map. Persisted in localStorage so it stays unlocked across
// reloads.
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
