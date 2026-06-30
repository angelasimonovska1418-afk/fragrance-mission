const express = require("express");
const router  = express.Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "mission2026";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    req.session.loginAt = new Date().toISOString();
    return res.json({ ok: true });
  }

  // Wrong credentials — don't hint which field is wrong
  res.status(401).json({ error: "Invalid credentials." });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /api/auth/check — returns 200 if logged in, 401 if not
router.get("/check", (req, res) => {
  if (req.session.isAdmin) return res.json({ ok: true });
  res.status(401).json({ error: "Not authenticated." });
});

module.exports = router;
