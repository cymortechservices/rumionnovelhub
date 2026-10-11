import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchChapter, fetchChapterList } from "../services/api";
import { useReaderPrefs } from "../context/ReaderPrefsContext";
import { paginateContent } from "../utils/paginate";
import ReaderSettings from "../components/ReaderSettings";
import "./Reader.css";

const THEME_VARS = {
  parchment: { bg: "#f6efe2", text: "#14110f" },
  sepia: { bg: "#eee2c9", text: "#3a2f1d" },
  dark: { bg: "#211c2e", text: "#ece6f5" },
  midnight: { bg: "#0c0f16", text: "#c9d3e0" },
};

const FONT_STACKS = {
  Literata: '"Literata", Georgia, serif',
  Inter: '"Inter", sans-serif',
  "Atkinson Hyperlegible": '"Atkinson Hyperlegible", sans-serif',
};

export default function Reader() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { prefs, updatePrefs } = useReaderPrefs();
  const [chapter, setChapter] = useState(null);
  const [neighbours, setNeighbours] = useState({ prev: null, next: null });
  const [pageIndex, setPageIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [turning, setTurning] = useState(null); // 'forward' | 'back' | null
  const touchStartX = useRef(null);

  useEffect(() => {
    fetchChapter(chapterId).then(async ({ chapter }) => {
      setChapter(chapter);
      setPageIndex(0);
      const { chapters } = await fetchChapterList(chapter.novel._id || chapter.novel);
      const idx = chapters.findIndex((c) => c._id === chapterId);
      setNeighbours({
        prev: idx > 0 ? chapters[idx - 1] : null,
        next: idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null,
      });
    });
  }, [chapterId]);

  const pages = useMemo(() => {
    if (!chapter) return [];
    return paginateContent(chapter.content, {
      fontSize: prefs.fontSize,
      lineHeight: prefs.lineHeight,
      charsPerPage: 900,
    });
  }, [chapter, prefs.fontSize, prefs.lineHeight]);

  const theme = THEME_VARS[prefs.theme] || THEME_VARS.parchment;

  const goTo = (dir) => {
    if (dir === 1 && pageIndex < pages.length - 1) {
      setTurning("forward");
      setTimeout(() => {
        setPageIndex((p) => p + 1);
        setTurning(null);
      }, 260);
    } else if (dir === -1 && pageIndex > 0) {
      setTurning("back");
      setTimeout(() => {
        setPageIndex((p) => p - 1);
        setTurning(null);
      }, 260);
    } else if (dir === 1 && neighbours.next) {
      navigate(`/read/${neighbours.next._id}`);
    } else if (dir === -1 && neighbours.prev) {
      navigate(`/read/${neighbours.prev._id}`);
    }
  };

  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) goTo(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  if (!chapter) return <p className="muted container">Turning to your page…</p>;

  return (
    <div
      className={`reader reader--${prefs.pageTurn}`}
      style={{ "--reader-bg": theme.bg, "--reader-text": theme.text, "--reader-accent": `var(--${prefs.accent === "burgundy" ? "burgundy" : prefs.accent})` }}
    >
      <header className="reader__bar">
        <Link to={`/novel/${chapter.novel._id || chapter.novel}`} className="reader__back" aria-label="Back to novel">
          ‹
        </Link>
        <p className="reader__chapter-title">{chapter.title}</p>
        <button className="reader__gear" onClick={() => setShowSettings(true)} aria-label="Reading settings">
          Aa
        </button>
      </header>

      <div
        className="reader__stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`reader__page ${turning ? `is-turning-${turning}` : ""}`}
          style={{
            fontFamily: FONT_STACKS[prefs.fontFamily],
            fontSize: `${prefs.fontSize}px`,
            lineHeight: prefs.lineHeight,
          }}
        >
          {pages[pageIndex]?.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <button className="reader__tap-zone reader__tap-zone--left" onClick={() => goTo(-1)} aria-label="Previous page" />
        <button className="reader__tap-zone reader__tap-zone--right" onClick={() => goTo(1)} aria-label="Next page" />
      </div>

      <footer className="reader__footer">
        <button className="reader__nav-btn" onClick={() => goTo(-1)} disabled={pageIndex === 0 && !neighbours.prev}>
          ← Back
        </button>
        <span className="muted reader__progress">
          Page {pageIndex + 1} / {pages.length}
        </span>
        <button className="reader__nav-btn" onClick={() => goTo(1)} disabled={pageIndex === pages.length - 1 && !neighbours.next}>
          Next →
        </button>
      </footer>

      {showSettings && (
        <ReaderSettings prefs={prefs} onChange={updatePrefs} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
