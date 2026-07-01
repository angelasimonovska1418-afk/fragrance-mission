require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const session    = require("express-session");
const mongoose   = require("mongoose");
const path       = require("path");

const perfumesRouter = require("./routes/perfumes");
const statsRouter    = require("./routes/stats");
const authRouter     = require("./routes/auth");
const requireAdmin   = require("./middleware/requireAdmin");

const app  = express();
const PORT = process.env.PORT || 3000;

// Railway uses MONGO_URL, Atlas uses MONGODB_URI — check both
const MONGO = process.env.MONGODB_URI
           || process.env.MONGO_URL
           || "mongodb://localhost:27017/fragrance_mission";

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors({ origin: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret:            process.env.SESSION_SECRET || "dev-secret-change-me",
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    maxAge:   8 * 60 * 60 * 1000,
  },
}));

/* ── Public routes ──────────────────────────────────────────── */
app.use("/api/auth", authRouter);

/* ── Protected API ──────────────────────────────────────────── */
app.use("/api/perfumes", requireAdmin, perfumesRouter);
app.use("/api/stats",    requireAdmin, statsRouter);

/* ── Protected admin HTML ───────────────────────────────────── */
app.get(["/admin", "/admin.html"], requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

/* ── Static files ───────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, "public")));

/* ── SPA fallback ───────────────────────────────────────────── */
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ── Connect MongoDB → start ────────────────────────────────── */
mongoose
  .connect(MONGO)
  .then(() => {
    console.log("✓ MongoDB connected");
    app.listen(PORT, () => console.log(`✓ Server → http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("✗ MongoDB failed:", err.message);
    process.exit(1);
  });
