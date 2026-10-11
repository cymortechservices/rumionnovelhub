const express = require("express");
const asyncHandler = require("express-async-handler");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/comments/novel/:novelId?chapter=optionalChapterId&page=&limit=
router.get(
  "/novel/:novelId",
  asyncHandler(async (req, res) => {
    const { chapter, page = 1, limit = 20 } = req.query;
    const filter = { novel: req.params.novelId };
    if (chapter) filter.chapter = chapter;
    const skip = (Number(page) - 1) * Number(limit);
    const [comments, total] = await Promise.all([
      Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Comment.countDocuments(filter),
    ]);
    res.json({ comments, total });
  })
);

// POST /api/comments  (any logged-in user — reader or author)
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { novelId, chapterId, text } = req.body;
    if (!novelId || !text || !text.trim()) {
      res.status(400);
      throw new Error("A comment needs a novel and some text.");
    }
    const comment = await Comment.create({
      novel: novelId,
      chapter: chapterId || null,
      user: req.user._id,
      userName: req.user.penName,
      userAvatar: req.user.avatarUrl,
      text: text.trim(),
    });
    res.status(201).json({ comment });
  })
);

// DELETE /api/comments/:id  (own comment only)
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error("Comment not found.");
    }
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("You can only delete your own comments.");
    }
    await comment.deleteOne();
    res.json({ message: "Comment deleted." });
  })
);

module.exports = router;
