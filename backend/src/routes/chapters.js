const express = require("express");
const asyncHandler = require("express-async-handler");
const Chapter = require("../models/Chapter");
const Novel = require("../models/Novel");
const { protect, requireAuthor, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const countWords = (html = "") => html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

// GET /api/chapters/novel/:novelId  (list, published only unless owner)
router.get(
  "/novel/:novelId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const novel = await Novel.findById(req.params.novelId);
    if (!novel) {
      res.status(404);
      throw new Error("Novel not found.");
    }
    const isOwner = req.user && novel.author.toString() === req.user._id.toString();
    const filter = { novel: novel._id };
    if (!isOwner) filter.isDraft = false;
    const chapters = await Chapter.find(filter)
      .select("-content")
      .sort({ order: 1 });
    res.json({ chapters });
  })
);

// GET /api/chapters/:id  (full chapter content, for the reader)
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id).populate("novel", "title author authorName coverUrl chapterCount isMature");
    if (!chapter) {
      res.status(404);
      throw new Error("Chapter not found.");
    }
    const isOwner = req.user && chapter.novel.author.toString() === req.user._id.toString();
    if (chapter.isDraft && !isOwner) {
      res.status(403);
      throw new Error("This chapter is not published yet.");
    }
    chapter.views += 1;
    await chapter.save();
    res.json({ chapter });
  })
);

// POST /api/chapters  (author only) - create/upload a chapter
router.post(
  "/",
  protect,
  requireAuthor,
  asyncHandler(async (req, res) => {
    const { novelId, title, content, order, isDraft } = req.body;
    if (!novelId || !title || !content) {
      res.status(400);
      throw new Error("novelId, title and content are required.");
    }
    const novel = await Novel.findById(novelId);
    if (!novel) {
      res.status(404);
      throw new Error("Novel not found.");
    }
    if (novel.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only add chapters to your own novels.");
    }
    const nextOrder = order || (await Chapter.countDocuments({ novel: novelId })) + 1;
    const chapter = await Chapter.create({
      novel: novelId,
      order: nextOrder,
      title,
      content,
      wordCount: countWords(content),
      isDraft: !!isDraft,
    });
    if (!chapter.isDraft) {
      novel.chapterCount += 1;
      await novel.save();
    }
    res.status(201).json({ chapter });
  })
);

// PATCH /api/chapters/:id  (author only, own chapter) - edit seamlessly
router.patch(
  "/:id",
  protect,
  requireAuthor,
  asyncHandler(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id).populate("novel");
    if (!chapter) {
      res.status(404);
      throw new Error("Chapter not found.");
    }
    if (chapter.novel.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own chapters.");
    }
    const wasDraft = chapter.isDraft;
    if (req.body.title !== undefined) chapter.title = req.body.title;
    if (req.body.content !== undefined) {
      chapter.content = req.body.content;
      chapter.wordCount = countWords(req.body.content);
    }
    if (req.body.order !== undefined) chapter.order = req.body.order;
    if (req.body.isDraft !== undefined) chapter.isDraft = req.body.isDraft === true || req.body.isDraft === "true";
    await chapter.save();

    if (wasDraft && !chapter.isDraft) {
      await Novel.findByIdAndUpdate(chapter.novel._id, { $inc: { chapterCount: 1 } });
    } else if (!wasDraft && chapter.isDraft) {
      await Novel.findByIdAndUpdate(chapter.novel._id, { $inc: { chapterCount: -1 } });
    }
    res.json({ chapter });
  })
);

// DELETE /api/chapters/:id
router.delete(
  "/:id",
  protect,
  requireAuthor,
  asyncHandler(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id).populate("novel");
    if (!chapter) {
      res.status(404);
      throw new Error("Chapter not found.");
    }
    if (chapter.novel.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only delete your own chapters.");
    }
    if (!chapter.isDraft) {
      await Novel.findByIdAndUpdate(chapter.novel._id, { $inc: { chapterCount: -1 } });
    }
    await chapter.deleteOne();
    res.json({ message: "Chapter deleted." });
  })
);

module.exports = router;
