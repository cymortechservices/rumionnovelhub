import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchExternalChapter, fetchExternalChapters, fetchExternalNovel } from "../services/api";
import {
  formatChapterContent,
  normalizeChapterListItem,
  normalizeNovel,
  unwrap,
  unwrapList,
} from "../utils/externalAdapter";
import { getProgress, progressKey, saveProgress } from "../utils/progress";
import BookReader from "../components/BookReader";

// A chapter from the catalog (Nabees Novel API): /chapter/{id} returns the full text in
// data.content, /chapters?id=novelId gives previous / next.
export default function ExternalReader() {
  const { detailPath, chapterId } = useParams();
  const navigate = useNavigate();
  const key = progressKey("external", detailPath);

  const [state, setState] = useState({ loading: true, error: false, title: "", content: "", order: 0 });
  const [nav, setNav] = useState({ prev: null, next: null, total: 0 });
  const [meta, setMeta] = useState(null);
  const lastRef = useRef(null);

  // resume where this chapter was left (unless it was finished)
  const startRatio = useMemo(() => {
    const s = getProgress(key);
    return s && s.chapterId === chapterId && !s.finished ? Math.min(s.ratio || 0, 0.97) : 0;
  }, [key, chapterId]);

  useEffect(() => {
    let alive = true;
    lastRef.current = null;
    setState({ loading: true, error: false, title: "", content: "", order: 0 });
    setNav({ prev: null, next: null, total: 0 });
    fetchExternalChapter(chapterId)
      .then(async (res) => {
        const ch = unwrap(res);
        if (!alive) return;
        setState({
          loading: false,
          error: false,
          title: ch.chapterName || "Chapter",
          content: formatChapterContent(ch.content),
          order: Number(ch.seq) || 0,
        });
        if (ch.novelId) {
          const list = unwrapList(await fetchExternalChapters(ch.novelId)).map(normalizeChapterListItem);
          const idx = list.findIndex((c) => c.id === String(chapterId));
          if (alive)
            setNav({
              prev: idx > 0 ? list[idx - 1] : null,
              next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
              total: list.length,
            });
        }
      })
      .catch(() => alive && setState((s) => ({ ...s, loading: false, error: true })));
    return () => {
      alive = false;
    };
  }, [chapterId]);

  useEffect(() => {
    let alive = true;
    fetchExternalNovel(detailPath)
      .then((res) => alive && setMeta(normalizeNovel(unwrap(res))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [detailPath]);

  const flush = () => {
    const p = lastRef.current;
    if (!p || state.loading || state.error) return;
    saveProgress(key, {
      source: "external",
      novelRef: detailPath,
      title: meta?.title || "",
      cover: meta?.cover || "",
      author: meta?.author || "",
      totalChapters: nav.total || meta?.chapterCount || 0,
      chapterId: String(chapterId),
      chapterTitle: state.title,
      chapterOrder: state.order,
      ratio: p.ratio,
      finished: p.atEnd,
      next: nav.next ? { id: nav.next.id, title: nav.next.title, order: nav.next.order } : null,
    });
  };

  const onProgress = (p) => {
    lastRef.current = p;
    flush();
  };

  // novel details / neighbours arrive after the first page: refresh the saved record
  useEffect(() => {
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, nav, state.title, state.order]);

  const to = (c) => navigate(`/external/read/${encodeURIComponent(detailPath)}/${c.id}`);

  return (
    <BookReader
      chapterKey={chapterId}
      title={state.title}
      content={state.content}
      loading={state.loading}
      error={state.error}
      startRatio={startRatio}
      hasPrev={!!nav.prev}
      hasNext={!!nav.next}
      onPrevChapter={() => nav.prev && to(nav.prev)}
      onNextChapter={() => nav.next && to(nav.next)}
      onBack={() => navigate(`/external/novel/${encodeURIComponent(detailPath)}`)}
      onProgress={onProgress}
    />
  );
}
