"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { INSTALLATIONS } from "@/lib/installations";
import {
  AZIMUTHS,
  bearingPoint,
  C,
  CRATERS,
  gcArc,
  MARIA,
  OCTO_RADIUS_DEG,
  project,
  ptsToPath,
  smallCraters,
  sphereRing,
  tychoRays,
} from "@/lib/octogram-geometry";

// Animated signal pulse traveling along a great-circle arc (inset mode).
function SignalPulse({
  fromLat,
  fromLon,
  toLat,
  toLon,
  delay,
  dur,
}: {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  delay: number;
  dur: number;
}) {
  const path = useMemo(
    () => ptsToPath(gcArc(fromLat, fromLon, toLat, toLon, 18)),
    [fromLat, fromLon, toLat, toLon],
  );
  return (
    <circle r="0.012" fill="#a8eaff" style={{ pointerEvents: "none" }}>
      <animateMotion
        dur={dur + "s"}
        begin={delay + "s"}
        repeatCount="indefinite"
        path={path}
        rotate="auto"
      />
      <animate
        attributeName="opacity"
        values="0;0;1;1;0"
        keyTimes="0;0.1;0.3;0.85;1"
        dur={dur + "s"}
        begin={delay + "s"}
        repeatCount="indefinite"
      />
    </circle>
  );
}

interface GlobeOctogramProps {
  size?: number;
  mode?: "globe" | "inset";
}

