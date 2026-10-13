import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChapter, fetchChapterList } from "../services/api";
import { getProgress, progressKey, saveProgress } from "../utils/progress";
import BookReader from "../components/BookReader";

// A chapter written by a Rumion author (stored in our own database).
export default function Reader() {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: true, error: false, chapter: null });
  const [nav, setNav] = useState({ prev: null, next: null, total: 0 });
  const lastRef = useRef(null);

  const novel = state.chapter?.novel;
  const novelId = novel?._id || novel || null;
  const key = novelId ? progressKey("original", novelId) : null;

  const startRatio = useMemo(() => {
    if (!key) return 0;
    const s = getProgress(key);
    return s && s.chapterId === chapterId && !s.finished ? Math.min(s.ratio || 0, 0.97) : 0;
  }, [key, chapterId]);

  useEffect(() => {
    let alive = true;
    lastRef.current = null;
    setState({ loading: true, error: false, chapter: null });
    setNav({ prev: null, next: null, total: 0 });
    fetchChapter(chapterId)
      .then(async ({ chapter }) => {
        if (!alive) return;
        setState({ loading: false, error: false, chapter });
        const id = chapter.novel?._id || chapter.novel;
        const { chapters } = await fetchChapterList(id);
        const idx = chapters.findIndex((c) => c._id === chapterId);
        if (alive)
          setNav({
            prev: idx > 0 ? chapters[idx - 1] : null,
            next: idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null,
            total: chapters.length,
          });
      })
      .catch(() => alive && setState({ loading: false, error: true, chapter: null }));
    return () => {
      alive = false;
    };
  }, [chapterId]);

  const flush = () => {
    const p = lastRef.current;
    const ch = state.chapter;
    if (!p || !ch || !key) return;
    saveProgress(key, {
      source: "original",
      novelRef: String(novelId),
      title: novel?.title || "",
      cover: novel?.coverUrl || "",
      author: novel?.authorName || "",
      totalChapters: nav.total || novel?.chapterCount || 0,
      chapterId: String(chapterId),
      chapterTitle: ch.title,
      chapterOrder: ch.order,
      ratio: p.ratio,
      finished: p.atEnd,
      next: nav.next ? { id: nav.next._id, title: nav.next.title, order: nav.next.order } : null,
    });
  };

  const onProgress = (p) => {
    lastRef.current = p;
    flush();
  };

  useEffect(() => {
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, state.chapter]);

  return (
    <BookReader
      chapterKey={chapterId}
      title={state.chapter?.title || ""}
      content={state.chapter?.content || ""}
      loading={state.loading}
      error={state.error}
      startRatio={startRatio}
      hasPrev={!!nav.prev}
      hasNext={!!nav.next}
      onPrevChapter={() => nav.prev && navigate(`/read/${nav.prev._id}`)}
      onNextChapter={() => nav.next && navigate(`/read/${nav.next._id}`)}
      onBack={() => navigate(novelId ? `/novel/${novelId}` : "/")}
      onProgress={onProgress}
    />
  );
}
