const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Requires a valid token; attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authenticated. Please log in.");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      res.status(401);
      throw new Error("Account no longer exists.");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Session expired. Please log in again.");
  }
});

// Attaches req.user if a token is present, but never blocks the request.
// Used on routes readers can hit anonymously (e.g. reading chapters).
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      req.user = null;
    }
  }
  next();
});

const requireAuthor = (req, res, next) => {
  if (!req.user?.isAuthor) {
    res.status(403);
    throw new Error("Set up your author profile to do this.");
  }
  next();
};

module.exports = { protect, optionalAuth, requireAuthor };
