// Splits chapter HTML (paragraphs) into "pages" sized to roughly fill one
// screen at the reader's current font settings. This is an approximation
// (real print-quality pagination needs a full text-measurement pass) but it
// keeps page turns fast and consistent with whatever font/size the reader picks.
export function paginateContent(html, { fontSize, lineHeight, charsPerPage }) {
  if (!html) return [""];

  const paragraphs = html
    .split(/\n{2,}|<\/p>/i)
    .map((p) => p.replace(/<p[^>]*>/i, "").trim())
    .filter(Boolean);

  // Bigger font/line-height => fewer characters fit per screen.
  const scale = (19 / fontSize) * (1.7 / lineHeight);
  const budget = Math.max(400, Math.round(charsPerPage * scale));

  const pages = [];
  let current = [];
  let count = 0;

  paragraphs.forEach((p) => {
    const len = p.length;
    if (count + len > budget && current.length > 0) {
      pages.push(current.join("\n\n"));
      current = [];
      count = 0;
    }
    current.push(p);
    count += len;
  });
  if (current.length) pages.push(current.join("\n\n"));

  return pages.length ? pages : [html];
}
