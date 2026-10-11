const express = require("express");
const asyncHandler = require("express-async-handler");
const Novel = require("../models/Novel");
const Chapter = require("../models/Chapter");
const { protect, requireAuthor } = require("../middleware/auth");
const { uploadCover } = require("../config/cloudinary");

const router = express.Router();

// GET /api/novels?genre=&status=&sort=trending|new|top&q=&page=&limit=&mature=false
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { genre, status, q, page = 1, limit = 20, mature } = req.query;
    const filter = {};
    if (genre) filter.genres = genre;
    if (status) filter.status = status;
    if (mature === "false") filter.isMature = false;
    if (q) filter.$text = { $search: q };

    let sort = { createdAt: -1 };
    if (req.query.sort === "trending") sort = { views: -1, ratingAverage: -1 };
    if (req.query.sort === "top") sort = { ratingAverage: -1, ratingCount: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [novels, total] = await Promise.all([
      Novel.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Novel.countDocuments(filter),
    ]);
    res.json({ novels, total, page: Number(page), pages: Math.ceil(total / limit) });
  })
);

// GET /api/novels/trending  (hero carousel)
router.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const novels = await Novel.find({ isMature: false })
      .sort({ views: -1, favoriteCount: -1 })
      .limit(8);
    res.json({ novels });
  })
);

// GET /api/novels/mine/list  (author dashboard) — must be declared before /:id
router.get(
  "/mine/list",
  protect,
  requireAuthor,
  asyncHandler(async (req, res) => {
    const novels = await Novel.find({ author: req.user._id }).sort({ updatedAt: -1 });
    res.json({ novels });
  })
);

// GET /api/novels/by-external/:externalId — look up the local record mirrored from the
// catalog (so ratings/comments show for everyone, even guests). Declared before /:id.
router.get(
  "/by-external/:externalId",
  asyncHandler(async (req, res) => {
    const novel = await Novel.findOne({ source: "external", externalId: req.params.externalId });
    res.json({ novel: novel || null });
  })
);

// GET /api/novels/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const novel = await Novel.findById(req.params.id).populate("author", "penName avatarUrl bio");
    if (!novel) {
      res.status(404);
      throw new Error("Novel not found.");
    }
    res.json({ novel });
  })
);

// POST /api/novels  (author only)
router.post(
  "/",
  protect,
  requireAuthor,
  uploadCover.single("cover"),
  asyncHandler(async (req, res) => {
    const { title, synopsis, genres, isMature, status, tags } = req.body;
    if (!title || !synopsis || !genres) {
      res.status(400);
      throw new Error("Title, synopsis and at least one genre are required.");
    }
    const novel = await Novel.create({
      title,
      synopsis,
      genres: Array.isArray(genres) ? genres : genres.split(",").map((g) => g.trim()),
      isMature: isMature === "true" || isMature === true,
      status: status || "ongoing",
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      author: req.user._id,
      authorName: req.user.penName,
      coverUrl: req.file ? req.file.path : "",
      coverPublicId: req.file ? req.file.filename : "",
    });
    res.status(201).json({ novel });
  })
);

// PATCH /api/novels/:id  (owning author only)
router.patch(
  "/:id",
  protect,
  requireAuthor,
  uploadCover.single("cover"),
  asyncHandler(async (req, res) => {
    const novel = await Novel.findById(req.params.id);
    if (!novel) {
      res.status(404);
      throw new Error("Novel not found.");
    }
    if (novel.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own novels.");
    }
    const editable = ["title", "synopsis", "status"];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) novel[field] = req.body[field];
    });
    if (req.body.genres) {
      novel.genres = Array.isArray(req.body.genres)
        ? req.body.genres
        : req.body.genres.split(",").map((g) => g.trim());
    }
    if (req.body.tags) novel.tags = req.body.tags.split(",").map((t) => t.trim());
    if (req.body.isMature !== undefined) novel.isMature = req.body.isMature === "true";
    if (req.file) {
      novel.coverUrl = req.file.path;
      novel.coverPublicId = req.file.filename;
    }
    await novel.save();
    res.json({ novel });
  })
);

// DELETE /api/novels/:id  (owning author only)
router.delete(
  "/:id",
  protect,
  requireAuthor,
  asyncHandler(async (req, res) => {
    const novel = await Novel.findById(req.params.id);
    if (!novel) {
      res.status(404);
      throw new Error("Novel not found.");
    }
    if (novel.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only delete your own novels.");
    }
    await Chapter.deleteMany({ novel: novel._id });
    await novel.deleteOne();
    res.json({ message: "Novel deleted." });
  })
);

// POST /api/novels/external-mirror — comments/ratings/favorites need a Mongo _id, but
// catalog novels only have a detailPath. Upsert a lightweight local record keyed by
// externalId (title/cover/synopsis only; text is always read live from the catalog).
router.post(
  "/external-mirror",
  protect,
  asyncHandler(async (req, res) => {
    const { externalId, title, synopsis, coverUrl, genres, authorName, isMature } = req.body;
    if (!externalId || !title) {
      res.status(400);
      throw new Error("externalId and title are required.");
    }
    let novel = await Novel.findOne({ source: "external", externalId });
    if (!novel) {
      const { GENRES } = require("../models/Novel");
      const safe = (Array.isArray(genres) ? genres : []).filter((g) => GENRES.includes(g));
      novel = await Novel.create({
        title,
        synopsis: (synopsis || "From the Rumion catalog.").slice(0, 3000),
        genres: safe.length ? safe : ["fiction"],
        isMature: !!isMature,
        authorName: authorName || "Unknown",
        author: req.user._id,
        coverUrl: coverUrl || "",
        source: "external",
        externalId,
      });
    }
    res.json({ novel });
  })
);

module.exports = router;
