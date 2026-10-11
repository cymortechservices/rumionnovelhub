import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchComments, postComment, deleteComment } from "../services/api";
import "./CommentSection.css";

export default function CommentSection({ novelId, chapterId = null }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = () => {
    fetchComments(novelId, chapterId ? { chapter: chapterId } : {})
      .then((d) => setComments(d.comments))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId, chapterId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      await postComment({ novelId, chapterId, text });
      setText("");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't post that comment.");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id) => {
    await deleteComment(id);
    setComments((c) => c.filter((x) => x._id !== id));
  };

  return (
    <div className="comments">
      <h3 className="font-display comments__title">Comments</h3>

      {user ? (
        <form className="comments__form" onSubmit={submit}>
          <textarea
            className="input"
            rows={2}
            placeholder="Share your thoughts on this novel…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
          <button className="btn btn-primary" disabled={posting}>
            {posting ? "Posting…" : "Post"}
          </button>
        </form>
      ) : (
        <p className="muted comments__login-hint">Log in to join the conversation.</p>
      )}

      {loading ? (
        <p className="muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="muted">No comments yet — be the first to say something.</p>
      ) : (
        <ul className="comments__list">
          {comments.map((c) => (
            <li key={c._id} className="comments__item">
              <div className="comments__avatar">
                {c.userAvatar ? <img src={c.userAvatar} alt="" /> : c.userName?.[0]}
              </div>
              <div>
                <p className="comments__name">
                  {c.userName} <span className="muted comments__time">{new Date(c.createdAt).toLocaleDateString()}</span>
                </p>
                <p className="comments__text">{c.text}</p>
                {user?.id === c.user && (
                  <button className="comments__delete" onClick={() => remove(c._id)}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
