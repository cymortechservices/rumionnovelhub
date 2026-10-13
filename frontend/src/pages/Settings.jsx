import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/AppThemeContext";
import { useReaderPrefs } from "../context/ReaderPrefsContext";
import { apiError, updateMe } from "../services/api";
import { APP_VERSION, DEVELOPER } from "../constants/app";
import { FONT_STACKS, getReaderTheme } from "../constants/readerThemes";
import { clearAgeConfirmation, isAgeConfirmed } from "../utils/ageGate";
import { clearProgress, useProgressList } from "../utils/progress";
import ReaderControls from "../components/ReaderControls";
import DedicationCard from "../components/DedicationCard";
import "./Settings.css";

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { dark, setDark } = useAppTheme();
  const { prefs, updatePrefs, resetPrefs } = useReaderPrefs();
  const navigate = useNavigate();
  const inProgress = useProgressList(true);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ penName: "", bio: "" });
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ageOk, setAgeOk] = useState(isAgeConfirmed());

  const theme = getReaderTheme(prefs);
  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2400);
  };

  const startEdit = () => {
    setForm({ penName: user.penName || "", bio: user.bio || "" });
    setAvatar(null);
    setError("");
    setEditing(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("penName", form.penName);
      fd.append("bio", form.bio);
      if (avatar) fd.append("avatar", avatar);
      const { user: updated } = await updateMe(fd);
      setUser((u) => ({ ...u, ...updated }));
      setEditing(false);
      flash("Profile saved");
    } catch (err) {
      setError(apiError(err, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings">
      <h2 className="font-display page-title">Settings</h2>

      {/* ---- profile ---- */}
      <section className="set-profile">
        <div className="set-profile__banner" aria-hidden="true" />
        <div className="set-profile__row">
          <div className="set-avatar">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{(user?.penName || "G")[0]}</span>}
          </div>
          <div className="set-profile__who">
            <p className="set-profile__name">{user ? user.penName : "Guest reader"}</p>
            <p className="muted set-profile__sub">{user ? user.email : "Reading without an account"}</p>
          </div>
          {user?.isAuthor && <span className="tag">Author</span>}
        </div>

        {user ? (
          <>
            {user.bio && <p className="set-profile__bio">{user.bio}</p>}
            <div className="set-stats">
              <div>
                <b>{inProgress.length}</b>
                <span>Reading</span>
              </div>
              <div>
                <b>{user.favorites?.length || 0}</b>
                <span>Favorites</span>
              </div>
            </div>
            {editing ? (
              <form className="set-edit" onSubmit={saveProfile}>
                <input
                  className="input"
                  placeholder="Pen name"
                  value={form.penName}
                  onChange={(e) => setForm((f) => ({ ...f, penName: e.target.value }))}
                  minLength={2}
                  required
                />
                <textarea
                  className="input"
                  rows={3}
                  maxLength={300}
                  placeholder="A line about you"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
                <label className="set-edit__file">
                  Profile photo
                  <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0] || null)} />
                </label>
                {error && <p className="set-error" role="alert">{error}</p>}
                <div className="set-edit__actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save profile"}
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn btn-ghost btn-block" onClick={startEdit}>
                Edit profile
              </button>
            )}
          </>
        ) : (
          <div className="set-guest">
            <p className="muted">
              Create a free account to comment, rate, save favorites and publish your own novels.
            </p>
            <div className="set-guest__actions">
              <button className="btn btn-primary" onClick={() => navigate("/register")}>
                Create account
              </button>
              <button className="btn btn-ghost" onClick={() => navigate("/login")}>
                Log in
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---- the dedication ---- */}
      <DedicationCard />

      {/* ---- appearance ---- */}
      <section className="set-card">
        <h3 className="font-display">Appearance</h3>
        <div className="set-seg" role="radiogroup" aria-label="App theme">
          <button role="radio" aria-checked={!dark} className={!dark ? "is-active" : ""} onClick={() => setDark(false)}>
            Light
          </button>
          <button role="radio" aria-checked={dark} className={dark ? "is-active" : ""} onClick={() => setDark(true)}>
            Dark
          </button>
        </div>
      </section>

      {/* ---- reading ---- */}
      <section className="set-card">
        <h3 className="font-display">Reading</h3>
        <p className="muted set-card__hint">These apply to every novel. You can also change them while reading with the Aa button.</p>
        <div
          className="set-preview"
          style={{
            background: theme.bg,
            color: theme.text,
            fontFamily: FONT_STACKS[prefs.fontFamily],
            fontSize: `${prefs.fontSize}px`,
            lineHeight: prefs.lineHeight,
          }}
        >
          <p>The lantern swayed once, and every page in the library breathed in.</p>
        </div>
        <ReaderControls prefs={prefs} onChange={updatePrefs} onReset={resetPrefs} />
      </section>

      {/* ---- your data ---- */}
      <section className="set-card">
        <h3 className="font-display">On this device</h3>
        <div className="set-row">
          <div>
            <p className="set-row__title">Reading history</p>
            <p className="muted set-row__sub">
              {inProgress.length ? `${inProgress.length} book${inProgress.length > 1 ? "s" : ""} in progress` : "Nothing in progress"}
            </p>
          </div>
          <button
            className="btn btn-ghost set-small"
            disabled={!inProgress.length}
            onClick={() => {
              if (window.confirm("Clear your reading history on this device?")) {
                clearProgress();
                flash("Reading history cleared");
              }
            }}
          >
            Clear
          </button>
        </div>
        <div className="set-row">
          <div>
            <p className="set-row__title">18+ confirmation</p>
            <p className="muted set-row__sub">{ageOk ? "Confirmed on this device" : "Not confirmed"}</p>
          </div>
          <button
            className="btn btn-ghost set-small"
            disabled={!ageOk}
            onClick={() => {
              clearAgeConfirmation();
              setAgeOk(false);
              flash("18+ confirmation removed");
            }}
          >
            Reset
          </button>
        </div>
      </section>

      {/* ---- about ---- */}
      <section className="set-card">
        <h3 className="font-display">About</h3>
        <div className="set-row">
          <p className="set-row__title">Rumion Novel Hub</p>
          <span className="muted">Version {APP_VERSION}</span>
        </div>
        <div className="set-row">
          <p className="set-row__title">Developer</p>
          <span className="muted">{DEVELOPER}</span>
        </div>
        {user?.isAuthor && (
          <div className="set-row">
            <p className="set-row__title">Author desk</p>
            <Link to="/author" className="set-link">Open</Link>
          </div>
        )}
      </section>

      {user && (
        <div className="container set-logout">
          <button className="btn btn-ghost btn-block" onClick={() => { logout(); navigate("/"); }}>
            Log out
          </button>
        </div>
      )}

      {notice && (
        <div className="set-toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
