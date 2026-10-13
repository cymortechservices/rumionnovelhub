const express = require("express");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");

const router = express.Router();

// Only failed attempts count towards the limit, so normal sign-ups are never blocked.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait a few minutes and try again." },
});

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
  favorites: (u.favorites || []).map((f) => f.toString()),
});

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const penName = String(req.body.penName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const becomeAuthor = req.body.becomeAuthor === true || req.body.becomeAuthor === "true";

    if (penName.length < 2) {
      res.status(400);
      throw new Error("Choose a pen name with at least 2 characters.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400);
      throw new Error("Enter a valid email address.");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Your password needs at least 6 characters.");
    }
    if (await User.exists({ email })) {
      res.status(409);
      throw new Error("An account with that email already exists. Try logging in instead.");
    }

    const user = await User.create({
      penName,
      email,
      password,
      isAuthor: becomeAuthor,
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
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+password");
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
    if (penName && penName.trim().length >= 2) req.user.penName = penName.trim();
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
