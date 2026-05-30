// LunarArray — Variation B: Observatory / centered cinematic
// Big bright Moon as centerpiece (with an animated array over the near-side
// mare) + a zoomed-in array-detail inset in the bottom-right.
//
// Server Component shell. The animated Moon, inset, starfield and clock are
// split into Client Components.

import Background from "@/components/Background";
import GlobeOctogram from "@/components/GlobeOctogram";
import RequestAccess from "@/components/RequestAccess";
import Statusbar from "@/components/Statusbar";
import Topbar from "@/components/Topbar";

export default function Home() {
  return (
    <div className="la-frame varB">
      <Background />
      <Topbar />

      {/* Corner ticks */}
      <div className="la-corner tl" />
      <div className="la-corner tr" />
      <div className="la-corner bl" />
      <div className="la-corner br" />

      {/* Centerpiece moon globe */}
      <div className="octo-stage">
        <GlobeOctogram size={720} mode="globe" />
      </div>

      {/* Top-left — title */}
      <div className="copy-tl">
        <div className="la-eyebrow">
          <span className="pip" />
          <span>NEAR-SIDE SPACEPORT &amp; RELAY</span>
        </div>
        <h2 className="la-h2" style={{ marginTop: 18 }}>
          The Moon&apos;s <span style={{ color: "var(--accent)" }}>face</span>,
          <br />
          open for landing.
        </h2>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--ink-dim)",
            maxWidth: 320,
            marginTop: 14,
          }}
        >
          A crewed spaceport and deep-space relay pinned to the regolith that
          always faces Earth — nine berths on a single octogram, fed by the
          mining claims worked across its points. Coming online M-127.
        </p>

        <div className="la-gateway">
          <span className="rule" />
          Gateway to <span className="t">Tsukibase</span>
        </div>
      </div>

      {/* Top-right — coords */}
      <div className="copy-tr">
        <div className="la-eyebrow" style={{ justifyContent: "flex-end" }}>
          <span>SINUS MEDII · LA-00</span>
          <span className="pip" />
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: "var(--mono)",
            fontSize: 10.5,
            letterSpacing: "0.18em",
            color: "var(--ink-ghost)",
            textTransform: "uppercase",
            lineHeight: 1.7,
          }}
        >
          <div>
            Lat <span style={{ color: "var(--ink)" }}>0°00′ 00″ N</span>
          </div>
          <div>
            Lon <span style={{ color: "var(--ink)" }}>0°00′ 00″ E</span>
          </div>
          <div>
            Span <span style={{ color: "var(--accent)" }}>~180 km</span>
          </div>
          <div>
            Range <span style={{ color: "var(--ink)" }}>384,400 km → Earth</span>
          </div>
        </div>
      </div>

      {/* Bottom-left — description + CTA */}
      <div className="copy-bl">
        <div className="la-mono-sub" style={{ marginBottom: 10 }}>
          About the Port
        </div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--ink-dim)",
            marginBottom: 16,
            maxWidth: 380,
          }}
        >
          LunarArray pairs a crewed spaceport with a deep-space communications
          relay at the sub-Earth point — landing pads, antenna farms and ore
          works linked through a central prime hub. Eight outstations span a
          180-kilometre octogram, several built straight onto the near
          side&apos;s richest mining claims.
        </p>
        <RequestAccess />
      </div>

      {/* Bottom-right — array detail inset */}
      <div className="copy-br array-inset-wrap">
        <div className="inset-head">
          <span className="la-mono-sub" style={{ letterSpacing: "0.24em" }}>
            Array Detail · LA-00
          </span>
          <span
            className="la-mono-sub"
            style={{ color: "var(--accent)", letterSpacing: "0.24em" }}
          >
            × 4,300
          </span>
        </div>
        <GlobeOctogram size={320} mode="inset" />
        <div className="inset-foot">9 nodes · 4 mining claims · 180 km Ø</div>
      </div>

      <a
        className="la-credit"
        href="https://images.nasa.gov/details/art002e009212"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="pip" />
        Lunar imagery · NASA — images.nasa.gov / art002e009212
      </a>

      <Statusbar />
    </div>
  );
}
