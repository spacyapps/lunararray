"use client";

// Runtime performance helpers for the map Canvas: adaptive pixel ratio and
// frame-time dpr stepping so base scenes stay near 60fps.

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

function detectDprRange(): [number, number] {
  if (typeof window === "undefined") return [1, 1.35];
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  if (coarse || cores <= 4 || mem <= 4) return [1, 1.25];
  if (cores >= 8 && mem >= 8) return [1, 1.5];
  return [1, 1.35];
}

/** Prefer 1× on constrained GPUs; up to 1.5× on desktop. Lazy-read once. */
export function useAdaptiveDpr(): [number, number] {
  return useMemo(() => detectDprRange(), []);
}

/** Drop dpr mid-session if frame time stays high (simple EMA). */
export function AdaptivePerformance({ floor = 1, ceiling = 1.5 }: { floor?: number; ceiling?: number }) {
  const setDpr = useThree((s) => s.setDpr);

  useEffect(() => {
    let frames = 0;
    let acc = 0;
    let last = performance.now();
    let current = ceiling;
    let raf = 0;

    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      acc += dt;
      frames++;
      if (frames >= 45) {
        const avg = acc / frames;
        if (avg > 22 && current > floor) {
          current = Math.max(floor, current - 0.15);
          setDpr(current);
        } else if (avg < 15 && current < ceiling) {
          current = Math.min(ceiling, current + 0.1);
          setDpr(current);
        }
        frames = 0;
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setDpr, floor, ceiling]);

  return null;
}

export function isLowPowerDevice(): boolean {
  if (typeof window === "undefined") return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  return !!(coarse || cores <= 4 || mem <= 4);
}
