"use client";

// Drives the camera through the view state machine:
//   map       — OrbitControls own the camera (this component idles)
//   dive      — fly from wherever the camera is down toward the clicked station
//   base      — slow cinematic orbit around the local base scene at origin
//   approach  — ease from orbit to a tighter exterior framing, then keep orbiting
//   interior  — room-scale orbit inside a residential bay (enterable stations)
//   rise      — fade out, restore the map camera pulling back from the station
//
// The fade layer is a DOM element mutated directly (no per-frame setState).

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STATIONS, latLonToVec3, mapLatLon } from "@/lib/stations";
import { MOON_RADIUS } from "./Moon";
import {
  View,
  DIVE_DUR,
  RISE_DUR,
  APPROACH_DUR,
  ENTER_DUR,
  EXIT_INTERIOR_DUR,
  easeInOut,
  DEFAULT_ORBIT,
  DEFAULT_APPROACH,
  DEFAULT_INTERIOR,
  OrbitSpec,
  ApproachSpec,
  InteriorSpec,
  MAP_CAM_POS,
  MAP_FOV,
  DEEP_LINK_HOLD,
  DEEP_LINK_REVEAL,
} from "./view";
import { APPROACHES, INTERIORS, ORBITS } from "./bases/orbits";

const MAP_CAM = new THREE.Vector3(...MAP_CAM_POS);
const ARRIVAL_HOLD = 0.15;

function applyFov(cam: THREE.PerspectiveCamera, fov: number) {
  cam.fov = fov;
  cam.updateProjectionMatrix();
}

function stationWorld(id: string): THREE.Vector3 {
  const s = STATIONS.find((st) => st.id === id)!;
  const { lat, lon } = mapLatLon(s);
  return new THREE.Vector3(...latLonToVec3(lat, lon, MOON_RADIUS));
}

function divePoint(id: string): THREE.Vector3 {
  return stationWorld(id).clone().multiplyScalar(1 + 0.32 / MOON_RADIUS);
}

function orbitPose(spec: OrbitSpec | ApproachSpec, t: number, a0 = -Math.PI / 3) {
  const ang = a0 + (t / spec.period) * Math.PI * 2;
  const h = spec.height + Math.sin(t * 0.21) * spec.height * 0.18;
  return {
    pos: new THREE.Vector3(Math.cos(ang) * spec.radius, h, Math.sin(ang) * spec.radius),
    focusY: spec.focusHeight,
  };
}

function interiorPose(spec: InteriorSpec, t: number) {
  const ang = (t / spec.period) * Math.PI * 2 + Math.PI * 0.15;
  const breath = Math.sin(t * 0.18) * 0.12;
  const pos = new THREE.Vector3(
    Math.cos(ang) * (spec.radius + breath),
    spec.height + Math.sin(t * 0.15) * 0.15,
    Math.sin(ang) * (spec.radius + breath),
  );
  const focus = new THREE.Vector3(...spec.focus);
  return { pos, focus };
}

