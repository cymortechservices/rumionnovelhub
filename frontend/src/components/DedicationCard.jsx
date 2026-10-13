import { useMemo, useState } from "react";
import { DEVELOPER } from "../constants/app";
import "./DedicationCard.css";

// A love letter inside the app. Rose petals drift behind the words, the wax-seal heart beats,
// and tapping it lets a few hearts float up.
const PETALS = Array.from({ length: 9 }, (_, i) => ({
  left: 6 + i * 11,
  delay: (i * 0.9) % 6,
  dur: 7 + (i % 4) * 1.4,
  size: 9 + (i % 3) * 3,
}));

export default function DedicationCard() {
  const [burst, setBurst] = useState(0);
  const hearts = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: ((i * 37) % 160) - 80,
        y: 70 + ((i * 53) % 90),
        r: ((i * 29) % 70) - 35,
        d: (i % 6) * 0.07,
        s: 0.7 + ((i * 13) % 8) / 10,
      })),
    []
  );

  return (
    <section className="dedication" aria-label={`Dedication from ${DEVELOPER}`}>
      <div className="dedication__petals" aria-hidden="true">
        {PETALS.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size + 3,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        className="dedication__seal"
        onClick={() => setBurst((b) => b + 1)}
        aria-label="Send a little love"
      >
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
          <path
            d="M12 20.6s-7.6-4.7-9.8-9.5C.6 7.4 2.4 4 6 3.6c2-.2 3.7.9 4.9 2.6 1.2-1.7 2.9-2.8 4.9-2.6 3.6.4 5.4 3.8 3.8 7.5C17.4 15.9 12 20.6 12 20.6Z"
            fill="currentColor"
          />
        </svg>
        {burst > 0 &&
          hearts.map((h) => (
            <i
              key={`${burst}-${h.id}`}
              className="dedication__float"
              style={{
                "--x": `${h.x}px`,
                "--y": `-${h.y}px`,
                "--r": `${h.r}deg`,
                "--s": h.s,
                animationDelay: `${h.d}s`,
              }}
            >
              ♥
            </i>
          ))}
      </button>

      <p className="dedication__script">For my love</p>

      <div className="dedication__rule" aria-hidden="true">
        <span />
        <b>♥</b>
        <span />
      </div>

      <p className="dedication__message">
        To the one who lives between the pages, who keeps a bookmark in every heart-racing
        chapter and a place for me beside the story. Every word of this little library is a
        love letter to you.
      </p>
      <p className="dedication__for">Dedicated to my love, who loves reading and is a novel girlie.</p>

      <p className="dedication__sign">{DEVELOPER}</p>
      <p className="dedication__role">Developer of Rumion Novel Hub</p>
    </section>
  );
}
