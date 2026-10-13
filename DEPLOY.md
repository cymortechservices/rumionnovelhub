# Deploying Rumion Novel Hub

## 1. Accounts you need
- **MongoDB Atlas** (free M0 cluster). Database user + "Allow access from anywhere" (0.0.0.0/0) for Render.
  Copy the connection string -> `MONGODB_URI` (end it with `/rumion`).
- **Cloudinary** (free). Dashboard -> cloud name, API key, API secret (novel covers + avatars upload here).

## 2. Backend -> Render
1. Push this whole folder to GitHub.
2. Render -> New -> Blueprint (uses `backend/render.yaml`), or New -> Web Service with root dir `backend`,
   build `npm install`, start `npm start`.
3. Set env vars: `MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `JWT_SECRET` (any long random string), `EXTERNAL_NOVEL_API` (already set to your Workers API),
   and `CLIENT_URL` = your Vercel URL (add after step 3; no trailing slash).
4. Check `https://<service>.onrender.com/health` -> `{"status":"ok"}`.
   Test the catalog proxy: `https://<service>.onrender.com/api/external/featured`.

## 3. Frontend -> Vercel
1. Import the repo, **Root Directory = `frontend`**, framework Vite.
2. Env var: `VITE_API_URL=https://<service>.onrender.com/api`
3. Deploy, then put the Vercel URL into Render's `CLIENT_URL` and redeploy the backend (CORS).

## 4. First run
Open the site -> entry animation -> Home. Register with "publish my own novels" ticked to unlock the Author tab.

Render's free tier sleeps after inactivity; the first request after a nap can take ~30s.

## 5. Notes for v1.1.0

**Sign-up error `E11000 ... cymor.users ... phone_1 dup key`**
Your Atlas database `cymor` already holds another app's `users` collection with a unique `phone` index.
Rumion now stores its data in its own collections (`rumion_users`, `rumion_novels`, `rumion_chapters`,
`rumion_comments`, `rumion_ratings`), so it never touches that index. Change the prefix with the
`COLLECTION_PREFIX` env var (default `rumion_`). Duplicate emails now return a clear
"An account with that email already exists" message.

If you already created Rumion accounts in the old `users` collection and want to keep them:
```bash
cd backend && npm run migrate:users
```

**Continue reading** is stored in the reader's own browser (localStorage), so it is per device and needs no account.
Readers see it on Home and at `/continue` when they return.

**Reader modes**: readers can switch between *Turn pages* (real-book flip, hinged at the spine) and *Scroll*
from the reader toolbar or Settings.
