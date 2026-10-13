const mongoose = require("mongoose");
const coll = require("../config/collections");

const GENRES = [
  "action",
  "romance",
  "fantasy",
  "fiction",
  "sci-fi",
  "mystery",
  "horror",
  "comedy",
  "drama",
  "adventure",
  "18+",
];

const novelSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    synopsis: { type: String, required: true, maxlength: 3000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    coverUrl: { type: String, default: "" },
    coverPublicId: { type: String, default: "" },
    genres: {
      type: [{ type: String, enum: GENRES }],
      validate: (v) => v.length > 0,
    },
    isMature: { type: Boolean, default: false },
    status: { type: String, enum: ["ongoing", "completed", "hiatus"], default: "ongoing" },
    tags: [{ type: String, trim: true, maxlength: 24 }],
    chapterCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    source: { type: String, enum: ["original", "external"], default: "original" },
    externalId: { type: String, default: null }, // set when mirrored from the external discovery API
  },
  { timestamps: true }
);

novelSchema.index({ title: "text", synopsis: "text", tags: "text" });

module.exports = mongoose.model("Novel", novelSchema, coll("novels"));
module.exports.GENRES = GENRES;
