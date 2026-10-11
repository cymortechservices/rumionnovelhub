# Rumion Novel Hub

A full-stack novel reading platform: readers browse and read for free,
create an account to comment/rate/favorite, and authors publish their own
novels and chapters from a dedicated dashboard.

```
rumion/
├── backend/    Express + MongoDB API → deploy to Render
└── frontend/   React + Vite app     → deploy to Vercel
```

Start with the README in each folder. Quick path:

1. **MongoDB**: create a free Atlas cluster, grab the connection string.
2. **Cloudinary**: create an account, grab cloud name / API key / API secret
   (used for novel cover uploads).
3. **Backend**: `cd backend && npm install`, fill in `.env` from
   `.env.example`, `npm run dev` locally, then deploy to Render.
4. **Frontend**: `cd frontend && npm install`, set `VITE_API_URL` in `.env`
   to your backend's `/api` URL, `npm run dev` locally, then deploy to
   Vercel.

Developer: **Legendary Smiley Cymor** — dedicated to my love, who loves
reading and is a certified novel girlie. 📖
