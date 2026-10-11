import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import EntryAnimation from "./components/EntryAnimation";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import NovelDetail from "./pages/NovelDetail";
import Reader from "./pages/Reader";
import ExternalReader from "./pages/ExternalReader";
import ExternalNovelDetail from "./pages/ExternalNovelDetail";
import SearchResults from "./pages/SearchResults";
import AuthorDashboard from "./pages/AuthorDashboard";
import NovelManage from "./pages/NovelManage";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const [showEntry, setShowEntry] = useState(() => !sessionStorage.getItem("rumion_entry_seen"));
  const location = useLocation();
  const isReader = location.pathname.startsWith("/read/") || location.pathname.startsWith("/external/read/");

  const finishEntry = () => {
    sessionStorage.setItem("rumion_entry_seen", "true");
    setShowEntry(false);
  };

  if (showEntry) return <EntryAnimation onDone={finishEntry} />;

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse/:genre" element={<Browse />} />
        <Route path="/novel/:id" element={<NovelDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/external/novel/:detailPath" element={<ExternalNovelDetail />} />
        <Route path="/external/read/:detailPath/:chapterId" element={<ExternalReader />} />
        <Route path="/read/:chapterId" element={<Reader />} />
        <Route path="/author" element={<AuthorDashboard />} />
        <Route path="/author/novel/:id" element={<NovelManage />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      {!isReader && <BottomNav />}
    </div>
  );
}
