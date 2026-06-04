"use client";

import { useEffect, useState } from "react";
import GlobeOctogram from "@/components/GlobeOctogram";
import Starfield from "@/components/Starfield";
import ViewportRedirect from "@/components/ViewportRedirect";
import "./mobile.css";

// A live UTC readout — the relay keeps Earth-comms time.
function useUTCTime() {
  function fmt() {
    const d = new Date();
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
      d.getUTCMinutes(),
    ).padStart(2, "0")} UTC`;
  }
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 15000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function MobilePage() {
  const time = useUTCTime();

  useEffect(() => {
    document.body.classList.add("mobile-page");
    return () => document.body.classList.remove("mobile-page");
  }, []);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100svh",
        background: "#05060a",
        overflow: "hidden",
      }}
    >
      {/* Send genuinely wide viewports back to the desktop stage. */}
      <ViewportRedirect to="/" query="(min-width: 1025px)" />
      <div
        className="mobile-sky"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          background: "#05060a",
        }}
      >
        {/* Signal-cyan nebula wash — the LunarArray counterpoint to
            Tsukibase's ember. The animated array disc is the hero, so the
            backdrop stays as deep space rather than a competing full Moon. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(90% 60% at 50% 32%, rgba(92,214,255,0.10) 0%, rgba(0,0,0,0) 58%), radial-gradient(70% 50% at 50% 100%, rgba(255,122,60,0.03) 0%, rgba(0,0,0,0) 60%)",
            pointerEvents: "none",
          }}
        />
        <Starfield />
      </div>

      <main
        style={{
          position: "relative",
          minHeight: "100svh",
          paddingTop: "clamp(56px, 9vh, 110px)",
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 40,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "clamp(30px, 6vh, 56px)",
        }}
      >
        <div
          className="mobile-notif"
          role="status"
          aria-live="polite"
          style={{
            width: "100%",
            maxWidth: 380,
            borderRadius: 22,
            background: "rgba(10, 12, 18, 0.72)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(22px) saturate(140%)",
            WebkitBackdropFilter: "blur(22px) saturate(140%)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            padding: "12px 14px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 10,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background:
                  "radial-gradient(120% 80% at 30% 30%, #11151c 0%, #0b0c12 100%)",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                flexShrink: 0,
              }}
            >
              {/* The LunarArray diamond mark (matches the desktop topbar). */}
              <span
                style={{
                  width: 12,
                  height: 12,
                  border: "1.4px solid var(--accent)",
                  transform: "rotate(45deg)",
                  position: "relative",
                  boxShadow: "0 0 6px rgba(92,214,255,0.5)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 2,
                    border: "1.4px solid var(--accent)",
                  }}
                />
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  color: "#eef2f7",
                }}
              >
                LUNARARRAY
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "var(--accent)",
                }}
              >
                LA-00
              </span>
            </div>

            <span
              suppressHydrationWarning
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 500,
                color: "rgba(238,242,247,0.42)",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              {time}
            </span>
          </div>

          <div style={{ padding: "2px 2px 0" }}>
            <div
              className="mobile-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 600,
                color: "#eef2f7",
                letterSpacing: "-0.005em",
                marginBottom: 4,
              }}
            >
              Relay uplink active
            </div>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.42,
                color: "rgba(238,242,247,0.62)",
              }}
            >
              Near-side spaceport &amp; deep-space relay, Sinus Medii.
              384,400&nbsp;km to Earth. Full console on desktop.
            </p>
          </div>
        </div>

        {/* The Moon — NASA near-side photo with the animated array projected
            onto the mare at the sub-Earth point, plus the N/E/S/W compass.
            Same component the desktop centres the page on. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <GlobeOctogram size={272} mode="globe" />
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--ink-ghost)",
            }}
          >
            Near side · Sinus Medii · LA-00
          </div>
        </div>

        {/* Zoomed array detail — the animated octogram with live signal
            pulses. Same component as the desktop inset. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              fontFamily: "var(--mono)",
              fontSize: 9.5,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--ink-ghost)",
            }}
          >
            <span>Array Detail · LA-00</span>
            <span style={{ color: "var(--accent)" }}>× 4,300</span>
          </div>

          <GlobeOctogram size={240} mode="inset" />

          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--ink-ghost)",
            }}
          >
            9 nodes · 4 mining claims · 180 km Ø
          </div>
        </div>
      </main>
    </div>
  );
}