export default function GlobeOctogram({
  size = 720,
  mode = "globe",
}: GlobeOctogramProps) {
  const [active, setActive] = useState<string | null>(null);
  const [auto, setAuto] = useState<string | null>(null);

  // Unique clip-path id per instance — stable across SSR/CSR (useId), with the
  // ":" separators stripped so it's safe inside url(#…) references.
  const clipId = `clip-${useId().replace(/:/g, "")}`;

  const isInset = mode === "inset";
  const isGlobe = mode === "globe";

  useEffect(() => {
    if (active !== null || !isInset) return;
    const ids = INSTALLATIONS.slice(1).map((i) => i.id);
    let n = 0;
    const t = setInterval(() => {
      setAuto(ids[n % ids.length]);
      n++;
    }, 1800);
    return () => clearInterval(t);
  }, [active, isInset]);
  const highlight = active || auto;

  const nodes = INSTALLATIONS.slice(1).map((inst, i) => {
    const { lat, lon } = bearingPoint(OCTO_RADIUS_DEG, AZIMUTHS[i]);
    const p = project(lat, lon);
    return { ...inst, lat, lon, sx: p.x, sy: p.y, z: p.z };
  });

  const sq1 = [0, 2, 4, 6, 0];
  const sq2 = [1, 3, 5, 7, 1];
  const buildSquare = (idxs: number[]) => {
    let path = "";
    for (let i = 0; i < idxs.length - 1; i++) {
      const a = nodes[idxs[i]];
      const b = nodes[idxs[i + 1]];
      const pts = gcArc(a.lat, a.lon, b.lat, b.lon, 14);
      path += ptsToPath(pts) + " ";
    }
    return path.trim();
  };
  const square1Path = buildSquare(sq1);
  const square2Path = buildSquare(sq2);
  const spokePaths = nodes.map((n) => ptsToPath(gcArc(0, 0, n.lat, n.lon, 12)));

  const VB = isInset ? 0.11 : 1.05;
  const pct = (v: number) => 50 + 50 * (v / VB);
  // Format a trig-derived number to a fixed precision so SSR (Node) and the
  // browser emit byte-identical attribute strings — the values are the same,
  // only their last-ULP float-to-string form differs between JS engines.
  const fx = (v: number) => v.toFixed(5);
  const innerR1 = OCTO_RADIUS_DEG * 0.5;
  const innerR2 = OCTO_RADIUS_DEG * 0.22;

  const tychoRaysMemo = useMemo(() => tychoRays(), []);
  const smallCratersMemo = useMemo(() => smallCraters(), []);

  return (
    <div
      className={`la-globe-octogram ${isInset ? "la-globe-inset" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`-${VB} -${VB} ${2 * VB} ${2 * VB}`}
        style={{ width: "100%", height: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="0" cy="0" r="1" />
          </clipPath>
        </defs>

        {/* Moon disc — solid lit color */}
        <circle cx="0" cy="0" r="1" fill={isInset ? C.inset : C.moonLit} />

        {/* Shadow side — darker right/bottom half via overlapping offset circle */}
        {isGlobe && (
          <circle
            cx="0.20"
            cy="0.18"
            r="1"
            fill={C.moonDark}
            opacity="0.42"
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* Mid-tone wash */}
        {isGlobe && (
          <circle
            cx="0.05"
            cy="0.05"
            r="1"
            fill={C.moonMid}
            opacity="0.20"
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* Everything painted on the surface — clipped to disc */}
        <g clipPath={`url(#${clipId})`}>
          {/* Tycho ray system — globe only */}
          {isGlobe &&
            tychoRaysMemo.map((ray, i) => {
              const pts = gcArc(-43, -11, ray.end.lat, ray.end.lon, 18);
              return (
                <path
                  key={"tr" + i}
                  d={ptsToPath(pts)}
                  fill="none"
                  stroke={C.rim}
                  strokeOpacity={ray.op}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

          {/* Maria — solid dark patches */}
          {isGlobe &&
            MARIA.map((m, i) => {
              const p = project(m.lat, m.lon);
              if (!p.visible) return null;
              const fore = Math.max(0.15, p.z);
              const rx = m.rx * Math.sqrt(fore);
              const ry = m.ry * Math.sqrt(fore);
              const angle = (Math.atan2(p.y, p.x) * 180) / Math.PI + 90;
              return (
                <g key={"m" + i}>
                  {/* Outer halo (lighter mare edge) */}
                  <ellipse
                    cx={fx(p.x)}
                    cy={fx(p.y)}
                    rx={fx(rx * 1.05)}
                    ry={fx(ry * 1.05)}
                    fill={C.mare}
                    opacity="0.55"
                    transform={`rotate(${fx(angle)} ${fx(p.x)} ${fx(p.y)})`}
                  />
                  {/* Dark core */}
                  <ellipse
                    cx={fx(p.x)}
                    cy={fx(p.y)}
                    rx={fx(rx * 0.82)}
                    ry={fx(ry * 0.82)}
                    fill={C.mareDark}
                    opacity="0.85"
                    transform={`rotate(${fx(angle)} ${fx(p.x)} ${fx(p.y)})`}
                  />
                </g>
              );
            })}

          {/* Tiny crater pock-marks */}
          {isGlobe &&
            smallCratersMemo.map((c, i) => {
              const p = project(c.lat, c.lon);
              if (!p.visible) return null;
              const fore = Math.max(0.1, p.z);
              const r = c.r * Math.sqrt(fore);
              return (
                <circle
                  key={"sc" + i}
                  cx={fx(p.x)}
                  cy={fx(p.y)}
                  r={fx(r)}
                  fill={C.craterFloor}
                  stroke={C.rim}
                  strokeOpacity="0.18"
                  strokeWidth="0.4"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

          {/* Named craters */}
          {isGlobe &&
            CRATERS.map((c, i) => {
              const p = project(c.lat, c.lon);
              if (!p.visible) return null;
              const fore = Math.max(0.15, p.z);
              const r = c.r * Math.sqrt(fore);
              let bgFill: string;
              let rimColor: string;
              let rimOp: number;
              if (c.kind === "very-bright") {
                bgFill = C.aristarchus;
                rimColor = C.rim;
                rimOp = 0.5;
              } else if (c.kind === "bright") {
                bgFill = C.craterBright;
                rimColor = C.rim;
                rimOp = 0.4;
              } else if (c.kind === "dark") {
                bgFill = C.craterFloor;
                rimColor = C.rim;
                rimOp = 0.25;
              } else {
                bgFill = C.craterFloor;
                rimColor = C.rim;
                rimOp = 0.3;
              }
              return (
                <g key={"nc" + i}>
                  {/* Halo */}
                  <circle
                    cx={fx(p.x)}
                    cy={fx(p.y)}
                    r={fx(r * 1.4)}
                    fill={bgFill}
                    opacity={
                      c.kind === "bright" || c.kind === "very-bright"
                        ? 0.35
                        : 0.55
                    }
                  />
                  {/* Floor */}
                  <circle
                    cx={fx(p.x)}
                    cy={fx(p.y)}
                    r={fx(r)}
                    fill={
                      c.kind === "dark"
                        ? C.craterFloor
                        : c.kind === "very-bright"
                          ? C.aristarchus
                          : c.kind === "bright"
                            ? C.craterBright
                            : C.craterFloor
                    }
                    opacity="0.75"
                  />
                  {/* Rim */}
                  <circle
                    cx={fx(p.x)}
                    cy={fx(p.y)}
                    r={fx(r)}
                    fill="none"
                    stroke={rimColor}
                    strokeOpacity={rimOp}
                    strokeWidth="0.7"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}

          {/* Limb darkening — overlay a darker ring at the edge */}
          {isGlobe && (
            <>
              <circle
                cx="0"
                cy="0"
                r="1"
                fill="none"
                stroke="#0a0c13"
                strokeWidth="0.04"
                strokeOpacity="0.55"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="0"
                cy="0"
                r="0.98"
                fill="none"
                stroke="#0a0c13"
                strokeWidth="0.06"
                strokeOpacity="0.32"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}

          {/* Inset speckle — tiny dots over Sinus Medii */}
          {isInset &&
            Array.from({ length: 22 }).map((_, i) => {
              const a = ((i * 137.5) * Math.PI) / 180;
              const r = 0.012 + (i % 5) * 0.012;
              // Round to a fixed precision so the server and client produce
              // byte-identical strings (avoids a float-formatting hydration
              // mismatch between the Node and browser JS engines).
              const cx = (Math.cos(a) * r).toFixed(5);
              const cy = (Math.sin(a) * r * 0.9).toFixed(5);
              return (
                <circle
                  key={"sp" + i}
                  cx={cx}
                  cy={cy}
                  r="0.0018"
                  fill={C.craterFloor}
                  stroke={C.rim}
                  strokeOpacity="0.18"
                  strokeWidth="0.3"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

          {/* Array detail — inset only */}
          {isInset && (
            <>
              {/* Faint hub disc */}
              <circle
                cx="0"
                cy="0"
                r={OCTO_RADIUS_DEG * 0.018}
                fill={C.accent}
                opacity="0.18"
              />

              <path
                d={ptsToPath(sphereRing(0, 0, innerR1, 96))}
                fill="none"
                stroke={C.accent}
                strokeOpacity="0.32"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={ptsToPath(sphereRing(0, 0, innerR2, 96))}
                fill="none"
                stroke={C.accent}
                strokeOpacity="0.45"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />

              <path
                d={square1Path}
                fill="none"
                stroke={C.accent}
                strokeOpacity="0.7"
                strokeWidth="1.4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={square2Path}
                fill="none"
                stroke={C.accent}
                strokeOpacity="0.7"
                strokeWidth="1.4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {spokePaths.map((d, i) => (
                <path
                  key={"sp2" + i}
                  d={d}
                  fill="none"
                  stroke={C.accent}
                  strokeOpacity={
                    highlight === INSTALLATIONS[i + 1].id ? 0.95 : 0.3
                  }
                  strokeWidth={highlight === INSTALLATIONS[i + 1].id ? 1.5 : 0.8}
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <path
                d={ptsToPath(sphereRing(0, 0, OCTO_RADIUS_DEG, 96))}
                fill="none"
                stroke={C.accent}
                strokeOpacity="0.20"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />

              {nodes.map((n, i) => (
                <SignalPulse
                  key={"pulse" + i}
                  fromLat={0}
                  fromLon={0}
                  toLat={n.lat}
                  toLon={n.lon}
                  delay={i * 0.28}
                  dur={2.4 + i * 0.12}
                />
              ))}
            </>
          )}
        </g>

        {/* Limb edge ring — outside the clip so it sharpens the silhouette */}
        <circle
          cx="0"
          cy="0"
          r="1"
          fill="none"
          stroke={isInset ? C.accent : "#2a2d36"}
          strokeOpacity={isInset ? 0.18 : 0.9}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Real Moon photo (NASA art002e009212) replacing the SVG surface.
          Plain masked <img> so it renders in screenshots and share links.
          The animated array overlay layers on top. */}
      {isGlobe && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="la-moon-photo"
          src="/moon-nasa.jpg"
          alt="The Moon, near side — NASA"
          draggable="false"
        />
      )}

      {/* Globe-mode: the animated octogram array, projected onto the lunar
          surface at the sub-Earth point. Rendered as a DOM overlay with its own
          normal-scale SVG (viewBox 0 0 100 100) — NOT inside the heavily-scaled
          globe SVG, where tiny coords + non-scaling-stroke + SMIL rasterized
          into a solid cyan square. */}
      {isGlobe && <MoonArray />}

      {/* DOM markers — inset only (nodes too small to label at globe scale) */}
      {isInset && (
        <div className="markers">
          <div
            className={`la-node prime ${highlight === "LA-00" ? "active" : ""}`}
            data-dir="C"
            style={{ left: `${pct(0)}%`, top: `${pct(0)}%` }}
            onMouseEnter={() => setActive("LA-00")}
            onMouseLeave={() => setActive(null)}
          >
            <div className="ring" />
            <div className="ring2" />
            <div className="pulse" />
            <div className="core" />
            <div className="label">
              <span className="id">LA-00 · PRIME</span>
              <span className="nm">Sinus Medii</span>
            </div>
          </div>

          {nodes.map((n) => (
            <div
              key={n.id}
              className={`la-node ${highlight === n.id ? "active" : ""}`}
              data-dir={n.dir}
              style={{ left: `${fx(pct(n.sx))}%`, top: `${fx(pct(n.sy))}%` }}
              onMouseEnter={() => setActive(n.id)}
              onMouseLeave={() => setActive(null)}
            >
              <div className="ring" />
              {highlight === n.id && <div className="pulse" />}
              <div className="core" />
              <div className="label">
                <span className="id">{n.id}</span>
                <span className="nm">{n.code}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isGlobe && (
        <div className="la-compass-globe">
          <span style={{ top: `${pct(-1)}%`, left: "50%" }}>N</span>
          <span style={{ top: "50%", left: `${pct(1)}%` }}>E</span>
          <span style={{ top: `${pct(1)}%`, left: "50%" }}>S</span>
          <span style={{ top: "50%", left: `${pct(-1)}%` }}>W</span>
        </div>
      )}
    </div>
  );
}

// Normal-scale animated octogram overlay (8-pointed star = two squares),
// projected onto the near-side mare in the photo.
function MoonArray() {
  const R = 34;
  const cX = 50;
  const cY = 50;
  const az = [0, 45, 90, 135, 180, 225, 270, 315];
  const pts = az.map((a) => {
    const r = (a * Math.PI) / 180;
    return { x: cX + R * Math.sin(r), y: cY - R * Math.cos(r) };
  });
  const sq = (idx: number[]) =>
    idx
      .map((k, i) => `${i ? "L" : "M"}${pts[k].x.toFixed(2)} ${pts[k].y.toFixed(2)}`)
      .join(" ") + " Z";
  const square1 = sq([0, 2, 4, 6]);
  const square2 = sq([1, 3, 5, 7]);

  return (
    <div className="la-moonarray" aria-hidden="true">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* rings */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke={C.accent}
          strokeOpacity="0.16"
          strokeWidth="0.7"
        />
        <circle
          cx="50"
          cy="50"
          r="22"
          fill="none"
          stroke={C.accent}
          strokeOpacity="0.3"
          strokeWidth="0.7"
          strokeDasharray="3 3"
        />
        <circle
          cx="50"
          cy="50"
          r="11"
          fill="none"
          stroke={C.accentLight}
          strokeOpacity="0.45"
          strokeWidth="0.7"
        />
        {/* spokes */}
        {pts.map((p, i) => (
          <line
            key={"s" + i}
            x1="50"
            y1="50"
            x2={p.x.toFixed(2)}
            y2={p.y.toFixed(2)}
            stroke={C.accent}
            strokeOpacity="0.28"
            strokeWidth="0.6"
            strokeDasharray="2 2"
          />
        ))}
        {/* octogram — two overlapping squares */}
        <path
          d={square1}
          fill="none"
          stroke={C.accent}
          strokeOpacity="0.78"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d={square2}
          fill="none"
          stroke={C.accent}
          strokeOpacity="0.78"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        {/* hub */}
        <circle cx="50" cy="50" r="6" fill={C.accent} fillOpacity="0.14" />
        <circle cx="50" cy="50" r="2.6" fill={C.accentLight} />
        {/* node markers + pulse rings */}
        {pts.map((p, i) => (
          <g key={"n" + i}>
            <circle
              cx={p.x.toFixed(2)}
              cy={p.y.toFixed(2)}
              r="1.6"
              fill={C.accentLight}
            />
            <circle
              cx={p.x.toFixed(2)}
              cy={p.y.toFixed(2)}
              r="1.6"
              fill="none"
              stroke={C.accentLight}
              strokeWidth="0.7"
            >
              <animate
                attributeName="r"
                values="1.6;4.6"
                dur="2.4s"
                begin={`${i * 0.28}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.85;0"
                dur="2.4s"
                begin={`${i * 0.28}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
        {/* signal pulses travelling hub → node */}
        {pts.map((p, i) => {
          const dur = 2.2 + i * 0.1;
          return (
            <circle key={"p" + i} r="1.1" fill={C.accentLight}>
              <animateMotion
                dur={`${dur}s`}
                begin={`${i * 0.28}s`}
                repeatCount="indefinite"
                path={`M50 50 L${p.x.toFixed(2)} ${p.y.toFixed(2)}`}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.12;0.85;1"
                dur={`${dur}s`}
                begin={`${i * 0.28}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
