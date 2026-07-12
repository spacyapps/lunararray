"use client";

// LA-00 Sinus Medii — Primary spaceport & deep-space communications relay.
// The flagship beauty shot: a leaning teardrop control spire rising out of a
// warm glass terminal lens, a heavy deep-space dish standing apart, and an
// asymmetric arc of landing pads fed by swept boarding tubes. One shuttle
// parked, one pad live.
//
// Buried lore: a service hatch south-west of the terminal opens a keypad;
// the access code is today's date as MMDD (e.g. 0711 for July 11), checked
// against the visitor's local clock at submit time — and the UI gives no
// hint, deliberately. Visitors have to guess. A correct code projects a
// holographic map of the subsurface: a hub under the terminal, facility
// chambers, two large cylinder buildings, and three corridors that run past
// the hologram's edge and cut off, gated behind "Level 5 access".

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
import BaseEnvironment from "./BaseEnvironment";
import { Beacon, ChromeCrown, Dish, LensDome, Pad, SweepTube, Teardrop, WindowBand, teardropRadiusAt } from "./parts";

const ACCENT = "#5cd6ff";
const HULL = "#eef2f7";
const WARM = "#ffd9a0";
const UNRESOLVED = "#ff8a5c";

function Shuttle(props: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group {...props}>
      {/* lying teardrop fuselage */}
      <group rotation={[0, 0, -Math.PI / 2]} position={[-2.6, 0.9, 0]}>
        <Teardrop height={5.2} radius={0.9} color={HULL} />
      </group>
      {/* canted tail fins */}
      <mesh position={[-2.2, 1.4, 0.5]} rotation={[0.5, 0, -0.4]} scale={[0.1, 1.4, 0.5]}>
        <boxGeometry />
        <meshToonMaterial color={ACCENT} />
      </mesh>
      <mesh position={[-2.2, 1.4, -0.5]} rotation={[-0.5, 0, -0.4]} scale={[0.1, 1.4, 0.5]}>
        <boxGeometry />
        <meshToonMaterial color={ACCENT} />
      </mesh>
      <Beacon color={ACCENT} size={0.12} speed={3} position={[2.4, 0.95, 0]} />
    </group>
  );
}

// ————————————————————————————————————————————————————————————————
// Subsurface access

type HatchMode = "locked" | "keypad" | "open";

/** Today's date as MMDD, on the visitor's local clock. */
function expectedCode(): string {
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
}

const mono: React.CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

function AccessHatch({ mode, onTap }: { mode: HatchMode; onTap: () => void }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  // if the scene unmounts mid-hover (Esc back to map), don't strand the cursor
  useEffect(
    () => () => {
      document.body.style.removeProperty("cursor");
    },
    [],
  );
  const glow = mode === "locked" ? ACCENT : WARM;
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* apron ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.75, 2.0, 40]} />
        <meshBasicMaterial color={glow} transparent opacity={0.28} />
      </mesh>
      {/* collar + hood — small, severe, deliberately un-teardrop */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.5, 1.65, 0.5, 20]} />
        <meshToonMaterial color="#9aa0b4" />
      </mesh>
      <mesh position={[0, 1.05, 0]} scale={[1.7, 1.2, 1.5]}>
        <boxGeometry />
        <meshToonMaterial color="#3c4050" />
      </mesh>
      <mesh position={[0, 1.72, 0]} scale={[1.9, 0.16, 1.7]}>
        <boxGeometry />
        <meshToonMaterial color="#9aa0b4" />
      </mesh>
      {/* blast door + keypad glow */}
      <mesh position={[0.3, 0.98, 0.76]} scale={[0.8, 0.9, 0.06]}>
        <boxGeometry />
        <meshToonMaterial color="#14171f" />
      </mesh>
      <mesh position={[-0.5, 1.15, 0.78]} scale={[0.2, 0.28, 0.03]}>
        <boxGeometry />
        <meshBasicMaterial color={glow} />
      </mesh>
      <Beacon color={glow} size={0.09} speed={2.6} position={[0, 1.95, 0]} />
      {hovered && mode === "locked" && (
        <Html position={[0, 2.7, 0]} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              ...mono,
              fontSize: 9.5,
              letterSpacing: "0.28em",
              color: "rgba(238, 242, 247, 0.75)",
              whiteSpace: "nowrap",
              background: "rgba(5, 6, 10, 0.6)",
              border: "1px solid rgba(92, 214, 255, 0.25)",
              padding: "4px 8px",
            }}
          >
            Service access
          </div>
        </Html>
      )}
    </group>
  );
}

