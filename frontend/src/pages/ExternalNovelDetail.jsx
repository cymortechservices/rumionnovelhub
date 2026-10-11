import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchExternalNovel, fetchExternalChapters, fetchMirrorByExternal, mirrorExternalNovel,
  toggleFavorite, rateNovel, fetchMyRating,
} from "../services/api";
import {
  unwrap, unwrapList, normalizeNovel, normalizeChapterListItem, toRumionGenres,
} from "../utils/externalAdapter";
import { isAgeConfirmed } from "../utils/ageGate";
import { useAuth } from "../context/AuthContext";
import AgeGate from "../components/AgeGate";
import StarRating from "../components/StarRating";
import CommentSection from "../components/CommentSection";
import "./NovelDetail.css";

// A catalog novel, read live from the Nabees Novel API. Ratings / comments / favorites
// need a database record, so the first time a logged-in reader opens one we mirror its
// metadata into MongoDB (POST /api/novels/external-mirror). Text is never copied.
export default function ExternalNovelDetail() {
  const { detailPath } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [mirror, setMirror] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [error, setError] = useState(false);
  const [ageOk, setAgeOk] = useState(isAgeConfirmed());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    setNovel(null); setChapters([]); setError(false);
    fetchExternalNovel(detailPath)
      .then((res) => {
        const n = normalizeNovel(unwrap(res));
        if (!alive) return;
        if (!n) return setError(true);
        setNovel(n);
        fetchExternalChapters(n.id).then((c) => alive && setChapters(unwrapList(c).map(normalizeChapterListItem)));
      })
      .catch(() => alive && setError(true));
    fetchMirrorByExternal(detailPath).then((d) => alive && setMirror(d.novel)).catch(() => {});
    return () => { alive = false; };
  }, [detailPath]);

  const ensureMirror = async () => {
    if (mirror) return mirror;
    const { novel: m } = await mirrorExternalNovel({
      externalId: detailPath,
      title: novel.title,
      synopsis: novel.synopsis,
      coverUrl: novel.cover,
      genres: toRumionGenres(novel),
      authorName: novel.author,
      isMature: novel.isMature,
    });
    setMirror(m);
    return m;
  };

  // Logged-in readers get the comment box straight away.
  useEffect(() => {
    if (user && novel && !mirror) ensureMirror().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, novel]);

  useEffect(() => {
    if (user && mirror) fetchMyRating(mirror._id).then((d) => setMyRating(d.score)).catch(() => {});
  }, [user, mirror?._id]);

  const isFav = !!(mirror && user?.favorites?.includes(mirror._id));

  const handleFavorite = async () => {
    if (!user) return navigate("/login");
    const m = await ensureMirror();
    const { favorites } = await toggleFavorite(m._id);
    setUser((u) => ({ ...u, favorites }));
  };

  const handleRate = async (score) => {
    if (!user) return navigate("/login");
    const m = await ensureMirror();
    setMyRating(score);
    const r = await rateNovel(m._id, score);
    setMirror((x) => ({ ...x, ratingAverage: r.ratingAverage, ratingCount: r.ratingCount }));
  };

  if (error) return <p className="muted container" style={{ paddingTop: 24 }}>Couldn't load this novel. <Link to="/">Back home</Link></p>;
  if (!novel) return <p className="muted container" style={{ paddingTop: 24 }}>Opening the book…</p>;
  if (novel.isMature && !ageOk) return <AgeGate onConfirm={() => setAgeOk(true)} onLeave={() => navigate("/")} />;

  const first = chapters[0];
  const readTo = (c) => `/external/read/${encodeURIComponent(detailPath)}/${c.id}`;
  const shown = showAll ? chapters : chapters.slice(0, 30);
  const communityRated = mirror?.ratingCount > 0;

  return (
    <div className="novel-detail">
      <div className="novel-detail__hero" style={{ backgroundImage: novel.cover ? `url(${novel.cover})` : undefined }}>
        <div className="novel-detail__scrim" />
      </div>

      <div className="novel-detail__body container">
        <div className="novel-detail__top">
          {novel.cover && <img src={novel.cover} alt="" className="novel-detail__cover" referrerPolicy="no-referrer" />}
          <div>
            <h1 className="font-display novel-detail__title">{novel.title}</h1>
            <p className="muted">by {novel.author}</p>
            <div className="novel-detail__genres">
              {novel.genres.map((g) => <span key={g} className="tag">{g}</span>)}
              {novel.isMature && <span className="tag">18+</span>}
              <span className="tag">{novel.chapterCount} ch</span>
              {novel.words && <span className="tag">{novel.words} words</span>}
            </div>
          </div>
        </div>

        <div className="novel-detail__stats">
          <div>
            <StarRating value={myRating || Math.round(communityRated ? mirror.ratingAverage : novel.rating)} onRate={handleRate} />
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {communityRated
                ? `${mirror.ratingAverage.toFixed(1)} from ${mirror.ratingCount} Rumion readers`
                : novel.rating ? `${novel.rating.toFixed(1)} catalog score · be the first to rate` : "Be the first to rate"}
            </p>
          </div>
          <button className={`btn btn-ghost novel-detail__fav ${isFav ? "is-active" : ""}`} onClick={handleFavorite}>
            {isFav ? "♥ Favorited" : "♡ Favorite"}
          </button>
        </div>

        {first && (
          <Link to={readTo(first)} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Start reading
          </Link>
        )}

        <p className="novel-detail__synopsis">{novel.synopsis || "No description available."}</p>

        {novel.tags.length > 0 && (
          <div className="novel-detail__genres" style={{ marginTop: 12 }}>
            {novel.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        )}

        <div className="novel-detail__chapters">
          <h3 className="font-display">{chapters.length || novel.chapterCount} Chapters</h3>
          <ul>
            {shown.map((c) => (
              <li key={c.id}>
                <Link to={readTo(c)}>
                  <span>{c.order}. {c.title}</span>
                  <span className="muted">{c.words} words</span>
                </Link>
              </li>
            ))}
          </ul>
          {chapters.length > shown.length && (
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setShowAll(true)}>
              Show all {chapters.length} chapters
            </button>
          )}
          {chapters.length === 0 && <p className="muted">Loading chapters…</p>}
        </div>
      </div>

      {mirror ? (
        <CommentSection novelId={mirror._id} />
      ) : (
        <div className="comments">
          <h3 className="font-display comments__title">Comments</h3>
          <p className="muted">{user ? "Loading…" : "Log in to be the first to comment."}</p>
        </div>
      )}
    </div>
  );
}
