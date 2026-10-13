require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const novelRoutes = require("./routes/novels");
const chapterRoutes = require("./routes/chapters");
const commentRoutes = require("./routes/comments");
const ratingRoutes = require("./routes/ratings");
const externalRoutes = require("./routes/external");

const app = express();

// Render (and Vercel/Cloudflare) sit behind a proxy: trust it so rate limiting sees each visitor's
// real IP instead of treating everyone as one client.
app.set("trust proxy", 1);

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok", service: "rumion-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/novels", novelRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/external", externalRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});

// Centralized error handler: always JSON, always a readable message (never a raw Mongo error)
app.use((err, req, res, next) => {
  let status = res.statusCode >= 400 ? res.statusCode : 500;
  let message = err.message || "Something went wrong on our end.";

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message =
      field === "email"
        ? "An account with that email already exists. Try logging in instead."
        : field
        ? `That ${field} is already in use.`
        : "That already exists.";
    console.error("[rumion] duplicate key:", err.message);
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors || {})[0]?.message || message;
  } else if (err.name === "CastError") {
    status = 400;
    message = "That link isn't valid.";
  } else if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "That image is too large." : err.message;
  } else if (status === 500) {
    console.error("[rumion] unexpected error:", err);
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[rumion] API running on port ${PORT}`));
