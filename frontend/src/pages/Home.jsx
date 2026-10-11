import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchExternalFeatured, fetchExternalGenre, searchExternal, fetchNovels,
} from "../services/api";
import { unwrapList, normalizeNovel } from "../utils/externalAdapter";
import { CATEGORIES } from "../constants/externalGenres";
import { isAgeConfirmed } from "../utils/ageGate";
import HeroCarousel from "../components/HeroCarousel";
import CategoryRow from "../components/CategoryRow";
import "./Home.css";

const toNovels = (res) => unwrapList(res).map(normalizeNovel).filter(Boolean);

async function loadCategory(cat) {
  if (cat.search) return toNovels(await searchExternal(cat.search, 1, 12));
  const novels = toNovels(await fetchExternalGenre(cat.genreId, 1, cat.adult ? 40 : 12));
  return cat.adult ? novels.filter((n) => n.isMature).slice(0, 12) : novels.filter((n) => !n.isMature);
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [trending, setTrending] = useState([]);
  const [rows, setRows] = useState({});
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const adultOk = isAgeConfirmed();

  useEffect(() => {
    let alive = true;
    fetchNovels({ limit: 10, sort: "trending" })
      .then((d) => alive && setMine(d.novels.filter((n) => n.source === "original")))
      .catch(() => {});

    fetchExternalFeatured(1, 12)
      .then((res) => alive && setTrending(toNovels(res).filter((n) => !n.isMature).slice(0, 8)))
      .catch(() => alive && setFailed(true));

    // Rows load independently so one slow genre never blocks the page.
    let pending = CATEGORIES.length;
    CATEGORIES.forEach((cat) => {
      loadCategory(cat)
        .then((novels) => alive && setRows((r) => ({ ...r, [cat.key]: novels })))
        .catch(() => {})
        .finally(() => { pending -= 1; if (pending === 0 && alive) setLoading(false); });
    });
    return () => { alive = false; };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div>
      <form className="home__search container" onSubmit={submit}>
        <input className="input" placeholder="Search novels, authors, tags…" value={query}
          onChange={(e) => setQuery(e.target.value)} />
      </form>

      <HeroCarousel novels={trending} source="external" />

      {failed && (
        <div className="home__empty container">
          <p className="font-display" style={{ fontSize: 20 }}>Couldn't reach the library</p>
          <p className="muted">Check your connection and that the backend is running, then refresh.</p>
        </div>
      )}

      {mine.length > 0 && <CategoryRow title="From Rumion authors" novels={mine} source="original" />}

      {CATEGORIES.map((cat) => {
        if (cat.adult && !adultOk) {
          return (
            <section key={cat.key} className="category-row">
              <div className="category-row__head"><h3 className="font-display">{cat.label}</h3></div>
              <p className="container muted" style={{ fontSize: 13 }}>
                Mature stories. <Link to={`/browse/${cat.key}`} style={{ color: "var(--accent)", fontWeight: 600 }}>Confirm your age to view</Link>
              </p>
            </section>
          );
        }
        return (
          <CategoryRow key={cat.key} title={cat.label} novels={rows[cat.key]}
            viewAllTo={`/browse/${cat.key}`} source="external" />
        );
      })}

      {loading && <p className="muted home__loading">Gathering today's stories…</p>}
    </div>
  );
}
