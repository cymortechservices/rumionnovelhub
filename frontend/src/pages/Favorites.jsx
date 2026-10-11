import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchNovel } from "../services/api";
import NovelCard from "../components/NovelCard";
import { useNavigate } from "react-router-dom";
import "./Browse.css";

export default function Favorites() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [novels, setNovels] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user?.favorites?.length) {
      setFetching(false);
      return;
    }
    Promise.all(user.favorites.map((id) => fetchNovel(id).then((d) => d.novel).catch(() => null)))
      .then((list) => setNovels(list.filter(Boolean)))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) return <p className="muted container">Loading…</p>;

  if (!user) {
    return (
      <div className="container author-cta">
        <h2 className="font-display">Your favorites</h2>
        <p className="muted">Log in to save novels and pick up where you left off.</p>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>Log in</button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display page-title">Favorites</h2>
      {fetching ? (
        <p className="muted container">Loading…</p>
      ) : novels.length === 0 ? (
        <p className="muted container">Nothing favorited yet — tap the ♡ on any novel.</p>
      ) : (
        <div className="browse__grid container">
          {novels.map((n) => (
            <NovelCard key={n._id} novel={n} />
          ))}
        </div>
      )}
    </div>
  );
}
