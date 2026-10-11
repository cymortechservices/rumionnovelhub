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

// Centralized error handler
app.use((err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    message: err.message || "Something went wrong on our end.",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[rumion] API running on port ${PORT}`));
