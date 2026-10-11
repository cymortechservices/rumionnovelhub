// Normalizers for the Nabees Novel API (novel-api.nabaikabaiaguo.workers.dev).
// Every response is { code, message, data }. Shapes (verified against the live API):
//   lists:    data.contentList (featured) | data.list (search/genre/rankings), data.pager
//   novel:    data = { novelId, title, summary, cover:{url}, score:"6.8", totalViews:"349.5K",
//             totalChapters, genres:[str], tags:[str], author, detailPath, novelStatusDesc }
//   chapters: data.chapterList = [{ chapterId, chapterName, seq, totalWords, fileUrl }]
//   chapter:  data = { chapterId, chapterName, seq, novelId, content }  ("\n"-separated lines)

const ADULT_RE = /age rating:\s*18\+/i;

export const unwrap = (res) => res?.data ?? res ?? {};

export function unwrapList(res) {
  const d = unwrap(res);
  return d.contentList || d.list || d.chapterList || (Array.isArray(d) ? d : []);
}

export function unwrapPager(res) {
  return unwrap(res).pager || { hasMore: false };
}

export function normalizeNovel(raw) {
  if (!raw || !raw.novelId) return null;
  const score = Number(raw.score) || 0;
  const summary = raw.summary || "";
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  return {
    id: String(raw.novelId),
    detailPath: raw.detailPath,
    title: raw.title || "Untitled",
    cover: raw.cover?.url || "",
    synopsis: summary,
    author: raw.author || "Unknown",
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    tags,
    status: raw.novelStatusDesc || "Novel",
    rating: Math.round((score / 2) * 10) / 10, // API scores out of 10 -> 5-star scale
    views: raw.totalViews || "",
    words: raw.totalWordsFormat || "",
    chapterCount: Number(raw.totalChapters) || 0,
    isMature: ADULT_RE.test(summary) || tags.some((t) => /^18\+$/.test(t)),
  };
}

export function normalizeChapterListItem(raw, index) {
  return {
    id: String(raw.chapterId),
    title: raw.chapterName || `Chapter ${index + 1}`,
    order: Number(raw.seq) || index + 1,
    words: raw.totalWords || 0,
  };
}

// Chapter body -> paragraphs separated by blank lines. Lines wrapped in ^carets^ are
// scene/time headers in the source; they become "§ text" lines which the reader
// renders as centered scene breaks.
export function formatChapterContent(content = "") {
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^\^(.+)\^$/);
      return m ? `§ ${m[1]}` : l;
    })
    .join("\n\n");
}

// Map catalog genre names onto Rumion's own genre keys (used when a catalog novel is
// mirrored into MongoDB for comments / ratings / favorites).
export function toRumionGenres(novel) {
  const out = new Set();
  novel.genres.forEach((g) => {
    const s = g.toLowerCase();
    if (s.includes("romance")) out.add("romance");
    else if (s.includes("fantasy")) out.add("fantasy");
    else if (s.includes("sci")) out.add("sci-fi");
    else if (s.includes("horror")) out.add("horror");
    else if (s.includes("mystery")) out.add("mystery");
    else if (s.includes("game") || s.includes("military")) out.add("action");
    else out.add("fiction");
  });
  if (novel.isMature) out.add("18+");
  return [...out];
}
