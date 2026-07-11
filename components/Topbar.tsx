import Link from "next/link";

// Brand mark + wordmark + tagline on the left; nav on the right.
// "Tsukibase" is the external sister-site link. "Array Map" is the one live
// link in the nav — the rest are decorative anchors on this single-frame
// page — so it goes first, right after the pip.
export default function Topbar() {
  return (
    <div className="la-topbar">
      <div className="la-brand">
        <span className="mark" />
        <span className="word">
          LUNAR<span className="light">ARRAY</span>
        </span>
        <span className="tag">Near-Side Spaceport · est. M-127</span>
      </div>
      <nav className="la-nav">
        <span className="pip" />
        <Link href="/map">Array Map</Link>
        <a href="#status">Status</a>
        <a href="#beacons">Beacons</a>
        <a href="#access">Access</a>
        <a
          href="https://tsukibase.com"
          className="ext"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tsukibase
        </a>
      </nav>
    </div>
  );
}
