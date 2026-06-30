const express = require("express");
const router  = express.Router();
const Perfume = require("../models/Perfume");

// GET /api/stats
router.get("/", async (req, res) => {
  try {
    const totalProducts = await Perfume.countDocuments();
    const agg = await Perfume.aggregate([
      { $group: { _id: null, avgPrice: { $avg: "$price" } } }
    ]);
    const avgPrice = agg[0]?.avgPrice || 0;
    const totalSales  = Math.round(128400 + totalProducts * 1240 + avgPrice * 12);
    const activeUsers = 3482;
    const byTag = await Perfume.aggregate([
      { $group: { _id: "$tag", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ totalProducts, totalSales, activeUsers, byTag });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
