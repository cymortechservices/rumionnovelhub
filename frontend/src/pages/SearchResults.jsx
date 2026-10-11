import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchExternal } from "../services/api";
import { unwrapList, normalizeNovel } from "../utils/externalAdapter";
import { isAgeConfirmed } from "../utils/ageGate";
import NovelCard from "../components/NovelCard";
import "./Browse.css";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    searchExternal(q, 1, 40)
      .then((res) => {
        if (!alive) return;
        const list = unwrapList(res).map(normalizeNovel).filter(Boolean);
        setNovels(isAgeConfirmed() ? list : list.filter((n) => !n.isMature));
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q]);

  return (
    <div>
      <div className="browse__head">
        <h2 className="font-display page-title" style={{ padding: 0 }}>“{q}”</h2>
        <Link to="/" className="muted" style={{ fontSize: 13 }}>Back home</Link>
      </div>
      {loading ? (
        <p className="muted container">Searching…</p>
      ) : novels.length === 0 ? (
        <p className="muted container">No novels found for that search.</p>
      ) : (
        <div className="browse__grid container">
          {novels.map((n) => <NovelCard key={n.id} novel={n} source="external" />)}
        </div>
      )}
    </div>
  );
}
