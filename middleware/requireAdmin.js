function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();

  // API request → return 401 JSON
  if (req.path.startsWith("/api/") || req.headers["content-type"] === "application/json") {
    return res.status(401).json({ error: "Not authenticated." });
  }

  // HTML request → redirect to login page
  res.redirect("/admin-login.html");
}

module.exports = requireAdmin;
