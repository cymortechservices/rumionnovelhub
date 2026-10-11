# Rumion Novel Hub — Backend

Express + MongoDB API for accounts, author-published novels/chapters, comments,
ratings and favorites, plus a thin proxy over the already-deployed discovery API
at `novel-api.nabaikabaiaguo.workers.dev` (search/genre/featured/rankings/chapters)
so the frontend can pull in a wider catalog under one base URL.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in MongoDB, JWT secret, Cloudinary keys
npm run dev             # nodemon, http://localhost:5000
```

## Deploying to Render

1. Push this folder to a GitHub repo (or the repo root, adjusting the root directory).
2. New "Web Service" on Render → connect the repo.
3. Root directory: `backend` (if the repo has both backend/ and frontend/).
4. Build command: `npm install`
5. Start command: `npm start`
6. Add the environment variables from `.env.example` in Render's dashboard —
   `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`, `CLIENT_URL` (your Vercel URL, for CORS).
7. Once deployed, your API base is `https://<service>.onrender.com/api`.

## Data model

- `User` — readers and authors are the same model; `isAuthor` unlocks the
  author dashboard. Passwords are bcrypt-hashed; auth is JWT bearer tokens.
- `Novel` — title, synopsis, genres (action/romance/fantasy/fiction/sci-fi/
  mystery/horror/comedy/drama/adventure/18+), cover (Cloudinary URL), status,
  aggregate rating/favorite/view counts.
- `Chapter` — belongs to a novel, ordered, draft/published flag, word count.
- `Comment`, `Rating` — one rating per user per novel (upsert), comments can
  be scoped to a novel or a specific chapter.

## Auth model

- Anyone can register. Reading published chapters never requires a login.
- Commenting, rating, and favoriting require a logged-in account (reader or author).
- Publishing/editing novels and chapters requires `isAuthor: true`, set either
  at registration (`becomeAuthor: true`) or later via `PATCH /auth/me`.

## Cloudinary

Cover uploads go through `multer-storage-cloudinary` straight to the
`rumion/covers` folder (auto-resized to 800×1200). Put your Cloudinary
credentials in `.env` — never commit them.
