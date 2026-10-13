import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { chapterLabel, overallProgress, resumeLink, resumeTarget, useProgressList } from "../utils/progress";
import { session } from "../utils/store";
import "./ContinuePage.css";

// Shown right after the splash when this device has an unfinished book, so a returning reader
// is one tap from their page.
export default function ContinuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = useProgressList(true);

  useEffect(() => {
    session.set("rumion_continue_seen", "1");
  }, []);

  if (!items.length) return <Navigate to="/" replace />;

  const [hero, ...rest] = items;
  const target = resumeTarget(hero);
  const pct = Math.round(overallProgress(hero) * 100);
  const justFinished = hero.finished && hero.next;
  const others = rest.slice(0, 3);

  return (
    <div className="continue">
      <div
        className="continue__backdrop"
        style={{ backgroundImage: hero.cover ? `url(${hero.cover})` : undefined }}
        aria-hidden="true"
      />
      <div className="continue__scrim" aria-hidden="true" />

      <div className="continue__body">
        <h1 className="continue__welcome font-display">
          {user ? `Welcome back, ${user.penName}` : "Welcome back"}
        </h1>
        <p className="continue__sub">Your story is right where you left it.</p>

        <Link to={resumeLink(hero)} className="continue__cover-link" aria-label={`Continue ${hero.title}`}>
          <div className="continue__cover">
            {hero.cover ? (
              <img src={hero.cover} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="font-display">{hero.title?.[0] || "?"}</span>
            )}
          </div>
        </Link>

        <h2 className="continue__title font-display">{hero.title || "Untitled"}</h2>
        {hero.author && <p className="continue__author">by {hero.author}</p>}
        <p className="continue__where">
          {justFinished ? "Up next: " : ""}Chapter {target.order || "?"}
          {target.title ? `, ${target.title}` : ""}
        </p>

        <div className="continue__bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="continue__pct">{pct}% read</p>

        <Link to={resumeLink(hero)} className="btn btn-primary continue__cta">
          Continue reading
        </Link>
        <button className="continue__skip" onClick={() => navigate("/", { replace: true })}>
          Browse the library
        </button>

        {others.length > 0 && (
          <div className="continue__others">
            <h3 className="font-display">Also in progress</h3>
            {others.map((p) => (
              <Link key={p.key} to={resumeLink(p)} className="continue__item">
                <div className="continue__thumb">
                  {p.cover ? <img src={p.cover} alt="" referrerPolicy="no-referrer" /> : <span>{p.title?.[0] || "?"}</span>}
                </div>
                <div className="continue__item-text">
                  <p className="continue__item-title">{p.title || "Untitled"}</p>
                  <p className="continue__item-where">{chapterLabel(resumeTarget(p).order, "")}</p>
                  <div className="continue__mini-bar">
                    <span style={{ width: `${Math.round(overallProgress(p) * 100)}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
