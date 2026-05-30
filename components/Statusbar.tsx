"use client";

import { useEffect, useState } from "react";

// Full-width bottom strip. Left = system groups; right = sub-Earth point and a
// live mission clock recomputed every second.
export default function Statusbar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fake lunar mission time (MJD). The server renders its own clock; the live
  // value takes over on the client (hydration mismatch suppressed below).
  const lunarT = `MJD ${Math.floor(60000 + now.getTime() / 86400000)}.${String(
    now.getUTCHours(),
  ).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}`;

  return (
    <div className="la-statusbar">
      <div className="left">
        <div className="group">
          <span>SYS</span>
          <b className="acc">ONLINE</b>
        </div>
        <div className="sep" />
        <div className="group">
          <span>NODES</span>
          <b>09 / 09</b>
        </div>
        <div className="sep" />
        <div className="group">
          <span>UPLINK</span>
          <b className="acc">EARTH-1</b>
        </div>
        <div className="sep" />
        <div className="group">
          <span>PHASE</span>
          <b>WAXING GIBBOUS</b>
        </div>
      </div>
      <div className="right">
        <div className="group">
          <span>SUB-EARTH</span>
          <b>0°00′ N · 0°00′ E</b>
        </div>
        <div className="sep" />
        <div className="group">
          <span>MET</span>
          <b suppressHydrationWarning>{lunarT}</b>
        </div>
      </div>
    </div>
  );
}
