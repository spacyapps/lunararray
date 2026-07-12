"use client";

// Drives the camera through the view state machine:
//   map  — OrbitControls own the camera (this component idles)
//   dive — fly from wherever the camera is down toward the clicked station,
//          fading to black over the last stretch, then hand off to "base"
//   base — slow cinematic orbit around the local base scene at the origin
//   rise — fade out, restore the map camera pulling back from the station
//
// The fade layer is a DOM element mutated directly (no per-frame setState).

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STATIONS, latLonToVec3, mapLatLon } from "@/lib/stations";
import { MOON_RADIUS } from "./Moon";
import { View, DIVE_DUR, RISE_DUR, easeInOut, DEFAULT_ORBIT, OrbitSpec, MAP_CAM_POS, MAP_FOV } from "./view";
import { ORBITS } from "./bases/orbits";

const MAP_CAM = new THREE.Vector3(...MAP_CAM_POS);
// Extra beat at full black after the dive animation completes, before
// handing off to "base" mode — cheap insurance against any one-frame
// discontinuity (camera snap, React re-render timing) landing visibly.
const ARRIVAL_HOLD = 0.15;

/** Isolated from CameraDirector's render scope so the compiler's hook-value
 *  immutability check doesn't see this as a direct write to the `camera`
 *  returned by useThree — same underlying mutation as the position/lookAt
 *  calls already used throughout, just on a property three.js has no
 *  dedicated setter method for. */
function applyFov(cam: THREE.PerspectiveCamera, fov: number) {
  cam.fov = fov;
  cam.updateProjectionMatrix();
}

function stationWorld(id: string): THREE.Vector3 {
  const s = STATIONS.find((st) => st.id === id)!;
  const { lat, lon } = mapLatLon(s);
  return new THREE.Vector3(...latLonToVec3(lat, lon, MOON_RADIUS));
}

/** Camera resting point just above a station on the globe (dive endpoint). */
function divePoint(id: string): THREE.Vector3 {
  return stationWorld(id).clone().multiplyScalar(1 + 0.32 / MOON_RADIUS);
}

export default function CameraDirector({
  view,
  onArrived,
  onReturned,
  fadeRef,
}: {
  view: View;
  onArrived: () => void;
  onReturned: () => void;
  fadeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const camera = useThree((s) => s.camera);
  // `fired` guards the completion callback: the state flip is async, so the
  // frame loop can run again while the old mode is still current — clearing
  // the record there would restart the animation from its first frame.
  const anim = useRef<{
    key: string;
    t0: number;
    fromPos: THREE.Vector3;
    fromFocus: THREE.Vector3;
    fromFov: number;
    fired?: boolean;
    holdStart?: number;
  } | null>(null);
  const baseT0 = useRef<number | null>(null);
  const focus = useRef(new THREE.Vector3());

  const setFade = (v: number) => {
    if (fadeRef.current) fadeRef.current.style.opacity = String(Math.min(1, Math.max(0, v)));
  };

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();

    if (view.mode === "map") {
      anim.current = null;
      baseT0.current = null;
      return;
    }

    if (view.mode === "dive") {
      const key = `dive-${view.id}`;
      const pCam = camera as THREE.PerspectiveCamera;
      if (anim.current?.key !== key) {
        anim.current = {
          key,
          t0: now,
          fromPos: camera.position.clone(),
          fromFocus: new THREE.Vector3(0, 0, 0),
          // A deep link from the landing page starts the Canvas at the
          // embedded preview's (narrower) fov instead of the map's own —
          // ease it back to the standard map fov over the dive so a normal
          // in-page dive (already at MAP_FOV) is a no-op, and a deep-linked
          // one lands at the same framing base/rise/map always use.
          fromFov: pCam.fov,
        };
      }
      const a = anim.current;
      const t = Math.min(1, (now - a.t0) / DIVE_DUR);
      const e = easeInOut(t);
      const target = divePoint(view.id);
      const st = stationWorld(view.id);
      camera.position.lerpVectors(a.fromPos, target, e);
      focus.current.lerpVectors(a.fromFocus, st, Math.min(1, e * 1.4));
      camera.lookAt(focus.current);
      if (a.fromFov !== MAP_FOV) {
        applyFov(pCam, THREE.MathUtils.lerp(a.fromFov, MAP_FOV, e));
      }
      // fade to black over the last stretch of the dive
      setFade((t - 0.72) / 0.28);
      if (t >= 1) {
        if (a.holdStart === undefined) a.holdStart = now;
        if (!a.fired && now - a.holdStart >= ARRIVAL_HOLD) {
          a.fired = true;
          onArrived();
        }
      }
      return;
    }

    if (view.mode === "base") {
      anim.current = null;
      const spec: OrbitSpec = ORBITS[view.id] ?? DEFAULT_ORBIT;
      if (baseT0.current === null) baseT0.current = now;
      const t = now - baseT0.current;
      // fade back in over the first beat
      setFade(1 - t / 0.9);
      const a0 = -Math.PI / 3;
      const ang = a0 + (t / spec.period) * Math.PI * 2;
      // gentle vertical breathing so the orbit doesn't feel like a turntable
      const h = spec.height + Math.sin(t * 0.21) * spec.height * 0.18;
      camera.position.set(
        Math.cos(ang) * spec.radius,
        h,
        Math.sin(ang) * spec.radius,
      );
      camera.lookAt(0, spec.focusHeight, 0);
      return;
    }

    if (view.mode === "rise") {
      const key = `rise-${view.id}`;
      if (anim.current?.key !== key) {
        baseT0.current = null;
        anim.current = {
          key,
          t0: now,
          fromPos: divePoint(view.id),
          fromFocus: stationWorld(view.id),
          fromFov: MAP_FOV,
        };
        // camera snaps back above the station behind a fade already at black
        setFade(1);
      }
      const a = anim.current;
      const t = Math.min(1, (now - a.t0) / RISE_DUR);
      const e = easeInOut(t);
      camera.position.lerpVectors(a.fromPos, MAP_CAM, e);
      focus.current.lerpVectors(a.fromFocus, new THREE.Vector3(0, 0, 0), Math.min(1, e * 1.4));
      camera.lookAt(focus.current);
      setFade(1 - t / 0.3);
      if (t >= 1 && !a.fired) {
        a.fired = true;
        // land exactly on the map pose before OrbitControls remounts
        camera.position.copy(MAP_CAM);
        camera.lookAt(0, 0, 0);
        onReturned();
      }
      return;
    }
  });

  return null;
}
