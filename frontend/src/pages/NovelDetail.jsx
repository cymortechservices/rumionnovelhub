import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchNovel,
  fetchChapterList,
  toggleFavorite,
  rateNovel,
  fetchMyRating,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { chapterLabel, getProgress, progressKey, resumeLink, resumeTarget } from "../utils/progress";
import StarRating from "../components/StarRating";
import CommentSection from "../components/CommentSection";
import "./NovelDetail.css";

export default function NovelDetail() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const saved = getProgress(progressKey("original", id));
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    fetchNovel(id).then((d) => setNovel(d.novel));
    fetchChapterList(id).then((d) => setChapters(d.chapters));
    if (user) fetchMyRating(id).then((d) => setMyRating(d.score));
  }, [id, user]);

  useEffect(() => {
    if (user) setIsFav(user.favorites?.includes?.(id) ?? false);
  }, [user, id]);

  const handleFavorite = async () => {
    if (!user) return navigate("/login");
    const { favorites } = await toggleFavorite(id);
    setUser((u) => ({ ...u, favorites }));
    setIsFav(favorites.includes(id));
  };

  const handleRate = async (score) => {
    if (!user) return navigate("/login");
    setMyRating(score);
    const { ratingAverage, ratingCount } = await rateNovel(id, score);
    setNovel((n) => ({ ...n, ratingAverage, ratingCount }));
  };

  if (!novel) return <p className="muted container">Loading…</p>;

  return (
    <div className="novel-detail">
      <div className="novel-detail__hero" style={{ backgroundImage: novel.coverUrl ? `url(${novel.coverUrl})` : undefined }}>
        <div className="novel-detail__scrim" />
      </div>

      <div className="novel-detail__body container">
        <div className="novel-detail__top">
          <img src={novel.coverUrl} alt="" className="novel-detail__cover" />
          <div>
            <h1 className="font-display novel-detail__title">{novel.title}</h1>
            <p className="muted">by {novel.authorName}</p>
            <div className="novel-detail__genres">
              {novel.genres.map((g) => (
                <span key={g} className="tag">{g}</span>
              ))}
              <span className="tag">{novel.status}</span>
            </div>
          </div>
        </div>

        <div className="novel-detail__stats">
          <div>
            <StarRating value={myRating || Math.round(novel.ratingAverage)} onRate={handleRate} />
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {novel.ratingAverage?.toFixed(1) || "0.0"} ({novel.ratingCount} ratings)
            </p>
          </div>
          <button className={`btn btn-ghost novel-detail__fav ${isFav ? "is-active" : ""}`} onClick={handleFavorite}>
            {isFav ? "♥ Favorited" : "♡ Favorite"}
          </button>
        </div>

        {saved && (!saved.finished || saved.next) ? (
          <Link to={resumeLink(saved)} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Continue reading · {chapterLabel(resumeTarget(saved).order, "")}
          </Link>
        ) : chapters[0] ? (
          <Link to={`/read/${chapters[0]._id}`} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Start reading
          </Link>
        ) : null}

        <p className="novel-detail__synopsis">{novel.synopsis}</p>

        <div className="novel-detail__chapters">
          <h3 className="font-display">{chapters.length} Chapters</h3>
          <ul>
            {chapters.map((c) => (
              <li key={c._id}>
                <Link to={`/read/${c._id}`}>
                  <span>{c.order}. {c.title}</span>
                  <span className="muted">{c.wordCount} words</span>
                </Link>
              </li>
            ))}
            {chapters.length === 0 && <p className="muted">No chapters published yet.</p>}
          </ul>
        </div>
      </div>

      <CommentSection novelId={id} />
    </div>
  );
}
