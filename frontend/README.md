# Rumion Novel Hub — Frontend

React + Vite single-page app: entry animation, home with an auto-switching
trending hero and genre rows, a customizable page-turning reader, an author
dashboard for writing/uploading chapters, favorites, and settings — with a
bottom nav (Home / Favorites / Author / Settings).

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend's /api URL
npm run dev              # http://localhost:5173
```

## Deploying to Vercel

1. Import the `frontend` folder as a Vercel project (Framework preset: Vite).
2. Add the environment variable `VITE_API_URL` = `https://<your-backend>.onrender.com/api`.
3. `vercel.json` is already set up to rewrite all routes to `index.html` so
   client-side routing (React Router) works on refresh/deep links.

## Where content comes from

Home, Browse, search, novel pages and the reader pull real novels (covers, descriptions, tags,
chapter lists and chapter text) from the Nabees Novel API, proxied by your backend at `/api/external/*`
(5-minute in-memory cache). Response shapes were checked against the live API:

- lists: `data.contentList` (featured) / `data.list` (search, genre, rankings); covers are objects (`cover.url`)
- chapter list: `data.chapterList` (`chapterId`, `chapterName`, `seq`); chapter text: `/chapter/{id}` -> `data.content`
- genre ids used for Home rows live in `src/constants/externalGenres.js` (Modern Romance 1002, Western Fantasy 1007, ...).
  "Action" is a keyword search and "18+" is Modern Romance filtered by "Age Rating: 18+" because the API has no such genres.
- if the API ever changes a field name, `src/utils/externalAdapter.js` is the only place to update.

Ratings, comments and favorites on catalog novels attach to a lightweight record mirrored into your MongoDB
the first time a logged-in reader opens the novel; the story text is always read live and never copied.
18+ novels are hidden from the hero/search until the reader confirms they are 18 or older (stored on the device).

## Where things live

- `src/components/EntryAnimation.*` — the glowing-book-and-petals splash,
  shown once per browser session (`sessionStorage`), then fades into Home.
- `src/pages/Reader.jsx` + `src/utils/paginate.js` — the reading screen.
  Chapter text is paginated to roughly one screen per "page" at the current
  font settings, then pages animate between each other in one of three
  styles (`curl`, `slide`, `fade`) set from the in-reader **Aa** button.
  Swipe left/right or tap the left/right edges to turn pages; it steps to
  the next/previous chapter automatically at the ends.
- `src/context/ReaderPrefsContext.jsx` — persists font family/size, line
  height, page background, page-turn style and accent color to
  `localStorage`, independent of the app's own light/dark theme
  (`AppThemeContext`).
- `src/pages/AuthorDashboard.jsx` + `NovelManage.jsx` — publish a novel
  (cover upload, genres, synopsis) and write/edit/publish or draft chapters
  from one continuous flow.
- `src/services/api.js` — every backend call, plus the `/external/*` calls
  that proxy the pre-existing discovery API through your own backend.

## Notes / next steps

This is a complete, working MVP wired end-to-end — not a mockup. A few
things worth doing before a real launch:
- Hook up the `/external/*` endpoints in the UI (e.g. an extra "Discover"
  row on Home) if you want the third-party catalog visible alongside
  original uploads — the backend proxy is already there.
- Add an age gate / confirmation before showing "18+" genre content.
- Swap the plain-textarea chapter editor for a rich-text editor if authors
  want inline formatting (bold/italic/scene breaks).
- Add reading-progress tracking (last page read per chapter) if you want a
  "Continue reading" row on Home.
