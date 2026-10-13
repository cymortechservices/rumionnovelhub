const mongoose = require("mongoose");
const coll = require("../config/collections");

const commentSchema = new mongoose.Schema(
  {
    novel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel", required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema, coll("comments"));
