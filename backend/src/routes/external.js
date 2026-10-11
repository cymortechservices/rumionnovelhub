// Proxy over the Nabees Novel API (novel-api.nabaikabaiaguo.workers.dev).
// All real catalog content (covers, summaries, chapter lists, chapter text) comes
// from here. Proxying keeps the third-party URL out of the browser, avoids CORS,
// and lets us cache hot responses so Render's free tier stays snappy.
const express = require("express");
const asyncHandler = require("express-async-handler");
const fetch = require("node-fetch");

const router = express.Router();
const BASE = process.env.EXTERNAL_NOVEL_API || "https://novel-api.nabaikabaiaguo.workers.dev";

const cache = new Map(); // path -> { at, status, body }
const TTL = 5 * 60 * 1000;
const MAX_ENTRIES = 500;

async function proxy(path, res) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) {
    return res.status(hit.status).json(hit.body);
  }
  const r = await fetch(`${BASE}${path}`, { timeout: 20000 });
  const text = await r.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { code: -1, message: "Upstream returned a non-JSON response." };
  }
  if (r.ok) {
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(path, { at: Date.now(), status: r.status, body });
  }
  res.status(r.status).json(body);
}

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

router.get("/search", asyncHandler(async (req, res) => {
  const { q = "", p, l } = req.query;
  await proxy(`/search?q=${encodeURIComponent(q)}&p=${num(p, 1)}&l=${num(l, 20)}`, res);
}));

router.get("/genre/:id", asyncHandler(async (req, res) => {
  const { p, l, status = "", sort = "" } = req.query;
  const id = encodeURIComponent(req.params.id);
  await proxy(`/genre/${id}?p=${num(p, 1)}&l=${num(l, 20)}&status=${encodeURIComponent(status)}&sort=${encodeURIComponent(sort)}`, res);
}));

router.get("/novel/:detailPath", asyncHandler(async (req, res) => {
  await proxy(`/novel/${encodeURIComponent(req.params.detailPath)}`, res);
}));

router.get("/chapters", asyncHandler(async (req, res) => {
  const { id, order = "ASC", p, l } = req.query;
  if (!id) return res.status(400).json({ message: "id (novelId) is required." });
  await proxy(`/chapters?id=${encodeURIComponent(id)}&order=${order === "DESC" ? "DESC" : "ASC"}&p=${num(p, 1)}&l=${num(l, 500)}`, res);
}));

// Full chapter incl. data.content (the body text)
router.get("/chapter/:id", asyncHandler(async (req, res) => {
  await proxy(`/chapter/${encodeURIComponent(req.params.id)}`, res);
}));

router.get("/recommend", asyncHandler(async (req, res) => {
  const { id, p, l } = req.query;
  await proxy(`/recommend?id=${encodeURIComponent(id || "")}&p=${num(p, 1)}&l=${num(l, 20)}`, res);
}));

router.get("/featured", asyncHandler(async (req, res) => {
  const { p, l } = req.query;
  await proxy(`/featured?p=${num(p, 1)}&l=${num(l, 20)}`, res);
}));

router.get("/rankings", asyncHandler(async (req, res) => {
  const { rank, p, l } = req.query;
  await proxy(`/rankings?rank=${[1, 2, 3].includes(Number(rank)) ? Number(rank) : 1}&p=${num(p, 1)}&l=${num(l, 20)}`, res);
}));

module.exports = router;
