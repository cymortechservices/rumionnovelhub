import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../services/api";
import PasswordField from "../components/PasswordField";
import "./Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ penName: "", email: "", password: "", becomeAuthor: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.penName.trim().length < 2) return setError("Choose a pen name with at least 2 characters.");
    if (form.password.length < 6) return setError("Your password needs at least 6 characters.");
    setLoading(true);
    try {
      await register({ ...form, penName: form.penName.trim(), email: form.email.trim() });
      navigate(form.becomeAuthor ? "/author" : "/", { replace: true });
    } catch (err) {
      setError(apiError(err, "Couldn't create your account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth container">
      <h2 className="font-display">Join Rumion</h2>
      <p className="muted">It takes a few seconds. You can always read without an account.</p>
      <form onSubmit={submit} className="auth__form" noValidate>
        <input
          className="input"
          placeholder="Pen name"
          value={form.penName}
          onChange={(e) => set("penName")(e.target.value)}
          autoComplete="nickname"
          required
        />
        <input
          className="input"
          type="email"
          inputMode="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          required
        />
        <PasswordField
          value={form.password}
          onChange={set("password")}
          placeholder="Password (6+ characters)"
          autoComplete="new-password"
          minLength={6}
        />
        <label className="auth__checkbox">
          <input type="checkbox" checked={form.becomeAuthor} onChange={(e) => set("becomeAuthor")(e.target.checked)} />
          I want to publish my own novels
        </label>
        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="muted auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
      <p className="muted auth__switch">
        <Link to="/">Just browsing? Keep reading as a guest</Link>
      </p>
    </div>
  );
}
