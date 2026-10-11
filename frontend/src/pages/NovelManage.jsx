import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchNovel, fetchChapterList, createChapter, updateChapter, deleteChapter } from "../services/api";
import "./NovelManage.css";

const emptyDraft = { title: "", content: "", isDraft: true };

export default function NovelManage() {
  const { id } = useParams();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [editingId, setEditingId] = useState(null); // "new" | chapter._id | null
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetchNovel(id).then((d) => setNovel(d.novel));
    fetchChapterList(id).then((d) => setChapters(d.chapters));
  };

  useEffect(load, [id]);

  const startNew = () => {
    setEditingId("new");
    setDraft({ ...emptyDraft, title: `Chapter ${chapters.length + 1}` });
  };

  const startEdit = async (chapterId) => {
    const { fetchChapter } = await import("../services/api");
    const { chapter } = await fetchChapter(chapterId);
    setDraft({ title: chapter.title, content: chapter.content, isDraft: chapter.isDraft });
    setEditingId(chapterId);
  };

  const save = async (publish) => {
    if (!draft.title.trim() || !draft.content.trim()) {
      alert("A chapter needs a title and some content.");
      return;
    }
    setSaving(true);
    try {
      if (editingId === "new") {
        await createChapter({ novelId: id, title: draft.title, content: draft.content, isDraft: !publish });
      } else {
        await updateChapter(editingId, { title: draft.title, content: draft.content, isDraft: !publish });
      }
      setEditingId(null);
      setDraft(emptyDraft);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't save this chapter.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (chapterId) => {
    if (!confirm("Delete this chapter?")) return;
    await deleteChapter(chapterId);
    load();
  };

  if (!novel) return <p className="muted container">Loading…</p>;

  return (
    <div className="manage container">
      <Link to="/author" className="muted manage__back">‹ Back to desk</Link>
      <h2 className="font-display">{novel.title}</h2>
      <p className="muted">{chapters.length} chapters</p>

      {editingId ? (
        <div className="manage__editor card">
          <input
            className="input"
            placeholder="Chapter title"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <textarea
            className="input manage__textarea"
            placeholder="Write your chapter here. Leave a blank line between paragraphs."
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
          />
          <div className="manage__editor-actions">
            <button className="btn btn-ghost" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>
              Cancel
            </button>
            <button className="btn btn-ghost" disabled={saving} onClick={() => save(false)}>
              Save draft
            </button>
            <button className="btn btn-primary" disabled={saving} onClick={() => save(true)}>
              {saving ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-primary manage__new" onClick={startNew}>
          + Write a new chapter
        </button>
      )}

      <ul className="manage__list">
        {chapters.map((c) => (
          <li key={c._id} className="manage__list-item">
            <div>
              <p className="manage__list-title">
                {c.order}. {c.title} {c.isDraft && <span className="tag">draft</span>}
              </p>
              <p className="muted">{c.wordCount} words</p>
            </div>
            <div className="manage__list-actions">
              <button className="btn btn-ghost" onClick={() => startEdit(c._id)}>Edit</button>
              <button className="btn btn-ghost" onClick={() => remove(c._id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
