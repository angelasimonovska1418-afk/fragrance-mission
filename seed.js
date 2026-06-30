require("dotenv").config();
const mongoose = require("mongoose");
const Perfume  = require("./models/Perfume");

const MONGO = process.env.MONGODB_URI || "mongodb://localhost:27017/fragrance_mission";

const SEED = [
  {
    title:"Noir Vanille Mission", brand:"Fragrance Mission", price:245, tag:"Vanilla", featured:true,
    notes:"Black vanilla orchid, tonka bean, dried tobacco leaf",
    desc:"A smoldering vanilla built on dried tobacco and dark resin — the scent of velvet curtains and low light.",
    img:"https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Royal Oud Reserve", brand:"Fragrance Mission", price:310, tag:"Oud & Wood", featured:true,
    notes:"Cambodian oud, sandalwood, Bulgarian rose",
    desc:"Our flagship oud, aged in cedar barrels. Dense, regal, and entirely unbothered by trend.",
    img:"https://images.unsplash.com/photo-1587017539504-67cfbddac569?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Bergamot Breeze", brand:"Fragrance Mission", price:165, tag:"Citrus & Fresh", featured:true,
    notes:"Calabrian bergamot, neroli, sea salt accord",
    desc:"The first ten minutes of a Mediterranean morning, bottled and made to last all day.",
    img:"https://images.unsplash.com/photo-1610461888750-10bfc601350b?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Amber Absolute", brand:"Fragrance Mission", price:225, tag:"Amber & Spice", featured:true,
    notes:"Amber resin, saffron threads, cinnamon bark",
    desc:"Liquid amber at golden hour — dense, sweet, and lit from within.",
    img:"https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Leather & Smoke", brand:"Fragrance Mission", price:275, tag:"Leather", featured:true,
    notes:"Smoked leather, birch tar, vetiver",
    desc:"Worn leather jackets and dying campfires. Our darkest, most uncompromising formula.",
    img:"https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Rose Anonyme", brand:"Fragrance Mission", price:250, tag:"Floral", featured:false,
    notes:"Turkish rose, dark oud, patchouli",
    desc:"Rose stripped of sweetness and rebuilt on oud and patchouli. Not for the faint of heart.",
    img:"https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Mystical Wood", brand:"Fragrance Mission", price:195, tag:"Oud & Wood", featured:false,
    notes:"Cedarwood, vetiver, cracked black pepper",
    desc:"A quiet forest at altitude — dry cedar, root-deep vetiver, a flicker of pepper heat.",
    img:"https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Golden Frankincense", brand:"Fragrance Mission", price:290, tag:"Amber & Spice", featured:false,
    notes:"Frankincense resin, Cambodian oud, golden amber",
    desc:"Cathedral incense and molten amber — heavy, holy, and built to fill a room.",
    img:"https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"Oceanic Blue", brand:"Fragrance Mission", price:180, tag:"Citrus & Fresh", featured:false,
    notes:"Marine accord, pink grapefruit, white ambergris",
    desc:"Cold water clarity with a warm ambergris undertow. Built for momentum.",
    img:"https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=700&auto=format&fit=crop"
  },
  {
    title:"White Vanilla Musk", brand:"Fragrance Mission", price:175, tag:"Vanilla", featured:false,
    notes:"Madagascar vanilla, white musk, jasmine petal",
    desc:"Skin-warm vanilla with a clean musk finish. The easiest scent in the collection to fall for.",
    img:"https://images.unsplash.com/photo-1587017539504-67cfbddac569?q=80&w=700&auto=format&fit=crop"
  },
];

async function seed() {
  await mongoose.connect(MONGO);
  console.log("✓ Connected to MongoDB");
  await Perfume.deleteMany({});
  const inserted = await Perfume.insertMany(SEED);
  console.log(`✓ Seeded ${inserted.length} perfumes`);
  inserted.forEach(p => console.log(`  — ${p.title} [${p.tag}]`));
  await mongoose.disconnect();
  console.log("✓ Done");
}

seed().catch(err => { console.error(err); process.exit(1); });
