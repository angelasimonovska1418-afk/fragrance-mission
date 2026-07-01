const express = require("express");
const router  = express.Router();
const User    = require("../models/User");

/* ── ADMIN login ────────────────────────────────────────────── */
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "mission2026";
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ ok: true, role: "admin" });
  }
  res.status(401).json({ error: "Invalid credentials." });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/check", (req, res) => {
  if (req.session.isAdmin) return res.json({ ok: true, role: "admin" });
  res.status(401).json({ error: "Not authenticated." });
});

/* ── USER register ──────────────────────────────────────────── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required." });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: "An account with this email already exists." });

    const user = await User.create({ name, email, password });
    req.session.userId   = user._id;
    req.session.userName = user.name;
    req.session.userEmail= user.email;

    res.status(201).json({ ok: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── USER login ─────────────────────────────────────────────── */
router.post("/user-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password." });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ error: "Invalid email or password." });

    req.session.userId    = user._id;
    req.session.userName  = user.name;
    req.session.userEmail = user.email;

    res.json({ ok: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── USER logout ────────────────────────────────────────────── */
router.post("/user-logout", (req, res) => {
  req.session.userId    = null;
  req.session.userName  = null;
  req.session.userEmail = null;
  res.json({ ok: true });
});

/* ── USER check session ─────────────────────────────────────── */
router.get("/user-check", (req, res) => {
  if (req.session.userId)
    return res.json({ ok: true, user: { name: req.session.userName, email: req.session.userEmail } });
  res.status(401).json({ error: "Not logged in." });
});

module.exports = router;
