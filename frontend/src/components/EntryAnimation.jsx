import { useEffect, useState } from "react";
import "./EntryAnimation.css";

// A single orchestrated page-load moment: a book glows awake and exhales
// a handful of petals before the app fades into Home. Shown once per
// browser session so returning visits aren't slowed down.
export default function EntryAnimation({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 2000);
    const doneTimer = setTimeout(() => onDone(), 2600);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const petals = Array.from({ length: 10 });

  return (
    <div className={`entry ${leaving ? "entry--leaving" : ""}`}>
      <div className="entry__glow" />
      <svg
        className="entry__book"
        viewBox="0 0 220 160"
        width="180"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pageGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F6EFE2" />
            <stop offset="100%" stopColor="#E4D5B7" />
          </linearGradient>
        </defs>
        <path d="M110 30 C90 18 50 14 20 22 V128 C50 120 90 124 110 136 Z" fill="url(#pageGrad)" stroke="#7A2331" strokeWidth="2" />
        <path d="M110 30 C130 18 170 14 200 22 V128 C170 120 130 124 110 136 Z" fill="url(#pageGrad)" stroke="#7A2331" strokeWidth="2" />
        <line x1="110" y1="30" x2="110" y2="136" stroke="#C9A24B" strokeWidth="2" />
        {[38, 50, 62].map((y) => (
          <line key={`l-${y}`} x1="34" y1={y} x2="98" y2={y - 4} stroke="#C9A24B" strokeOpacity="0.55" strokeWidth="1.4" />
        ))}
        {[38, 50, 62].map((y) => (
          <line key={`r-${y}`} x1="122" y1={y - 4} x2="186" y2={y} stroke="#C9A24B" strokeOpacity="0.55" strokeWidth="1.4" />
        ))}
      </svg>

      {petals.map((_, i) => (
        <span
          key={i}
          className="entry__petal"
          style={{
            left: `${50 + (i % 2 === 0 ? -1 : 1) * (6 + i * 3.2)}%`,
            animationDelay: `${0.5 + i * 0.09}s`,
            "--drift": `${(i % 2 === 0 ? -1 : 1) * (30 + i * 6)}px`,
          }}
        />
      ))}

      <p className="entry__title font-display">Rumion Novel Hub</p>
      <p className="entry__tagline">every page, turning</p>
    </div>
  );
}
