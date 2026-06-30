const mongoose = require("mongoose");

const perfumeSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true, trim: true },
    brand:  { type: String, required: true, trim: true },
    price:  { type: Number, required: true, min: 0 },
    tag: {
      type: String,
      required: true,
      enum: ["Vanilla", "Oud & Wood", "Citrus & Fresh", "Amber & Spice", "Floral", "Leather"],
    },
    notes:  { type: String, required: true, trim: true },
    desc:   { type: String, required: true, trim: true },
    img:    { type: String, default: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=700&auto=format&fit=crop" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Perfume", perfumeSchema);
