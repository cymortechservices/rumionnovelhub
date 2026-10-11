const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    novel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel", required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true }, // stored as HTML/plain paragraphs
    wordCount: { type: Number, default: 0 },
    isDraft: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chapterSchema.index({ novel: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Chapter", chapterSchema);
