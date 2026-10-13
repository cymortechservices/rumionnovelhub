import { useEffect, useState } from "react";
import { local } from "./store";

// Reading progress lives on this device (localStorage), one record per novel:
// { key, source: "external" | "original", novelRef, title, cover, author, chapterId, chapterTitle,
//   chapterOrder, ratio (0..1 through the chapter), finished, next: {id,title,order}|null,
//   totalChapters, updatedAt }
const KEY = "rumion_progress_v1";
const MAX = 30;
const EVENT = "rumion-progress";

function read() {
  try {
    const d = JSON.parse(local.get(KEY, "{}"));
    return d && typeof d === "object" ? d : {};
  } catch {
    return {};
  }
}

function write(data) {
  local.set(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(EVENT));
}

export const progressKey = (source, ref) => `${source === "external" ? "ext" : "own"}:${ref}`;

export const getProgress = (key) => read()[key] || null;

export const listProgress = () => Object.values(read()).sort((a, b) => b.updatedAt - a.updatedAt);

// A novel is "in progress" unless its last chapter was finished and there is nothing after it.
export const isActive = (p) => !(p.finished && !p.next);
export const listContinue = () => listProgress().filter(isActive);

export function saveProgress(key, patch) {
  const data = read();
  data[key] = { ...(data[key] || {}), ...patch, key, updatedAt: Date.now() };
  const keys = Object.keys(data);
  if (keys.length > MAX) {
    keys
      .sort((a, b) => data[b].updatedAt - data[a].updatedAt)
      .slice(MAX)
      .forEach((k) => delete data[k]);
  }
  write(data);
}

export function removeProgress(key) {
  const data = read();
  delete data[key];
  write(data);
}

export const clearProgress = () => write({});

// 0..1 through the whole novel
export function overallProgress(p) {
  const total = p.totalChapters || 0;
  if (!total) return p.finished ? 1 : p.ratio || 0;
  const done = Math.max(0, (p.chapterOrder || 1) - 1) + (p.finished ? 1 : p.ratio || 0);
  return Math.min(1, Math.max(0, done / total));
}

// Where "Continue reading" should take the reader: the same spot, or the next chapter if they
// had already reached the end of the one they were on.
export function resumeTarget(p) {
  if (p.finished && p.next) return { id: p.next.id, title: p.next.title, order: p.next.order };
  return { id: p.chapterId, title: p.chapterTitle, order: p.chapterOrder };
}

export function resumeLink(p) {
  const t = resumeTarget(p);
  return p.source === "external"
    ? `/external/read/${encodeURIComponent(p.novelRef)}/${t.id}`
    : `/read/${t.id}`;
}

export function useProgressList(onlyActive = true) {
  const [items, setItems] = useState(() => (onlyActive ? listContinue() : listProgress()));
  useEffect(() => {
    const refresh = () => setItems(onlyActive ? listContinue() : listProgress());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [onlyActive]);
  return items;
}

// "Chapter 2, The Storm" without doubling up when the title already starts with "Chapter 2"
export function chapterLabel(order, title) {
  const t = (title || "").trim();
  if (/^(chapter|ch\.?)\s*\d+/i.test(t)) return t;
  const n = order ? `Chapter ${order}` : "Chapter";
  return t ? `${n}, ${t}` : n;
}
