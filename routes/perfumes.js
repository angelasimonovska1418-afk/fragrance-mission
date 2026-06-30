const express = require("express");
const router  = express.Router();
const Perfume = require("../models/Perfume");

// GET /api/perfumes  — supports ?tag=&search=&featured=true
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.tag && req.query.tag !== "All") filter.tag = req.query.tag;
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.search) {
      const rx = new RegExp(req.query.search, "i");
      filter.$or = [{ title: rx }, { notes: rx }, { brand: rx }, { desc: rx }];
    }
    const perfumes = await Perfume.find(filter).sort({ createdAt: -1 });
    res.json(perfumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/perfumes/:id
router.get("/:id", async (req, res) => {
  try {
    const p = await Perfume.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found." });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/perfumes
router.post("/", async (req, res) => {
  try {
    const p = await Perfume.create(req.body);
    res.status(201).json(p);
  } catch (err) {
    const errors = err.errors
      ? Object.values(err.errors).map((e) => e.message)
      : [err.message];
    res.status(400).json({ errors });
  }
});

// PUT /api/perfumes/:id
router.put("/:id", async (req, res) => {
  try {
    const p = await Perfume.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!p) return res.status(404).json({ error: "Not found." });
    res.json(p);
  } catch (err) {
    const errors = err.errors
      ? Object.values(err.errors).map((e) => e.message)
      : [err.message];
    res.status(400).json({ errors });
  }
});

// DELETE /api/perfumes/:id
router.delete("/:id", async (req, res) => {
  try {
    const p = await Perfume.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found." });
    res.json({ deleted: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
