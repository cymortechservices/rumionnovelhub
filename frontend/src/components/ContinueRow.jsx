import { Link } from "react-router-dom";
import { chapterLabel, overallProgress, removeProgress, resumeLink, resumeTarget, useProgressList } from "../utils/progress";
import "./ContinueRow.css";

// "Continue reading" shelf on Home: one card per novel in progress, newest first.
export default function ContinueRow() {
  const items = useProgressList(true);
  if (!items.length) return null;

  return (
    <section className="continue-row">
      <div className="continue-row__head">
        <h3 className="font-display">Continue reading</h3>
      </div>
      <div className="continue-row__scroller">
        {items.map((p) => {
          const pct = Math.round(overallProgress(p) * 100);
          const t = resumeTarget(p);
          return (
            <Link key={p.key} to={resumeLink(p)} className="continue-card">
              <div className="continue-card__cover">
                {p.cover ? (
                  <img src={p.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-display">{p.title?.[0] || "?"}</span>
                )}
                <button
                  type="button"
                  className="continue-card__remove"
                  aria-label={`Remove ${p.title} from continue reading`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeProgress(p.key);
                  }}
                >
                  ×
                </button>
              </div>
              <p className="continue-card__title">{p.title || "Untitled"}</p>
              <p className="continue-card__where">{chapterLabel(t.order, "")}</p>
              <div className="continue-card__bar" aria-label={`${pct}% read`}>
                <span style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
