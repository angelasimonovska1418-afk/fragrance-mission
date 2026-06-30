require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const session      = require("express-session");
const mongoose     = require("mongoose");
const path         = require("path");
const fs           = require("fs");

const perfumesRouter = require("./routes/perfumes");
const statsRouter    = require("./routes/stats");
const authRouter     = require("./routes/auth");
const requireAdmin   = require("./middleware/requireAdmin");

const app   = express();
const PORT  = process.env.PORT || 3000;
const MONGO = process.env.MONGODB_URI || "mongodb://localhost:27017/fragrance_mission";

/* ── Middleware ──────────────────────────────────────────────── */
app.use(cors({ origin: false }));          // same-origin only
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret:            process.env.SESSION_SECRET || "dev-secret-change-me",
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    maxAge:   8 * 60 * 60 * 1000,   // 8 hours
  },
}));

/* ── Public API ─────────────────────────────────────────────── */
app.use("/api/auth",    authRouter);

/* ── Protected API (admin only) ─────────────────────────────── */
app.use("/api/perfumes", requireAdmin, perfumesRouter);
app.use("/api/stats",    requireAdmin, statsRouter);

/* ── Protected admin HTML ───────────────────────────────────── */
// /admin and /admin.html both require a valid session
app.get(["/admin", "/admin.html"], requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

/* ── Static frontend (public files only — no admin.html here) ── */
app.use(express.static(path.join(__dirname, "public")));

/* ── SPA fallback → index.html ──────────────────────────────── */
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ── Connect to MongoDB then start ─────────────────────────── */
mongoose
  .connect(MONGO)
  .then(() => {
    console.log("✓ MongoDB connected:", MONGO);
    app.listen(PORT, () =>
      console.log(`✓ Server → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("✗ MongoDB:", err.message);
    process.exit(1);
  });
