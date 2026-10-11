import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/AppThemeContext";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

export default function Settings() {
  const { user, logout } = useAuth();
  const { dark, setDark } = useAppTheme();
  const navigate = useNavigate();

  return (
    <div className="settings">
      <h2 className="font-display page-title">Settings</h2>

      {user ? (
        <section className="settings__section card container">
          <div className="settings__profile">
            <div className="settings__avatar">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.penName?.[0]}
            </div>
            <div>
              <p className="settings__name">{user.penName}</p>
              <p className="muted">{user.email}</p>
              {user.isAuthor && <span className="tag">Author</span>}
            </div>
          </div>
        </section>
      ) : (
        <section className="settings__section card container">
          <p className="muted" style={{ marginBottom: 10 }}>You're browsing as a guest.</p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>Log in / Sign up</button>
        </section>
      )}

      <section className="settings__group container">
        <h4 className="muted settings__group-title">Appearance</h4>
        <label className="settings__row">
          <span>Dark app theme</span>
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
        </label>
        <p className="muted settings__hint">
          This is the app's own look. Font, page color and page-turn animation for reading are set from the Aa button while reading a chapter.
        </p>
      </section>

      <section className="settings__group container">
        <h4 className="muted settings__group-title">About</h4>
        <div className="settings__row">
          <span>Version</span>
          <span className="muted">1.0.0</span>
        </div>
        <div className="settings__row">
          <span>Developer</span>
          <span className="muted">Legendary Smiley Cymor</span>
        </div>
        <p className="settings__dedication">
          Dedicated to my love, who loves reading and is a certified novel girlie. 📖
        </p>
      </section>

      {user && (
        <section className="settings__group container">
          <button className="btn btn-ghost btn-block" onClick={logout}>
            Log out
          </button>
        </section>
      )}
    </div>
  );
}
