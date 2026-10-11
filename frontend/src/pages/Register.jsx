import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ penName: "", email: "", password: "", becomeAuthor: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth container">
      <h2 className="font-display">Join Rumion</h2>
      <p className="muted">Readers can browse and read without an account — sign up to comment, rate, favorite, or publish.</p>
      <form onSubmit={submit} className="auth__form">
        <input
          className="input"
          placeholder="Pen name"
          value={form.penName}
          onChange={(e) => setForm((f) => ({ ...f, penName: e.target.value }))}
          required
        />
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
          placeholder="Password (min. 6 characters)"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          minLength={6}
          required
        />
        <label className="auth__checkbox">
          <input
            type="checkbox"
            checked={form.becomeAuthor}
            onChange={(e) => setForm((f) => ({ ...f, becomeAuthor: e.target.checked }))}
          />
          I want to publish my own novels (set up as an author)
        </label>
        {error && <p className="auth__error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="muted auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
