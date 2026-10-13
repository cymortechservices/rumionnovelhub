import { useState } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import EntryAnimation from "./components/EntryAnimation";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import SearchResults from "./pages/SearchResults";
import NovelDetail from "./pages/NovelDetail";
import ExternalNovelDetail from "./pages/ExternalNovelDetail";
import Reader from "./pages/Reader";
import ExternalReader from "./pages/ExternalReader";
import ContinuePage from "./pages/ContinuePage";
import AuthorDashboard from "./pages/AuthorDashboard";
import NovelManage from "./pages/NovelManage";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { listContinue } from "./utils/progress";
import { session } from "./utils/store";

export default function App() {
  const [showEntry, setShowEntry] = useState(() => !session.get("rumion_entry_seen"));
  // only a visit that starts on Home gets the "continue reading" welcome (never a shared deep link)
  const [startedOnHome] = useState(() => window.location.pathname === "/");
  const location = useLocation();

  const path = location.pathname;
  const isReader = path.startsWith("/read/") || path.startsWith("/external/read/");
  const hideNav = isReader || path === "/continue";

  const finishEntry = () => {
    session.set("rumion_entry_seen", "true");
    setShowEntry(false);
  };

  if (showEntry) return <EntryAnimation onDone={finishEntry} />;

  if (startedOnHome && path === "/" && !session.get("rumion_continue_seen") && listContinue().length > 0) {
    return <Navigate to="/continue" replace />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/continue" element={<ContinuePage />} />
        <Route path="/browse/:genre" element={<Browse />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/novel/:id" element={<NovelDetail />} />
        <Route path="/external/novel/:detailPath" element={<ExternalNovelDetail />} />
        <Route path="/read/:chapterId" element={<Reader />} />
        <Route path="/external/read/:detailPath/:chapterId" element={<ExternalReader />} />
        <Route path="/author" element={<AuthorDashboard />} />
        <Route path="/author/novel/:id" element={<NovelManage />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}
