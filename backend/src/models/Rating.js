const mongoose = require("mongoose");
const coll = require("../config/collections");

const ratingSchema = new mongoose.Schema(
  {
    novel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

ratingSchema.index({ novel: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema, coll("ratings"));
