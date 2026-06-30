# Fragrance Mission v2

Luxury perfume e-commerce site — dark glassmorphic UI, interactive quiz, and a full admin dashboard.
**Express + MongoDB (Mongoose) backend. Zero build step.**

---

## File structure

```
fragrance-mission/
├── server.js              # Express entry point
├── seed.js                # Seed script — populates MongoDB with 15 perfumes
├── package.json
├── .env.example           # Copy to .env and fill in your MongoDB URI
├── models/
│   └── Perfume.js         # Mongoose schema
├── routes/
│   ├── perfumes.js        # GET /api/perfumes  POST  PUT  DELETE
│   └── stats.js           # GET /api/stats
└── public/                # Static frontend, served by Express
    ├── index.html          # Main storefront
    ├── style.css           # Storefront styles
    ├── script.js           # Storefront JS (fetch → API)
    ├── admin.html          # Admin dashboard
    ├── adminstyle.css      # Admin styles
    └── adminscript.js      # Admin JS (full CRUD via API)
```

---

## Quick start

### 1. Copy environment file
```bash
cp .env.example .env
```
Edit `.env` and set your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/fragrance_mission
# or Atlas:
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/fragrance_mission?retryWrites=true&w=majority
PORT=3000
```

### 2. Install dependencies
```bash
npm install
```

### 3. Seed the database
```bash
npm run seed
```
Inserts 15 premium perfumes. Re-running resets the collection.

### 4. Start the server
```bash
npm start
```
Open **http://localhost:3000**
Admin panel: **http://localhost:3000/admin.html**

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/perfumes` | List all. Supports `?tag=`, `?search=`, `?featured=true` |
| `GET`  | `/api/perfumes/:id` | Single perfume by MongoDB `_id` |
| `POST` | `/api/perfumes` | Create perfume (JSON body) |
| `PUT`  | `/api/perfumes/:id` | Update perfume |
| `DELETE`| `/api/perfumes/:id`| Delete perfume |
| `GET`  | `/api/stats` | Dashboard analytics + category breakdown |

**Perfume body:**
```json
{
  "title":    "Noir Vanille Mission",
  "brand":    "Fragrance Mission",
  "price":    245,
  "tag":      "Vanilla",
  "notes":    "Black vanilla orchid, tonka bean, dried tobacco leaf",
  "desc":     "A smoldering vanilla built on dried tobacco and dark resin.",
  "img":      "https://images.unsplash.com/...",
  "featured": true
}
```
Valid `tag` values: `Vanilla` | `Oud & Wood` | `Citrus & Fresh` | `Amber & Spice` | `Floral` | `Leather`

---

## Deploy to production

### Render.com (recommended)
1. Push the repo to GitHub
2. Render → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable: `MONGODB_URI` (use MongoDB Atlas URI)
6. Run seed once via Render shell: `node seed.js`

### Railway.app
1. New Project → Deploy from GitHub repo
2. Add `MONGODB_URI` and `PORT` env vars
3. Railway auto-detects Node and runs `npm start`

### MongoDB Atlas (free tier)
1. atlas.mongodb.com → Create free cluster
2. Database Access → Add user
3. Network Access → Allow `0.0.0.0/0` (or your server IP)
4. Connect → Drivers → copy the connection string into `MONGODB_URI`

---

## Push to GitHub

```bash
git init
git add .
git commit -m "feat: Fragrance Mission v2 — Express + MongoDB fullstack"
git branch -M main
git remote add origin https://github.com/<you>/fragrance-mission.git
git push -u origin main
```

---

## Notes
- Cart persists in browser `localStorage` (no auth required)
- Admin has no login in this version — add JWT or session middleware before going to production
- Discount code shown after quiz: **MISSION15**
- If an Unsplash image 404s, the UI falls back to a glowing illustrated bottle

---

## Admin access & authentication

The admin panel is **fully protected** — regular users cannot access it at all.

### How it works
- `/admin` and `/admin.html` are **never served from the public folder**
- The server checks for a valid session cookie before serving the admin HTML
- All `/api/perfumes` and `/api/stats` endpoints also require an active admin session
- Unauthenticated requests are redirected to `/admin-login.html` (HTML) or receive a 401 JSON response (API)

### Login credentials
Set in `.env`:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=mission2026
SESSION_SECRET=change-this-to-a-long-random-secret-string
```
**Change these before deploying to production.**

### Login flow
1. User visits `/admin` → server checks session → redirects to `/admin-login.html`
2. User enters credentials → POST `/api/auth/login` → session cookie issued
3. Subsequent `/admin` visits → session valid → admin HTML served
4. Session expires after **8 hours**
5. Logout button destroys session and redirects to login page

