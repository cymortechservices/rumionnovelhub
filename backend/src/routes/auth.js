const express = require("express");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "30d" });

const publicUser = (u) => ({
  id: u._id,
  penName: u.penName,
  email: u.email,
  bio: u.bio,
  avatarUrl: u.avatarUrl,
  role: u.role,
  isAuthor: u.isAuthor,
});

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { penName, email, password, becomeAuthor } = req.body;
    if (!penName || !email || !password) {
      res.status(400);
      throw new Error("Pen name, email and password are required.");
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(409);
      throw new Error("An account with that email already exists.");
    }
    const user = await User.create({
      penName,
      email,
      password,
      isAuthor: !!becomeAuthor,
      role: becomeAuthor ? "author" : "reader",
    });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password || ""))) {
      res.status(401);
      throw new Error("Incorrect email or password.");
    }
    res.json({ token: signToken(user._id), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);

// PATCH /api/auth/me
router.patch(
  "/me",
  protect,
  uploadAvatar.single("avatar"),
  asyncHandler(async (req, res) => {
    const { penName, bio, becomeAuthor } = req.body;
    if (penName) req.user.penName = penName;
    if (bio !== undefined) req.user.bio = bio;
    if (becomeAuthor === "true") {
      req.user.isAuthor = true;
      req.user.role = "author";
    }
    if (req.file) req.user.avatarUrl = req.file.path;
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  })
);

// PUT /api/auth/favorites/:novelId  (toggle)
router.put(
  "/favorites/:novelId",
  protect,
  asyncHandler(async (req, res) => {
    const idx = req.user.favorites.findIndex((f) => f.toString() === req.params.novelId);
    const Novel = require("../models/Novel");
    if (idx >= 0) {
      req.user.favorites.splice(idx, 1);
      await Novel.findByIdAndUpdate(req.params.novelId, { $inc: { favoriteCount: -1 } });
    } else {
      req.user.favorites.push(req.params.novelId);
      await Novel.findByIdAndUpdate(req.params.novelId, { $inc: { favoriteCount: 1 } });
    }
    await req.user.save();
    res.json({ favorites: req.user.favorites });
  })
);

module.exports = router;
