import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./HeroCarousel.css";

// Auto-switching hero for trending novels. Pauses on touch/hover and resumes after.
// Works with platform novels (source="original") or catalog novels (source="external").
export default function HeroCarousel({ novels = [], source = "original" }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);
  const ext = source === "external";

  const start = () => {
    clearInterval(timerRef.current);
    if (novels.length < 2) return;
    timerRef.current = setInterval(() => setActive((i) => (i + 1) % novels.length), 4500);
  };
  const stop = () => clearInterval(timerRef.current);

  useEffect(() => {
    setActive(0);
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novels.length]);

  if (!novels.length) return <div className="hero hero--skeleton" aria-hidden="true" />;

  return (
    <div className="hero" onMouseEnter={stop} onMouseLeave={start} onTouchStart={stop} onTouchEnd={start}>
      {novels.map((novel, i) => {
        const to = ext ? `/external/novel/${encodeURIComponent(novel.detailPath)}` : `/novel/${novel._id}`;
        const cover = ext ? novel.cover : novel.coverUrl;
        const rating = ext ? novel.rating : novel.ratingAverage;
        return (
          <Link
            to={to}
            key={ext ? novel.id : novel._id}
            className={`hero__slide ${i === active ? "is-active" : ""}`}
            style={{ backgroundImage: cover ? `url(${cover})` : undefined }}
          >
            <div className="hero__scrim" />
            <div className="hero__content">
              <p className="hero__eyebrow">Trending now</p>
              <h2 className="font-display hero__title">{novel.title}</h2>
              <p className="hero__meta">
                {novel.genres?.slice(0, 2).join(" · ")} {rating ? `· ★ ${Number(rating).toFixed(1)}` : ""}
              </p>
            </div>
          </Link>
        );
      })}
      <div className="hero__dots">
        {novels.map((_, i) => (
          <button
            key={i}
            className={`hero__dot ${i === active ? "is-active" : ""}`}
            aria-label={`Show slide ${i + 1}`}
            onClick={(e) => { e.preventDefault(); setActive(i); }}
          />
        ))}
      </div>
    </div>
  );
}