function Keypad({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [digits, setDigits] = useState("");
  const [status, setStatus] = useState<"idle" | "denied" | "granted">("idle");
  // buf is the source of truth — taps faster than a re-render would read a
  // stale `digits` from the click handler's closure and overwrite each other
  const buf = useRef("");
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const setBuf = (v: string) => {
    buf.current = v;
    setDigits(v);
  };

  const handle = (k: string) => {
    if (busy.current) return;
    if (k === "C") return setBuf("");
    if (k === "⌫") return setBuf(buf.current.slice(0, -1));
    if (buf.current.length >= 4) return;
    const next = buf.current + k;
    setBuf(next);
    if (next.length < 4) return;
    busy.current = true;
    if (next === expectedCode()) {
      setStatus("granted");
      timers.current.push(setTimeout(onUnlock, 600));
    } else {
      setStatus("denied");
      timers.current.push(
        setTimeout(() => {
          setBuf("");
          setStatus("idle");
          busy.current = false;
        }, 750),
      );
    }
  };

  const edge =
    status === "denied"
      ? "rgba(255, 92, 92, 0.6)"
      : status === "granted"
        ? "rgba(124, 255, 196, 0.6)"
        : "rgba(92, 214, 255, 0.35)";

  return (
    <Html position={[0, 3.5, 0]} center>
      <div
        style={{
          width: 172,
          background: "rgba(5, 6, 10, 0.92)",
          border: `1px solid ${edge}`,
          padding: 12,
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.24em", color: ACCENT }}>
            Service access
          </span>
          <button
            data-key="close"
            onClick={onClose}
            style={{
              ...mono,
              background: "none",
              border: "none",
              color: "rgba(238, 242, 247, 0.6)",
              cursor: "pointer",
              fontSize: 13,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "11px 0 7px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                ...mono,
                width: 26,
                height: 32,
                lineHeight: "32px",
                textAlign: "center",
                fontSize: 15,
                border: "1px solid rgba(92, 214, 255, 0.3)",
                background: "rgba(92, 214, 255, 0.05)",
                color: digits[i] ? "#eef2f7" : "rgba(238, 242, 247, 0.22)",
              }}
            >
              {digits[i] ?? "·"}
            </div>
          ))}
        </div>
        <div
          style={{
            ...mono,
            fontSize: 8.5,
            letterSpacing: "0.24em",
            height: 14,
            textAlign: "center",
            color:
              status === "denied"
                ? "#ff5c5c"
                : status === "granted"
                  ? "#7cffc4"
                  : "rgba(238, 242, 247, 0.35)",
          }}
        >
          {status === "denied" ? "Access denied" : status === "granted" ? "Access granted" : "Enter code"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 8 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((k) => (
            <button
              key={k}
              data-key={k === "C" ? "clear" : k === "⌫" ? "back" : k}
              onClick={() => handle(k)}
              style={{
                ...mono,
                fontSize: 12,
                color: "#eef2f7",
                background: "rgba(92, 214, 255, 0.07)",
                border: "1px solid rgba(92, 214, 255, 0.22)",
                padding: "7px 0",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </Html>
  );
}

/** Thin additive tube for hologram lines. */
function HoloTube({
  pts,
  r = 0.09,
  color = ACCENT,
  opacity = 0.7,
}: {
  pts: [number, number, number][];
  r?: number;
  color?: string;
  opacity?: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))),
        16,
        r,
        8,
        false,
      ),
    [pts, r],
  );
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Chamber({
  position,
  size = 0.55,
  color = ACCENT,
  box = false,
}: {
  position: [number, number, number];
  size?: number;
  color?: string;
  box?: boolean;
}) {
  const geo = box ? (
    <boxGeometry args={[size * 1.6, size * 1.1, size * 1.6]} />
  ) : (
    <octahedronGeometry args={[size, 0]} />
  );
  return (
    <group position={position}>
      <mesh>
        {geo}
        <meshBasicMaterial color={color} wireframe transparent opacity={0.85} />
      </mesh>
      <mesh scale={0.55}>
        {geo}
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Large cylindrical underground building, lying on its side — a pressure
 *  vessel oriented to shed load from above rather than stand under it,
 *  unlike a vertical shaft. `rotationY` points its long axis at any compass
 *  heading (applied after laying it down, so it actually steers the axis
 *  instead of spinning an already-symmetric vertical cylinder in place). */
function Silo({
  position,
  r = 0.9,
  h = 1.8,
  color = ACCENT,
  rotationY = 0,
}: {
  position: [number, number, number];
  r?: number;
  h?: number;
  color?: string;
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[r, r, h, 20, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[r, r, h, 12, 1, true]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {[h / 2, -h / 2].map((y, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
            <torusGeometry args={[r, 0.035, 6, 40]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Small vertical shaft, capped with a nose cone — an emergency launch tube,
 *  shallow (unlike the deep horizontal silos) but still fully underground,
 *  close enough to the surface disc to read as ready to breach it without
 *  actually poking through. `position` is the nose tip — the shallowest
 *  point — so it should sit at a small negative y (just under the surface
 *  plane at y=0), with the shaft hanging further down from there. */
function LaunchTube({
  position,
  r = 0.11,
  h = 0.45,
  color = ACCENT,
}: {
  position: [number, number, number];
  r?: number;
  h?: number;
  color?: string;
}) {
  const coneH = r * 1.6;
  return (
    <group position={position}>
      <mesh position={[0, -coneH / 2, 0]}>
        <coneGeometry args={[r * 1.15, coneH, 10]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* shaft, hanging further down below the cone */}
      <mesh position={[0, -coneH - h / 2, 0]}>
        <cylinderGeometry args={[r, r, h, 10, 1, true]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.55} />
      </mesh>
      {/* collar ring at the cone/shaft junction */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -coneH, 0]}>
        <torusGeometry args={[r * 1.3, 0.02, 6, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Hologram-local layout. The disc (r=7) is a plan view of the surface at
// ~0.18 scale, centered on the hatch; tunnels hang beneath it like roots.
const H_HUB: [number, number, number] = [1.8, -2.2, -1.44];
const H_VAULT: [number, number, number] = [-2.5, -2.7, -0.5];
const H_ARCHIVE: [number, number, number] = [0.5, -1.9, 2.8];
const H_COMMS: [number, number, number] = [-1.62, -1.5, -2.88];
// large cylinder buildings — whole underground structures, not just rooms
const H_SILO_A: [number, number, number] = [4.6, -2.4, 2.2];
const H_SILO_B: [number, number, number] = [-4.6, -3.0, 0.6];
// deeper hidden rooms off the main runs
const H_ROOM_NE: [number, number, number] = [3.2, -1.7, -3.4];
const H_ROOM_S: [number, number, number] = [-1.4, -3.3, 3.6];
const H_ROOM_DEEP: [number, number, number] = [1.2, -3.6, -0.6];
// emergency launch tubes — nose tips just under the surface plane (y=0),
// well above everything else which sits below -1.4, standalone, no tunnel
// wired to them
const LAUNCH_TUBES: [number, number, number][] = [
  [3.0, -0.12, -4.6],
  [-3.6, -0.09, 3.3],
  [5.3, -0.15, -0.8],
  [-1.0, -0.07, 5.4],
];

const MAIN_TUNNELS: [number, number, number][][] = [
  [H_HUB, [-0.4, -2.5, -1.0], H_VAULT],
  [H_HUB, [1.2, -2.1, 0.8], H_ARCHIVE],
  [H_HUB, [0.2, -1.9, -2.3], H_COMMS],
  [H_HUB, [3.3, -2.4, 0.3], H_SILO_A],
  [H_VAULT, [-3.6, -2.9, 0.1], H_SILO_B],
  [H_HUB, [2.6, -1.9, -2.5], H_ROOM_NE],
  [H_ARCHIVE, [-0.4, -2.7, 3.3], H_ROOM_S],
  [H_HUB, [1.5, -3.0, -1.1], H_ROOM_DEEP],
];

// Surface ghosts drawn flat on the disc for orientation: terminal lens +
// spire (same world spot), the three landing pads, the deep-space dish.
const GHOSTS: { x: number; z: number; r: number; ring?: boolean }[] = [
  { x: 1.8, z: -1.44, r: 0.95, ring: true },
  { x: 1.8, z: -1.44, r: 0.2 },
  { x: 4.68, z: -0.72, r: 0.3 },
  { x: 4.14, z: 1.26, r: 0.24 },
  { x: 5.4, z: -2.7, r: 0.24 },
  { x: -1.62, z: -2.88, r: 0.28, ring: true },
];

// Corridors that leave the projection — fading dashes, cut at the hologram's
// edge, each sloping deeper as it goes. The map doesn't know where they end.
const SECRET_RUNS: {
  dashes: { pts: [number, number, number][]; opacity: number }[];
  end: [number, number, number];
  labelled?: boolean;
}[] = [
  {
    dashes: [
      { pts: [H_VAULT, [-4.2, -2.9, -1.05]], opacity: 0.6 },
      { pts: [[-4.7, -2.95, -1.2], [-6.0, -3.1, -1.65]], opacity: 0.3 },
      { pts: [[-6.4, -3.15, -1.8], [-7.4, -3.3, -2.1]], opacity: 0.14 },
    ],
    end: [-7.6, -3.35, -2.2],
  },
  {
    dashes: [
      { pts: [H_HUB, [3.8, -2.7, -0.4]], opacity: 0.6 },
      { pts: [[4.4, -2.85, -0.1], [5.8, -3.2, 0.7]], opacity: 0.3 },
      { pts: [[6.2, -3.3, 0.9], [7.3, -3.55, 1.5]], opacity: 0.14 },
    ],
    end: [7.5, -3.6, 1.6],
    labelled: true,
  },
  {
    dashes: [
      { pts: [H_ARCHIVE, [1.1, -2.3, 4.4]], opacity: 0.6 },
      { pts: [[1.3, -2.45, 4.9], [1.8, -2.8, 6.2]], opacity: 0.3 },
      { pts: [[1.95, -2.9, 6.6], [2.25, -3.15, 7.4]], opacity: 0.14 },
    ],
    end: [2.3, -3.2, 7.6],
  },
];

function TunnelHologram() {
  const holo = useRef<THREE.Group>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // slow holo-table rotation + projector flicker
    if (holo.current) holo.current.rotation.y = t * 0.06;
    const f = 0.8 + 0.14 * Math.sin(t * 9) + 0.06 * Math.sin(t * 23);
    if (beamMat.current) beamMat.current.opacity = 0.055 * f;
    if (edgeMat.current) edgeMat.current.opacity = 0.5 * f;
  });
  return (
    <group>
      {/* projection beam rising out of the hatch */}
      <mesh position={[0, 4.7, 0]}>
        <cylinderGeometry args={[7, 0.5, 8.6, 40, 1, true]} />
        <meshBasicMaterial
          ref={beamMat}
          color={ACCENT}
          transparent
          opacity={0.055}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 9, 0]} intensity={26} color={ACCENT} distance={22} />

      <group position={[0, 9, 0]}>
        <group ref={holo}>
          {/* projection disc + edge */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[7, 64]} />
            <meshBasicMaterial
              color={ACCENT}
              transparent
              opacity={0.05}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[7, 0.05, 8, 96]} />
            <meshBasicMaterial
              ref={edgeMat}
              color={ACCENT}
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* depth strata rings */}
          {[
            { r: 6.2, y: -1.6, o: 0.12 },
            { r: 5.4, y: -3, o: 0.08 },
          ].map((s, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, s.y, 0]}>
              <torusGeometry args={[s.r, 0.03, 6, 72]} />
              <meshBasicMaterial
                color={ACCENT}
                transparent
                opacity={s.o}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
          {/* surface ghosts on the disc */}
          {GHOSTS.map((g, i) =>
            g.ring ? (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[g.x, 0.04, g.z]}>
                <torusGeometry args={[g.r, 0.03, 6, 48]} />
                <meshBasicMaterial
                  color={ACCENT}
                  transparent
                  opacity={0.5}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ) : (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[g.x, 0.04, g.z]}>
                <circleGeometry args={[g.r, 24]} />
                <meshBasicMaterial
                  color={ACCENT}
                  transparent
                  opacity={0.45}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ),
          )}
          {/* main shaft under the terminal, down to the hub */}
          <HoloTube pts={[[1.8, 0, -1.44], H_HUB]} r={0.12} opacity={0.85} />
          <Chamber position={H_HUB} size={0.6} />
          <Chamber position={H_VAULT} size={0.5} color={WARM} box />
          <Chamber position={H_ARCHIVE} size={0.45} />
          <Chamber position={H_COMMS} size={0.4} box />
          {/* underground buildings — lying on their side, shedding load from
              above rather than standing under it */}
          <Silo position={H_SILO_A} r={0.85} h={1.7} rotationY={-0.97} />
          <Silo position={H_SILO_B} r={1.05} h={2.0} color={WARM} rotationY={-2.68} />
          {/* hidden rooms, deeper */}
          <Chamber position={H_ROOM_NE} size={0.3} />
          <Chamber position={H_ROOM_S} size={0.32} box />
          <Chamber position={H_ROOM_DEEP} size={0.34} color={WARM} />
          {/* emergency launch tubes — shallow, vertical, unconnected */}
          {LAUNCH_TUBES.map((pos, i) => (
            <LaunchTube key={i} position={pos} />
          ))}
          {MAIN_TUNNELS.map((pts, i) => (
            <HoloTube key={i} pts={pts} />
          ))}
          {/* the unresolved corridors */}
          {SECRET_RUNS.map((run, i) => (
            <group key={i}>
              {run.dashes.map((d, j) => (
                <HoloTube key={j} pts={d.pts} r={0.07} opacity={d.opacity} />
              ))}
              <mesh position={run.end}>
                <octahedronGeometry args={[0.14, 0]} />
                <meshBasicMaterial color={UNRESOLVED} transparent opacity={0.95} />
              </mesh>
              {run.labelled && (
                <Html
                  position={[run.end[0], run.end[1] + 0.6, run.end[2]]}
                  center
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    style={{
                      ...mono,
                      fontSize: 8.5,
                      letterSpacing: "0.24em",
                      color: "rgba(255, 138, 92, 0.9)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Level 5 access
                  </div>
                </Html>
              )}
            </group>
          ))}
        </group>
        {/* title — outside the rotating group so it holds still */}
        <Html position={[0, 1.7, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.3em", color: ACCENT }}>
              LA-00 · Subsurface network
            </div>
            <div
              style={{
                ...mono,
                fontSize: 8.5,
                letterSpacing: "0.24em",
                color: "rgba(255, 138, 92, 0.85)",
                marginTop: 4,
              }}
            >
              3 corridors unresolved
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// Hatch sits in the open ground south-west of the terminal lens (r=9),
// inside the rock scatter's inner radius (14) so nothing spawns on top,
// clear of the boarding tubes and the relay pylons.
const HATCH_POS: [number, number, number] = [-10, 0, 8];

export default function LA00() {
  const [hatch, setHatch] = useState<HatchMode>("locked");
  return (
    <group>
      {/* dramatic key low from the west, cyan rim from behind */}
      <directionalLight position={[-40, 14, 22]} intensity={2.6} color="#ffe6c4" />
      <directionalLight position={[30, 10, -38]} intensity={1.6} color={ACCENT} />
      <pointLight position={[0, 6, 0]} intensity={60} color={WARM} distance={30} />

      <BaseEnvironment groundColor="#82869a" rockTint="#6e7284" seed={0} />

      {/* terminal lens — warm lit glass heart of the port */}
      <LensDome r={9} squash={0.38} color="#cfeaff" opacity={0.5} emissive={WARM} />
      <WindowBand radius={8.2} position={[0, 1.6, 0]} color={WARM} thickness={0.1} />

      {/* control spire — tall teardrop, leaning just off vertical */}
      <group rotation={[0, 0, -0.07]}>
        <Teardrop height={19} radius={3.4} color={HULL} imageMap="/textures/la00-spire-hull.jpg" />
        <WindowBand radius={teardropRadiusAt(19, 3.4, 6.2)} position={[0, 6.2, 0]} color={WARM} />
        <WindowBand radius={teardropRadiusAt(19, 3.4, 9.4)} position={[0, 9.4, 0]} color={WARM} />
        <WindowBand radius={teardropRadiusAt(19, 3.4, 12.4)} position={[0, 12.4, 0]} color={ACCENT} thickness={0.06} />
        <ChromeCrown radius={teardropRadiusAt(19, 3.4, 15.5) + 0.08} thickness={0.22} position={[0, 15.5, 0]} />
        <Beacon color={ACCENT} size={0.3} position={[-1.35, 19.2, 0]} />
      </group>

      {/* deep-space dish — stands apart, aimed at the stars */}
      <Dish r={5.2} mast={5} tilt={-0.7} accent={ACCENT} position={[-19, 0, -8]} rotation={[0, 0.9, 0]} />
      <Dish r={2.2} mast={2.6} tilt={-1} accent={ACCENT} position={[-13, 0, -15]} rotation={[0, 0.4, 0]} />

      {/* landing pads — asymmetric arc east of the terminal */}
      <Pad r={4.5} accent={ACCENT} position={[16, 0, 4]} />
      <Pad r={3.4} accent={ACCENT} position={[13, 0, 15]} />
      <Pad r={3.4} accent={ACCENT} position={[20, 0, -7]} />
      <Shuttle position={[16, 0.3, 4]} rotation={[0, 0.5, 0]} />

      {/* swept boarding tubes from the lens out to each pad */}
      <SweepTube pts={[[6, 1.5, 2], [11, 2.6, 3], [16, 1.2, 4]]} r={0.55} color={HULL} />
      <SweepTube pts={[[5, 1.5, 6], [9, 2.8, 11], [13, 1.2, 15]]} r={0.55} color={HULL} />
      <SweepTube pts={[[7, 1.5, -3], [14, 3, -5.5], [20, 1.2, -7]]} r={0.55} color={HULL} />
      {/* service line to the dish farm */}
      <SweepTube pts={[[-8, 1.2, -2], [-14, 2, -5], [-19, 0.8, -8]]} r={0.4} color={HULL} emissive={ACCENT} />

      {/* relay pylon trio — the "array" identity, echoing the map hotspots */}
      {([[-6, 14], [-2, 17], [3, 15.5]] as const).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.6, 0]}>
            <cylinderGeometry args={[0.1, 0.22, 5.2, 8]} />
            <meshToonMaterial color={HULL} />
          </mesh>
          <Beacon color={ACCENT} size={0.18} speed={2 + i * 0.7} position={[0, 5.5, 0]} />
        </group>
      ))}

      {/* subsurface access — the tunnels are down there whether or not
          anyone finds the hatch */}
      <group position={HATCH_POS}>
        <AccessHatch
          mode={hatch}
          onTap={() => setHatch((m) => (m === "locked" ? "keypad" : "locked"))}
        />
        {hatch === "keypad" && (
          <Keypad onClose={() => setHatch("locked")} onUnlock={() => setHatch("open")} />
        )}
        {hatch === "open" && <TunnelHologram />}
      </group>
    </group>
  );
}
