// Brand mark + wordmark + tagline on the left; nav on the right.
// "Tsukibase" is the external sister-site link.
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