export default function CameraDirector({
  view,
  onArrived,
  onReturned,
  onApproachSettled,
  onInteriorSettled,
  /** True once dive/approach/enter/exit handoff finishes — OrbitControls may drive. */
  onExploreReady,
  fadeRef,
  deepLink = false,
}: {
  view: View;
  onArrived: () => void;
  onReturned: () => void;
  onApproachSettled?: () => void;
  onInteriorSettled?: (mode: "interior" | "base") => void;
  onExploreReady?: (ready: boolean) => void;
  fadeRef: React.RefObject<HTMLDivElement | null>;
  deepLink?: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const anim = useRef<{
    key: string;
    t0: number;
    fromPos: THREE.Vector3;
    fromFocus: THREE.Vector3;
    fromFov: number;
    held: boolean;
    fired?: boolean;
    holdStart?: number;
  } | null>(null);
  const baseT0 = useRef<number | null>(null);
  const approachT0 = useRef<number | null>(null);
  const interiorT0 = useRef<number | null>(null);
  const focus = useRef(new THREE.Vector3());
  const deepLinkConsumed = useRef(false);
  // Preserve orbit phase when switching base ⇄ approach so the cut doesn't spin.
  const phaseOffset = useRef(0);

  const setFade = (v: number) => {
    if (fadeRef.current) fadeRef.current.style.opacity = String(Math.min(1, Math.max(0, v)));
  };

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    const pCam = camera as THREE.PerspectiveCamera;

    if (view.mode === "map") {
      anim.current = null;
      baseT0.current = null;
      approachT0.current = null;
      interiorT0.current = null;
      onExploreReady?.(false);
      if (pCam.fov !== MAP_FOV) applyFov(pCam, MAP_FOV);
      return;
    }

    if (view.mode === "dive") {
      onExploreReady?.(false);
      const key = `dive-${view.id}`;
      const holdThisDive = deepLink && !deepLinkConsumed.current;
      if (anim.current?.key !== key) {
        deepLinkConsumed.current = true;
        anim.current = {
          key,
          t0: now + (holdThisDive ? DEEP_LINK_HOLD : 0),
          fromPos: camera.position.clone(),
          fromFocus: new THREE.Vector3(0, 0, 0),
          fromFov: pCam.fov,
          held: holdThisDive,
        };
      }
      const a = anim.current;
      if (now < a.t0) {
        setFade(1);
        return;
      }
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
      const revealFade = a.held ? 1 - Math.min(1, (now - a.t0) / DEEP_LINK_REVEAL) : 0;
      const endFade = (t - 0.72) / 0.28;
      setFade(Math.max(revealFade, endFade));
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
      // Leaving interior: fade through black, then resume exterior orbit.
      const exiting =
        anim.current?.key === `enter-interior-${view.id}` ||
        anim.current?.key === `exit-interior-${view.id}`;
      if (exiting) {
        if (anim.current!.key !== `exit-interior-${view.id}`) {
          anim.current = {
            key: `exit-interior-${view.id}`,
            t0: now,
            fromPos: camera.position.clone(),
            fromFocus: focus.current.clone(),
            fromFov: pCam.fov,
            held: false,
          };
          setFade(1);
        }
        const a = anim.current!;
        const t = Math.min(1, (now - a.t0) / EXIT_INTERIOR_DUR);
        const e = easeInOut(t);
        const spec: OrbitSpec = ORBITS[view.id] ?? DEFAULT_ORBIT;
        if (baseT0.current === null) baseT0.current = now;
        const orbitT = now - baseT0.current + phaseOffset.current;
        const pose = orbitPose(spec, orbitT);
        // Hold black while exterior remounts mid-transition.
        if (t < 0.4) {
          setFade(1);
        } else {
          camera.position.lerpVectors(a.fromPos, pose.pos, (e - 0.4) / 0.6);
          focus.current.set(0, pose.focusY, 0);
          camera.lookAt(focus.current);
          applyFov(pCam, THREE.MathUtils.lerp(a.fromFov, MAP_FOV, (t - 0.4) / 0.6));
          setFade(1 - (t - 0.4) / 0.6);
        }
        if (t >= 1 && !a.fired) {
          a.fired = true;
          anim.current = null;
          baseT0.current = now;
          onInteriorSettled?.("base");
          onExploreReady?.(true);
        }
        return;
      }

      approachT0.current = null;
      interiorT0.current = null;
      const spec: OrbitSpec = ORBITS[view.id] ?? DEFAULT_ORBIT;
      // Initial settle after dive / exit: place camera once, then hand off to OrbitControls.
      if (baseT0.current === null) {
        baseT0.current = now;
        onExploreReady?.(false);
        const pose = orbitPose(spec, phaseOffset.current);
        camera.position.copy(pose.pos);
        camera.lookAt(0, pose.focusY, 0);
        focus.current.set(0, pose.focusY, 0);
        if (pCam.fov !== MAP_FOV) applyFov(pCam, MAP_FOV);
      }
      const sinceBase = now - baseT0.current;
      if (sinceBase < 1) {
        setFade(1 - sinceBase / 0.9);
        // Gentle auto-orbit only during the fade-in settle
        if (sinceBase < 0.85 && anim.current?.key !== `exit-interior-${view.id}`) {
          const pose = orbitPose(spec, sinceBase + phaseOffset.current);
          camera.position.copy(pose.pos);
          camera.lookAt(0, pose.focusY, 0);
        }
      } else {
        setFade(0);
        if (!anim.current?.fired) {
          if (!anim.current) {
            anim.current = {
              key: `base-ready-${view.id}`,
              t0: now,
              fromPos: camera.position.clone(),
              fromFocus: focus.current.clone(),
              fromFov: pCam.fov,
              held: false,
              fired: true,
            };
          } else {
            anim.current.fired = true;
          }
          onExploreReady?.(true);
        }
      }
      return;
    }

    if (view.mode === "approach") {
      const spec: ApproachSpec = APPROACHES[view.id] ?? DEFAULT_APPROACH;
      const key = `approach-${view.id}`;
      if (anim.current?.key !== key) {
        onExploreReady?.(false);
        if (baseT0.current !== null) {
          phaseOffset.current = now - baseT0.current + phaseOffset.current;
        }
        baseT0.current = null;
        anim.current = {
          key,
          t0: now,
          fromPos: camera.position.clone(),
          fromFocus: focus.current.clone().lengthSq() > 0
            ? focus.current.clone()
            : new THREE.Vector3(0, (ORBITS[view.id] ?? DEFAULT_ORBIT).focusHeight, 0),
          fromFov: pCam.fov,
          held: false,
        };
        approachT0.current = now;
      }
      const a = anim.current;
      const targetPose = orbitPose(spec, phaseOffset.current);
      const t = Math.min(1, (now - a.t0) / APPROACH_DUR);
      const e = easeInOut(t);
      if (t < 1) {
        camera.position.lerpVectors(a.fromPos, targetPose.pos, e);
        focus.current.lerpVectors(a.fromFocus, new THREE.Vector3(0, targetPose.focusY, 0), e);
        camera.lookAt(focus.current);
        onExploreReady?.(false);
      } else {
        camera.position.copy(targetPose.pos);
        camera.lookAt(0, targetPose.focusY, 0);
        focus.current.set(0, targetPose.focusY, 0);
        if (!a.fired) {
          a.fired = true;
          onApproachSettled?.();
          onExploreReady?.(true);
        }
      }
      setFade(0);
      return;
    }

    if (view.mode === "interior") {
      const ispec: InteriorSpec = INTERIORS[view.id] ?? DEFAULT_INTERIOR;
      const key = `enter-interior-${view.id}`;
      if (anim.current?.key !== key) {
        onExploreReady?.(false);
        anim.current = {
          key,
          t0: now,
          fromPos: camera.position.clone(),
          fromFocus: new THREE.Vector3(0, (APPROACHES[view.id] ?? DEFAULT_APPROACH).focusHeight, 0),
          fromFov: pCam.fov,
          held: false,
        };
        interiorT0.current = now;
        setFade(1);
      }
      const a = anim.current;
      const target = interiorPose(ispec, 0);
      const t = Math.min(1, (now - a.t0) / ENTER_DUR);
      const e = easeInOut(t);
      if (t < 1) {
        camera.position.lerpVectors(a.fromPos, target.pos, e);
        focus.current.lerpVectors(a.fromFocus, target.focus, e);
        camera.lookAt(focus.current);
        applyFov(pCam, THREE.MathUtils.lerp(a.fromFov, ispec.fov, e));
        if (t < 0.45) setFade(1);
        else setFade(1 - (t - 0.45) / 0.55);
      } else {
        camera.position.copy(target.pos);
        camera.lookAt(target.focus);
        focus.current.copy(target.focus);
        applyFov(pCam, ispec.fov);
        setFade(0);
        if (!a.fired) {
          a.fired = true;
          onInteriorSettled?.("interior");
          onExploreReady?.(true);
        }
      }
      return;
    }

    if (view.mode === "rise") {
      onExploreReady?.(false);
      const key = `rise-${view.id}`;
      if (anim.current?.key !== key) {
        baseT0.current = null;
        approachT0.current = null;
        interiorT0.current = null;
        anim.current = {
          key,
          t0: now,
          fromPos: divePoint(view.id),
          fromFocus: stationWorld(view.id),
          fromFov: MAP_FOV,
          held: false,
        };
        setFade(1);
      }
      const a = anim.current;
      const t = Math.min(1, (now - a.t0) / RISE_DUR);
      const e = easeInOut(t);
      camera.position.lerpVectors(a.fromPos, MAP_CAM, e);
      focus.current.lerpVectors(a.fromFocus, new THREE.Vector3(0, 0, 0), Math.min(1, e * 1.4));
      camera.lookAt(focus.current);
      if (pCam.fov !== MAP_FOV) applyFov(pCam, MAP_FOV);
      setFade(1 - t / 0.3);
      if (t >= 1 && !a.fired) {
        a.fired = true;
        camera.position.copy(MAP_CAM);
        camera.lookAt(0, 0, 0);
        onReturned();
      }
      return;
    }
  });

  return null;
}
