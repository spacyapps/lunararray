"use client";

// Auto-scrolling info cards for base-orbit / residence context.
// Fades between cards so the 3D scene stays readable.

import { useEffect, useState, type CSSProperties } from "react";

const mono: CSSProperties = {
  fontFamily: "var(--mono)",
  textTransform: "uppercase",
};

export type InfoCard = {
  title: string;
  body: string;
};

/** Exterior LA-08 orbit — crater domes, transit, program mix. */
export const LA08_DOME_CARDS: InfoCard[] = [
  {
    title: "Crater-sited domes",
    body: "Glass domes sit in existing craters — minerals, regolith soil, and excavation savings in one footprint. The dug bowl already shapes radiation and micrometeorite protection.",
  },
  {
    title: "Why dig once",
    body: "Crater rims are free embankments. Floors are leveled once for beds, stockpiles, or ore. Building into a pit costs less mass than raising berms from zero.",
  },
  {
    title: "Redundancy & scale",
    body: "Multiple domes mean crop failure, glass breach, or a build delay never takes the city offline. New craters open as demand grows — gardens, scaffolds, or mineral claims.",
  },
  {
    title: "Prefab transit ducts",
    body: "Pressurized tubes are factory bay sections with bolt-on coupler rings — snap together for speed, unclamp a segment for maintenance. Spokes feed the hub; ring links join neighboring crater domes; feeders reach far digs.",
  },
  {
    title: "Program mix",
    body: "Not every crater is green. Some shells are still under construction; one dig is a mineral claim where ore won out over soil. Same dome language, different payload.",
  },
  {
    title: "CLASSIFIED — tower design",
    body: "Residential tower architecture, structural loads, and the retractable silo unit are restricted. Observe surface behavior only. Further schematics are not cleared for this channel.",
  },
];

/** Inside the residential bay — sky, window, wall-crown life support. */
export const LA08_RESIDENCE_CARDS: InfoCard[] = [
  {
    title: "Artificial sky",
    body: "The skylight is not open lunar daylight. Tuned full-spectrum arrays behind the well reproduce healthy solar cycles — circadian cueing, plant PAR, and soft room fill without radiation exposure.",
  },
  {
    title: "Safety window",
    body: "The lunar vista is a high-fidelity display, not a real viewport. Structural integrity and radiation shielding stay intact; outside feeds show live or curated surface imagery for place and orientation.",
  },
  {
    title: "Wall-crown vegetation",
    body: "Hydroponic pods along the ceiling recycle CO₂ into oxygen, buffer humidity, and give visual ease — green mass for the eye and a quiet balance to long-duration life indoors.",
  },
];

export function InfoTicker({
  cards = LA08_DOME_CARDS,
  intervalMs = 7000,
  visible = true,
  style,
}: {
  cards?: InfoCard[];
  intervalMs?: number;
  visible?: boolean;
  style?: CSSProperties;
}) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!visible || cards.length < 2) return;
    let cancelled = false;
    const tick = () => {
      setFade(false);
      window.setTimeout(() => {
        if (cancelled) return;
        setIdx((i) => (i + 1) % cards.length);
        setFade(true);
      }, 280);
    };
    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [visible, cards, intervalMs]);

  // Reset when card set changes (base ↔ interior)
  useEffect(() => {
    setIdx(0);
    setFade(true);
  }, [cards]);

  if (!visible || cards.length === 0) return null;
  const card = cards[idx % cards.length]!;

  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        top: 108,
        width: 320,
        maxWidth: "min(320px, calc(100vw - 48px))",
        pointerEvents: "none",
        zIndex: 5,
        ...style,
      }}
    >
      <div
        style={{
          border: "1px solid rgba(238, 242, 247, 0.16)",
          background: "rgba(8, 10, 16, 0.84)",
          backdropFilter: "blur(12px)",
          padding: "14px 16px 12px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            ...mono,
            fontSize: 9,
            letterSpacing: "0.28em",
            color: "rgba(196, 138, 255, 0.9)",
            marginBottom: 8,
          }}
        >
          Site brief · {String(idx + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
        </div>
        <div
          style={{
            opacity: fade ? 1 : 0,
            transform: fade ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 280ms ease, transform 280ms ease",
          }}
        >
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              fontWeight: 500,
              color: "#eef2f7",
              letterSpacing: "0.02em",
              marginBottom: 8,
            }}
          >
            {card.title}
          </div>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: 12.5,
              lineHeight: 1.55,
              color: "rgba(238, 242, 247, 0.68)",
            }}
          >
            {card.body}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {cards.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 14 : 5,
                height: 3,
                background:
                  i === idx ? "rgba(196, 138, 255, 0.95)" : "rgba(238, 242, 247, 0.22)",
                transition: "width 280ms ease, background 280ms ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
