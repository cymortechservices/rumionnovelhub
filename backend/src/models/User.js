const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    penName: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    bio: { type: String, maxlength: 300, default: "" },
    avatarUrl: { type: String, default: "" },
    // Anyone can register (readers included) so they can comment/rate/sync favorites.
    // isAuthor unlocks the author dashboard (novel + chapter uploads).
    role: { type: String, enum: ["reader", "author", "admin"], default: "reader" },
    isAuthor: { type: Boolean, default: false },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Novel" }],
    is18PlusVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
