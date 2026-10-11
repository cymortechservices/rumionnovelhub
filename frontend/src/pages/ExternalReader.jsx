import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchExternalChapters, fetchExternalChapter } from "../services/api";
import { unwrap, unwrapList, normalizeChapterListItem, formatChapterContent } from "../utils/externalAdapter";
import { useReaderPrefs } from "../context/ReaderPrefsContext";
import { paginateContent } from "../utils/paginate";
import ReaderSettings from "../components/ReaderSettings";
import "./Reader.css";

export const THEME_VARS = {
  parchment: { bg: "#f6efe2", text: "#14110f" },
  sepia: { bg: "#eee2c9", text: "#3a2f1d" },
  dark: { bg: "#211c2e", text: "#ece6f5" },
  midnight: { bg: "#0c0f16", text: "#c9d3e0" },
};
export const FONT_STACKS = {
  Literata: '"Literata", Georgia, serif',
  Inter: '"Inter", sans-serif',
  "Atkinson Hyperlegible": '"Atkinson Hyperlegible", sans-serif',
};

// Same reading experience as the platform reader (paginated pages, customizable fonts /
// colours, curl / slide / fade page turns), fed by the catalog: /chapter/{id} returns
// the whole chapter in data.content; /chapters?id=novelId gives prev/next.
export default function ExternalReader() {
  const { detailPath, chapterId } = useParams();
  const navigate = useNavigate();
  const { prefs, updatePrefs } = useReaderPrefs();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [neighbours, setNeighbours] = useState({ prev: null, next: null });
  const [pageIndex, setPageIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [turning, setTurning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(false); setPageIndex(0);
    fetchExternalChapter(chapterId)
      .then(async (res) => {
        const ch = unwrap(res);
        if (!alive) return;
        setTitle(ch.chapterName || "Chapter");
        setContent(formatChapterContent(ch.content));
        setLoading(false);
        if (ch.novelId) {
          const list = unwrapList(await fetchExternalChapters(ch.novelId)).map(normalizeChapterListItem);
          const idx = list.findIndex((c) => c.id === String(chapterId));
          if (alive) setNeighbours({
            prev: idx > 0 ? list[idx - 1] : null,
            next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
          });
        }
      })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, [chapterId]);

  const pages = useMemo(
    () => (content ? paginateContent(content, { fontSize: prefs.fontSize, lineHeight: prefs.lineHeight, charsPerPage: 900 }) : [""]),
    [content, prefs.fontSize, prefs.lineHeight]
  );

  const theme = THEME_VARS[prefs.theme] || THEME_VARS.parchment;
  const chapterTo = (c) => `/external/read/${encodeURIComponent(detailPath)}/${c.id}`;

  const goTo = (dir) => {
    if (turning) return;
    if (dir === 1 && pageIndex < pages.length - 1) {
      setTurning("forward");
      setTimeout(() => { setPageIndex((p) => p + 1); setTurning(null); }, 260);
    } else if (dir === -1 && pageIndex > 0) {
      setTurning("back");
      setTimeout(() => { setPageIndex((p) => p - 1); setTurning(null); }, 260);
    } else if (dir === 1 && neighbours.next) navigate(chapterTo(neighbours.next));
    else if (dir === -1 && neighbours.prev) navigate(chapterTo(neighbours.prev));
  };

  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const d = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(d) > 50) goTo(d < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") goTo(1);
      if (e.key === "ArrowLeft") goTo(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const style = { "--reader-bg": theme.bg, "--reader-text": theme.text };

  if (error) {
    return (
      <div className="reader" style={style}>
        <header className="reader__bar">
          <Link to={`/external/novel/${encodeURIComponent(detailPath)}`} className="reader__back">‹</Link>
        </header>
        <p className="container" style={{ padding: 24 }}>This chapter couldn't be loaded. Try again in a moment.</p>
      </div>
    );
  }

  return (
    <div className={`reader reader--${prefs.pageTurn}`} style={style}>
      <header className="reader__bar">
        <Link to={`/external/novel/${encodeURIComponent(detailPath)}`} className="reader__back" aria-label="Back to novel">‹</Link>
        <p className="reader__chapter-title">{title}</p>
        <button className="reader__gear" onClick={() => setShowSettings(true)} aria-label="Reading settings">Aa</button>
      </header>

      <div className="reader__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {loading ? (
          <div className="reader__page"><p>Turning to your page…</p></div>
        ) : (
          <div
            className={`reader__page ${turning ? `is-turning-${turning}` : ""}`}
            style={{ fontFamily: FONT_STACKS[prefs.fontFamily], fontSize: `${prefs.fontSize}px`, lineHeight: prefs.lineHeight }}
          >
            {pages[pageIndex]?.split("\n\n").map((para, i) =>
              para.startsWith("§ ") ? <p key={i} className="reader__scene">{para.slice(2)}</p> : <p key={i}>{para}</p>
            )}
          </div>
        )}
        <button className="reader__tap-zone reader__tap-zone--left" onClick={() => goTo(-1)} aria-label="Previous page" />
        <button className="reader__tap-zone reader__tap-zone--right" onClick={() => goTo(1)} aria-label="Next page" />
      </div>

      <footer className="reader__footer">
        <button className="reader__nav-btn" onClick={() => goTo(-1)} disabled={pageIndex === 0 && !neighbours.prev}>← Back</button>
        <span className="reader__progress">Page {pageIndex + 1} / {pages.length}</span>
        <button className="reader__nav-btn" onClick={() => goTo(1)} disabled={pageIndex >= pages.length - 1 && !neighbours.next}>
          {pageIndex >= pages.length - 1 && neighbours.next ? "Next chapter →" : "Next →"}
        </button>
      </footer>

      {showSettings && <ReaderSettings prefs={prefs} onChange={updatePrefs} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
