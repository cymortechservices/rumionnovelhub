import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReaderPrefs } from "../context/ReaderPrefsContext";
import { FONT_STACKS, getAccentHex, getReaderTheme } from "../constants/readerThemes";
import { buildPages, pageIndexForWord, sliceToParagraphs, tokenize } from "../utils/pagination";
import ReaderSettings from "./ReaderSettings";
import "./BookReader.css";

const DURATION = { curl: 560, slide: 340, fade: 280 };

const reducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

function Face({ paras, style, className = "", children }) {
  return (
    <div className={`reader__page ${className}`} style={style}>
      {paras.map((p, i) =>
        p.scene ? (
          <p key={i} className="reader__scene">
            {p.text}
          </p>
        ) : (
          <p key={i}>{p.text}</p>
        )
      )}
      {children}
    </div>
  );
}

// One reading surface for every chapter in the app (catalog and platform novels).
//  - Pages are measured, not estimated: text is laid out in a hidden copy of the page and split
//    exactly where it stops fitting, so nothing is ever clipped on any screen or font size.
//  - Turning a page works like a real book: the page hinges on its left edge (the spine) and
//    swings over to the left when you go forward; going back swings it in from the left.
//    Drag with a finger/mouse to peel it, or tap the edges / use the arrow keys / buttons.
export default function BookReader({
  chapterKey,
  title,
  content,
  loading = false,
  error = false,
  startRatio = 0,
  hasPrev = false,
  hasNext = false,
  onPrevChapter,
  onNextChapter,
  onBack,
  onProgress,
}) {
  const { prefs, updatePrefs, resetPrefs } = useReaderPrefs();
  const theme = getReaderTheme(prefs);
  const accent = getAccentHex(prefs);
  const mode = prefs.pageTurn;
  const scrollMode = prefs.readMode === "scroll";

  const stageRef = useRef(null);
  const measureRef = useRef(null);
  const leafRef = useRef(null);
  const shadeRef = useRef(null);
  const lightRef = useRef(null);
  const scrollRef = useRef(null);
  const scrolledKey = useRef(null);

  const doc = useMemo(() => tokenize(content), [content]);
  const docKey = `${chapterKey}|${doc.words.length}`;

  const [pagesInfo, setPagesInfo] = useState({ k: null, list: [] });
  const pages = pagesInfo.k === docKey ? pagesInfo.list : [];
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [fontsTick, setFontsTick] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const wordRef = useRef(0); // first word of the page being read; survives re-pagination
  const keyRef = useRef(null);
  const pRef = useRef(0); // turn progress 0..1 of the moving page
  const rafRef = useRef(0);
  const dragRef = useRef(null);
  const flipRef = useRef(null);
  flipRef.current = flip;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const progressCb = useRef(onProgress);
  progressCb.current = onProgress;

  const pageStyle = {
    fontFamily: FONT_STACKS[prefs.fontFamily] || FONT_STACKS.Literata,
    fontSize: `${prefs.fontSize}px`,
    lineHeight: prefs.lineHeight,
  };

  // ---- size of the reading area (re-paginate when the phone rotates / toolbar collapses) ----
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    let t;
    const read = () =>
      setSize((s) => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        return s.w === w && s.h === h ? s : { w, h };
      });
    read();
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(read, 120);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  // web fonts change text width once they arrive, so measure again
  useEffect(() => {
    let alive = true;
    const bump = () => alive && setFontsTick((n) => n + 1);
    try {
      document.fonts?.ready?.then(bump);
      document.fonts?.addEventListener?.("loadingdone", bump);
    } catch {
      /* older browsers */
    }
    return () => {
      alive = false;
      try {
        document.fonts?.removeEventListener?.("loadingdone", bump);
      } catch {
        /* ignore */
      }
    };
  }, []);

  // ---- measured pagination ----
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (loading || error || !el || !size.w) return;

    if (keyRef.current !== docKey) {
      keyRef.current = docKey;
      cancelAnimationFrame(rafRef.current);
      setFlip(null);
      wordRef.current = Math.min(
        Math.floor((startRatio || 0) * doc.words.length),
        Math.max(0, doc.words.length - 1)
      );
    }
    if (!doc.words.length) {
      setPagesInfo({ k: docKey, list: [] });
      setIndex(0);
      return;
    }

    const padBottom = parseFloat(getComputedStyle(el).paddingBottom) || 0;
    const limit = el.getBoundingClientRect().bottom - padBottom;
    const sentinel = document.createElement("div");
    sentinel.className = "reader__sentinel";
    const fits = (a, b) => {
      el.textContent = "";
      const frag = document.createDocumentFragment();
      sliceToParagraphs(doc, a, b).forEach((p) => {
        const n = document.createElement("p");
        if (p.scene) n.className = "reader__scene";
        n.textContent = p.text;
        frag.appendChild(n);
      });
      frag.appendChild(sentinel);
      el.appendChild(frag);
      return sentinel.getBoundingClientRect().top <= limit + 0.5;
    };

    const built = buildPages(doc.words.length, fits, 150);
    el.textContent = "";
    setPagesInfo({ k: docKey, list: built });
    setIndex(pageIndexForWord(built, wordRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey, doc, loading, error, size.w, size.h, prefs.fontFamily, prefs.fontSize, prefs.lineHeight, fontsTick, scrollMode]);

  // remember where we are + tell the parent (used for "Continue reading")
  useEffect(() => {
    const page = pages[index];
    if (!page || scrollMode) return;
    wordRef.current = page.start;
    progressCb.current?.({
      ratio: page.start / Math.max(1, doc.words.length),
      atEnd: index === pages.length - 1,
      page: index + 1,
      pages: pages.length,
    });
  }, [index, pages, doc, scrollMode]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // ---- scroll mode: native vertical scrolling in both directions ----
  const allParas = useMemo(() => (scrollMode ? sliceToParagraphs(doc, 0, doc.words.length) : []), [scrollMode, doc]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!scrollMode || loading || error || !el || !doc.words.length) {
      if (!scrollMode) scrolledKey.current = null;
      return;
    }
    const k = `${docKey}`;
    if (scrolledKey.current === k) return;
    scrolledKey.current = k;
    const ratio = wordRef.current / Math.max(1, doc.words.length);
    el.scrollTop = ratio * Math.max(0, el.scrollHeight - el.clientHeight);
  }, [scrollMode, loading, error, docKey, doc, size.w, pages.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || scrolledKey.current !== docKey) return;
    const max = Math.max(1, el.scrollHeight - el.clientHeight);
    const r = Math.min(1, Math.max(0, el.scrollTop / max));
    wordRef.current = Math.floor(r * Math.max(0, doc.words.length - 1));
    setScrollPct(r * 100);
    clearTimeout(scrollT.current);
    scrollT.current = setTimeout(() => {
      progressCb.current?.({ ratio: r, atEnd: r > 0.97, page: Math.round(r * 100), pages: 100 });
    }, 250);
  };
  const [scrollPct, setScrollPct] = useState(0);
  const scrollT = useRef(0);
  useEffect(() => () => clearTimeout(scrollT.current), []);

  // lock the page behind the reader so it never scrolls or bounces under it
  useEffect(() => {
    const b = document.body;
    const prev = [b.style.overflow, b.style.overscrollBehavior];
    b.style.overflow = "hidden";
    b.style.overscrollBehavior = "none";
    return () => {
      b.style.overflow = prev[0];
      b.style.overscrollBehavior = prev[1];
    };
  }, []);

  // ---- turning ----
  const applyP = (p) => {
    const m = modeRef.current;
    const s = Math.sin(Math.PI * p);
    const leaf = leafRef.current;
    if (leaf) {
      if (m === "curl") leaf.style.transform = `rotateY(${-180 * p}deg)`;
      else if (m === "slide") leaf.style.transform = `translate3d(${-100 * p}%,0,0)`;
      else leaf.style.opacity = String(1 - p);
    }
    if (shadeRef.current) shadeRef.current.style.opacity = String(m === "curl" ? 0.4 * s : m === "slide" ? 0.22 * (1 - p) : 0);
    if (lightRef.current) lightRef.current.style.opacity = String(m === "curl" ? 0.3 * s : 0);
  };

  const runTo = (to, ms, done) => {
    cancelAnimationFrame(rafRef.current);
    const from = pRef.current;
    const t0 = performance.now();
    if (from === to || ms <= 0) {
      pRef.current = to;
      applyP(to);
      done();
      return;
    }
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const p = from + (to - from) * e;
      pRef.current = p;
      applyP(p);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else done();
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const finish = (commitIdx) => {
    if (commitIdx !== null && commitIdx !== undefined) setIndex(commitIdx);
    setFlip(null);
  };

  // layers mount -> put the moving page at its starting position, then animate if automatic
  useLayoutEffect(() => {
    if (!flip) return;
    if (flip.auto) pRef.current = flip.p0;
    applyP(pRef.current);
    if (flip.auto) runTo(flip.to, DURATION[modeRef.current], () => finish(flip.commit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip]);

  const lastPage = pages.length - 1;
  const canPrev = index > 0 || hasPrev;
  const canNext = index < lastPage || hasNext;

  const turnInstant = (dir) => {
    if (dir === "next") {
      if (index < lastPage) setIndex(index + 1);
      else if (hasNext) onNextChapter?.();
    } else if (index > 0) setIndex(index - 1);
    else if (hasPrev) onPrevChapter?.();
  };

  const turn = (dir) => {
    if (flipRef.current || loading || error || !pages.length) return;
    const inChapter = dir === "next" ? index < lastPage : index > 0;
    if (!inChapter || reducedMotion()) return turnInstant(dir);
    setFlip({
      dir,
      auto: true,
      p0: dir === "next" ? 0 : 1,
      to: dir === "next" ? 1 : 0,
      commit: dir === "next" ? index + 1 : index - 1,
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (showSettings || scrollMode) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") turn("next");
      if (e.key === "ArrowLeft" || e.key === "PageUp") turn("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---- touch / mouse: drag to peel the page, tap the edges to turn ----
  const onPointerDown = (e) => {
    if (scrollMode || loading || error || showSettings || flipRef.current || !pages.length) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      w: stageRef.current.clientWidth,
      dir: null,
      visual: false,
      commit: null,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.dir) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null; // a vertical gesture, not a page turn
        return;
      }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      d.dir = dx < 0 ? "next" : "prev";
      const inChapter = d.dir === "next" ? index < lastPage : index > 0;
      d.visual = inChapter && !reducedMotion();
      d.commit = d.dir === "next" ? index + 1 : index - 1;
      try {
        stageRef.current.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (d.visual) setFlip({ dir: d.dir, auto: false, p0: d.dir === "next" ? 0 : 1, to: null, commit: d.commit });
    }
    if (d.visual) {
      const toward = d.dir === "next" ? -dx : dx;
      const prog = Math.max(0, Math.min(1, toward / (d.w * 0.85)));
      pRef.current = d.dir === "next" ? prog : 1 - prog;
      applyP(pRef.current);
    }
  };

  const endDrag = (e, cancelled) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    try {
      stageRef.current.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const dx = e.clientX - d.x;

    if (!d.dir) {
      // a tap: left edge = back, right edge = forward, middle does nothing
      if (!cancelled && Math.abs(dx) < 10 && Math.abs(e.clientY - d.y) < 10) {
        const r = stageRef.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        if (x < 0.3) turn("prev");
        else if (x > 0.7) turn("next");
      }
      return;
    }

    const toward = d.dir === "next" ? -dx : dx;
    const fast = Math.abs(dx) / Math.max(1, performance.now() - d.t) > 0.5 && toward > 30;
    const commit = !cancelled && (toward > d.w * 0.25 || fast);

    if (!d.visual) {
      if (commit) turnInstant(d.dir);
      return;
    }
    const full = d.dir === "next" ? 1 : 0;
    const back = d.dir === "next" ? 0 : 1;
    if (commit) runTo(full, DURATION[modeRef.current] * 0.6, () => finish(d.commit));
    else runTo(back, DURATION[modeRef.current] * 0.5, () => finish(null));
  };

  // ---- render ----
  const paras = (i) => (pages[i] ? sliceToParagraphs(doc, pages[i].start, pages[i].end) : []);
  const underIdx = flip ? (flip.dir === "next" ? index + 1 : index) : null;
  const leafIdx = flip ? (flip.dir === "next" ? index : index - 1) : null;
  const empty = !loading && !error && doc.words.length === 0;
  const meter = scrollMode ? scrollPct : pages.length ? ((index + 1) / pages.length) * 100 : 0;

  let body;
  if (scrollMode && !error && !loading && !empty) {
    body = (
      <div className="reader__scroll" ref={scrollRef} onScroll={onScroll} style={pageStyle}>
        <div className="reader__scroll-inner">
          {allParas.map((p, i) =>
            p.scene ? (
              <p key={i} className="reader__scene">
                {p.text}
              </p>
            ) : (
              <p key={i}>{p.text}</p>
            )
          )}
          <div className="reader__scroll-end">
            {hasNext ? (
              <button className="reader__nav-btn" onClick={() => onNextChapter?.()}>
                Next chapter
              </button>
            ) : (
              <span>The end of what's here</span>
            )}
          </div>
        </div>
      </div>
    );
  } else if (error) {
    body = (
      <div className="reader__page reader__notice" style={pageStyle}>
        <p>This chapter couldn't be loaded. Check your connection and try again in a moment.</p>
      </div>
    );
  } else if (empty) {
    body = (
      <div className="reader__page reader__notice" style={pageStyle}>
        <p>This chapter is empty.</p>
      </div>
    );
  } else if (loading || !pages.length) {
    body = (
      <div className="reader__page reader__notice" style={pageStyle}>
        <p>Turning to your page…</p>
      </div>
    );
  } else if (flip) {
    body = (
      <>
        <Face paras={paras(underIdx)} style={pageStyle} />
        <div className="reader__shade" ref={shadeRef} />
        <div className={`reader__leaf reader__leaf--${mode}`} ref={leafRef}>
          <Face className="reader__leaf-front" paras={paras(leafIdx)} style={pageStyle}>
            <div className="reader__leaf-light" ref={lightRef} />
          </Face>
          {mode === "curl" && <div className="reader__leaf-back" />}
        </div>
      </>
    );
  } else {
    body = <Face paras={paras(index)} style={pageStyle} />;
  }

  return (
    <div
      className={`reader reader--${mode}`}
      style={{ "--reader-bg": theme.bg, "--reader-text": theme.text, "--reader-accent": accent }}
    >
      <header className="reader__bar">
        <button className="reader__icon-btn" onClick={onBack} aria-label="Back to novel">
          ‹
        </button>
        <p className="reader__chapter-title">{title}</p>
        <button
          className="reader__icon-btn reader__mode"
          onClick={() => updatePrefs({ readMode: scrollMode ? "pages" : "scroll" })}
          aria-label={scrollMode ? "Switch to page turning" : "Switch to scrolling"}
          title={scrollMode ? "Turn pages" : "Scroll"}
        >
          {scrollMode ? "▤" : "↕"}
        </button>
        <button className="reader__icon-btn reader__gear" onClick={() => setShowSettings(true)} aria-label="Reading settings">
          Aa
        </button>
      </header>

      <div
        className="reader__stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerCancel={(e) => endDrag(e, true)}
      >
        <div className={`reader__book ${scrollMode ? "reader__book--scroll" : ""}`}>
          <div className="reader__page reader__measure" ref={measureRef} style={pageStyle} aria-hidden="true" />
          {body}
        </div>
      </div>

      <footer className="reader__footer">
        <div className="reader__meter" aria-hidden="true">
          <span style={{ width: `${meter}%` }} />
        </div>
        {scrollMode ? (
          <>
            <button className="reader__nav-btn" onClick={() => onPrevChapter?.()} disabled={!hasPrev}>
              Previous chapter
            </button>
            <span className="reader__progress">{Math.round(scrollPct)}%</span>
            <button className="reader__nav-btn" onClick={() => onNextChapter?.()} disabled={!hasNext}>
              Next chapter
            </button>
          </>
        ) : (
          <>
            <button className="reader__nav-btn" onClick={() => turn("prev")} disabled={!canPrev}>
              {index === 0 && hasPrev ? "Previous chapter" : "Back"}
            </button>
            <span className="reader__progress">{pages.length ? `Page ${index + 1} of ${pages.length}` : ""}</span>
            <button className="reader__nav-btn" onClick={() => turn("next")} disabled={!canNext}>
              {index === lastPage && hasNext ? "Next chapter" : "Next"}
            </button>
          </>
        )}
      </footer>

      {showSettings && (
        <ReaderSettings
          prefs={prefs}
          onChange={updatePrefs}
          onReset={resetPrefs}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
