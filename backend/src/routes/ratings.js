const express = require("express");
const asyncHandler = require("express-async-handler");
const Rating = require("../models/Rating");
const Novel = require("../models/Novel");
const { protect } = require("../middleware/auth");

const router = express.Router();

async function recalcNovelRating(novelId) {
  const stats = await Rating.aggregate([
    { $match: { novel: novelId } },
    { $group: { _id: "$novel", avg: { $avg: "$score" }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Novel.findByIdAndUpdate(novelId, {
    ratingAverage: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
}

// PUT /api/ratings/:novelId  (create or update the logged-in user's rating)
router.put(
  "/:novelId",
  protect,
  asyncHandler(async (req, res) => {
    const { score } = req.body;
    if (!score || score < 1 || score > 5) {
      res.status(400);
      throw new Error("Rating must be between 1 and 5.");
    }
    await Rating.findOneAndUpdate(
      { novel: req.params.novelId, user: req.user._id },
      { score },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await recalcNovelRating(req.params.novelId);
    const novel = await Novel.findById(req.params.novelId);
    res.json({ ratingAverage: novel.ratingAverage, ratingCount: novel.ratingCount });
  })
);

// GET /api/ratings/:novelId/mine
router.get(
  "/:novelId/mine",
  protect,
  asyncHandler(async (req, res) => {
    const rating = await Rating.findOne({ novel: req.params.novelId, user: req.user._id });
    res.json({ score: rating ? rating.score : 0 });
  })
);

module.exports = router;
