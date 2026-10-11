import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyNovels, createNovel, deleteNovel, updateMe } from "../services/api";
import { Novel_GENRES } from "../constants/genres";
import "./AuthorDashboard.css";

export default function AuthorDashboard() {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [novels, setNovels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", synopsis: "", genres: [], isMature: false, tags: "" });
  const [cover, setCover] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [becomingAuthor, setBecomingAuthor] = useState(false);

  useEffect(() => {
    if (user?.isAuthor) fetchMyNovels().then((d) => setNovels(d.novels));
  }, [user]);

  if (loading) return <p className="muted container">Loading…</p>;

  if (!user) {
    return (
      <div className="container author-cta">
        <h2 className="font-display">Your author desk</h2>
        <p className="muted">Log in or create an account to publish novels and chapters.</p>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>Log in</button>
      </div>
    );
  }

  if (!user.isAuthor) {
    const becomeAuthor = async () => {
      setBecomingAuthor(true);
      const fd = new FormData();
      fd.append("becomeAuthor", "true");
      const { user: updated } = await updateMe(fd);
      setUser(updated);
      setBecomingAuthor(false);
    };
    return (
      <div className="container author-cta">
        <h2 className="font-display">Become an author</h2>
        <p className="muted">Set up your author profile once to unlock the writing desk — uploading covers, chapters, and edits.</p>
        <button className="btn btn-primary" disabled={becomingAuthor} onClick={becomeAuthor}>
          {becomingAuthor ? "Setting up…" : "Set up author profile"}
        </button>
      </div>
    );
  }

  const toggleGenre = (g) => {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.synopsis || form.genres.length === 0) {
      alert("Add a title, synopsis and at least one genre.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("synopsis", form.synopsis);
      fd.append("genres", form.genres.join(","));
      fd.append("isMature", form.isMature);
      fd.append("tags", form.tags);
      if (cover) fd.append("cover", cover);
      const { novel } = await createNovel(fd);
      setNovels((n) => [novel, ...n]);
      setShowForm(false);
      setForm({ title: "", synopsis: "", genres: [], isMature: false, tags: "" });
      setCover(null);
      navigate(`/author/novel/${novel._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't publish that novel.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this novel and all its chapters?")) return;
    await deleteNovel(id);
    setNovels((n) => n.filter((x) => x._id !== id));
  };

  return (
    <div>
      <div className="author-head container">
        <h2 className="font-display">Your desk</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New novel"}
        </button>
      </div>

      {showForm && (
        <form className="author-form container card" onSubmit={submit}>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="input"
            rows={4}
            placeholder="Synopsis — hook readers in a few sentences"
            value={form.synopsis}
            onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))}
          />
          <div className="author-form__genres">
            {Novel_GENRES.map((g) => (
              <button
                type="button"
                key={g}
                className={`chip ${form.genres.includes(g) ? "is-active" : ""}`}
                onClick={() => toggleGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Tags, comma separated"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
          <label className="author-form__mature">
            <input
              type="checkbox"
              checked={form.isMature}
              onChange={(e) => setForm((f) => ({ ...f, isMature: e.target.checked }))}
            />
            Mark as 18+ / mature content
          </label>
          <label className="author-form__cover">
            Cover image
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])} />
          </label>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Publishing…" : "Publish novel"}
          </button>
        </form>
      )}

      <div className="author-list container">
        {novels.length === 0 && !showForm && (
          <p className="muted">You haven't published a novel yet.</p>
        )}
        {novels.map((n) => (
          <div key={n._id} className="author-list__item card">
            {n.coverUrl && <img src={n.coverUrl} alt="" />}
            <div className="author-list__info">
              <p className="author-list__title">{n.title}</p>
              <p className="muted">{n.chapterCount} chapters · {n.status}</p>
            </div>
            <div className="author-list__actions">
              <Link to={`/author/novel/${n._id}`} className="btn btn-ghost">Manage</Link>
              <button className="btn btn-ghost" onClick={() => remove(n._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
