import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't log you in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth container">
      <h2 className="font-display">Welcome back</h2>
      <p className="muted">Log in to comment, rate and keep your favorites in sync.</p>
      <form onSubmit={submit} className="auth__form">
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        {error && <p className="auth__error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="muted auth__switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
