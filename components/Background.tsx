import Starfield from "./Starfield";

// Layered backdrop: radial nebula gradient (CSS on .la-bg) → animated starfield
// canvas (mix-blend screen) → faint engineering grid → vignette.
export default function Background() {
  return (
    <>
      <div className="la-bg">
        <Starfield />
      </div>
      <div className="la-grid" />
      <div className="la-vignette" />
    </>
  );
}
