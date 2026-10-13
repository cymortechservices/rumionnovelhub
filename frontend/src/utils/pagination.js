// Measured pagination: a chapter is split into pages by actually laying text out in a hidden
// copy of the page and asking the browser whether it fits. Nothing is estimated from character
// counts, so no words are ever clipped on small phones, big fonts or wide desktops.

// Chapter text -> { paras, words }.  words is a flat list of { w, p } (word, paragraph index)
// so a page is just a [start, end) range and can start/stop mid-paragraph.
export function tokenize(content = "") {
  let text = String(content || "");
  if (/<\/?(p|br|div|span|em|strong|i|b|h[1-6])\b[^>]*>/i.test(text)) {
    text = text
      .replace(/<\/(p|div|h[1-6])>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }
  const paras = [];
  const words = [];
  text.split(/\r?\n+/).forEach((line) => {
    let t = line.trim();
    if (!t) return;
    let scene = false;
    if (t.startsWith("§ ")) {
      scene = true;
      t = t.slice(2);
    }
    const ws = t.split(/\s+/).filter(Boolean);
    if (!ws.length) return;
    const p = paras.length;
    paras.push({ scene });
    ws.forEach((w) => words.push({ w, p }));
  });
  return { paras, words };
}

// A [start, end) word range -> paragraphs to render ({ scene, text }).
export function sliceToParagraphs(doc, start, end) {
  const out = [];
  let cur = null;
  for (let i = start; i < end; i++) {
    const { w, p } = doc.words[i];
    if (!cur || cur.p !== p) {
      cur = { p, scene: doc.paras[p].scene, parts: [w] };
      out.push(cur);
    } else cur.parts.push(w);
  }
  return out.map((c) => ({ scene: c.scene, text: c.parts.join(" ") }));
}

// Split `total` words into pages. fits(start, end) must say whether words[start..end) fit on one
// page. Uses doubling + binary search (about 2*log2(n) layout checks per page). Always makes
// progress: a page holds at least one word.
export function buildPages(total, fits, hint = 120) {
  const pages = [];
  let i = 0;
  let guess = Math.max(1, hint);
  while (i < total) {
    const maxK = total - i;
    const k = Math.min(guess, maxK);
    let lo = 0;
    let hi = null; // smallest count known NOT to fit
    if (fits(i, i + k)) {
      lo = k;
      while (lo < maxK) {
        const nk = Math.min(lo * 2, maxK);
        if (fits(i, i + nk)) lo = nk;
        else {
          hi = nk;
          break;
        }
      }
    } else {
      hi = k;
      while (hi > 1) {
        const nk = Math.floor(hi / 2);
        if (fits(i, i + nk)) {
          lo = nk;
          break;
        }
        hi = nk;
      }
    }
    if (hi !== null) {
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (fits(i, i + mid)) lo = mid;
        else hi = mid;
      }
    }
    const take = Math.max(1, lo);
    pages.push({ start: i, end: i + take });
    i += take;
    guess = take;
  }
  return pages;
}

export const pageIndexForWord = (pages, word) => {
  if (!pages.length) return 0;
  const i = pages.findIndex((p) => word >= p.start && word < p.end);
  return i === -1 ? (word >= pages[pages.length - 1].end ? pages.length - 1 : 0) : i;
};
