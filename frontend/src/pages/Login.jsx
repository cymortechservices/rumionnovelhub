import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../services/api";
import PasswordField from "../components/PasswordField";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiError(err, "Couldn't log you in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth container">
      <h2 className="font-display">Welcome back</h2>
      <p className="muted">Log in to comment, rate and keep your favorites.</p>
      <form onSubmit={submit} className="auth__form">
        <input
          className="input"
          type="email"
          inputMode="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          autoComplete="email"
          autoCapitalize="none"
          required
        />
        <PasswordField
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          autoComplete="current-password"
        />
        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="muted auth__switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
      <p className="muted auth__switch">
        <Link to="/">Keep reading as a guest</Link>
      </p>
    </div>
  );
}
