import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api.js";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);
      form.append("remember_me", rememberMe);
      const res = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("netshield_token", res.data.access_token);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="glass-card auth-card">
        <div className="brand" style={{ marginBottom: 20, justifyContent: "center" }}>
          <span className="brand-mark" />
          NETSHIELD AI
        </div>
        {error && <div className="error-text">{error}</div>}
        <form onSubmit={submit}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: "auto", margin: 0 }}
            />
            Remember me
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <Link className="muted-link" to="/forgot-password">Forgot password?</Link>
          <Link className="muted-link" to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
