import { Link } from "react-router-dom";
import "./NovelCard.css";

// Renders a platform novel (from our DB) or a normalized catalog novel
// (see utils/externalAdapter.js) - same card, different link + field names.
export default function NovelCard({ novel, source = "original" }) {
  const ext = source === "external";
  // Mirrored catalog novels (saved in favorites) still open the live catalog page.
  const mirrored = !ext && novel.source === "external" && novel.externalId;
  const to = ext
    ? `/external/novel/${encodeURIComponent(novel.detailPath)}`
    : mirrored ? `/external/novel/${encodeURIComponent(novel.externalId)}` : `/novel/${novel._id}`;
  const cover = ext ? novel.cover : novel.coverUrl;
  const rating = ext ? novel.rating : novel.ratingAverage;
  const mature = ext ? novel.isMature : novel.isMature;

  return (
    <Link to={to} className="novel-card">
      <div className="novel-card__cover">
        {cover ? (
          <img src={cover} alt={`${novel.title} cover`} loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="novel-card__placeholder font-display">{novel.title?.[0] || "?"}</div>
        )}
        {mature && <span className="novel-card__badge">18+</span>}
      </div>
      <p className="novel-card__title">{novel.title}</p>
      {rating > 0 && <p className="novel-card__rating">★ {Number(rating).toFixed(1)}</p>}
    </Link>
  );
}
