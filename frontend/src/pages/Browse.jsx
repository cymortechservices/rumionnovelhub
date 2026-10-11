import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchExternalGenre, searchExternal } from "../services/api";
import { unwrapList, unwrapPager, normalizeNovel } from "../utils/externalAdapter";
import { categoryByKey } from "../constants/externalGenres";
import { isAgeConfirmed } from "../utils/ageGate";
import AgeGate from "../components/AgeGate";
import NovelCard from "../components/NovelCard";
import "./Browse.css";

export default function Browse() {
  const { genre } = useParams();
  const navigate = useNavigate();
  const cat = categoryByKey(genre) || { key: genre, label: genre, search: genre };
  const [ok, setOk] = useState(!cat.adult || isAgeConfirmed());
  const [novels, setNovels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setNovels([]); setPage(1); }, [genre]);

  useEffect(() => {
    if (!ok) return;
    let alive = true;
    setLoading(true);
    const req = cat.search ? searchExternal(cat.search, page, 30) : fetchExternalGenre(cat.genreId, page, 30);
    req
      .then((res) => {
        if (!alive) return;
        let list = unwrapList(res).map(normalizeNovel).filter(Boolean);
        list = cat.adult ? list.filter((n) => n.isMature) : list.filter((n) => !n.isMature || cat.search);
        setNovels((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasMore(!!unwrapPager(res).hasMore);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, page, ok]);

  if (!ok) return <AgeGate onConfirm={() => setOk(true)} onLeave={() => navigate("/")} />;

  return (
    <div>
      <div className="browse__head">
        <h2 className="font-display page-title" style={{ padding: 0 }}>{cat.label}</h2>
      </div>
      {novels.length === 0 && !loading && <p className="muted container">Nothing here yet.</p>}
      <div className="browse__grid container">
        {novels.map((n) => <NovelCard key={n.id} novel={n} source="external" />)}
      </div>
      {loading && <p className="muted container" style={{ paddingTop: 12 }}>Loading…</p>}
      {!loading && hasMore && (
        <div className="container" style={{ padding: "18px 18px 0" }}>
          <button className="btn btn-ghost btn-block" onClick={() => setPage((p) => p + 1)}>Load more</button>
        </div>
      )}
    </div>
  );
}
