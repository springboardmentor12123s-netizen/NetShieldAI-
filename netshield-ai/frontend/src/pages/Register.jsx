import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", full_name: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Account created — please sign in");
      navigate("/login");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : detail || "Registration failed");
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
          <input placeholder="Username" value={form.username} onChange={update("username")} required />
          <input placeholder="Email" type="email" value={form.email} onChange={update("email")} required />
          <input placeholder="Full name (optional)" value={form.full_name} onChange={update("full_name")} />
          <input placeholder="Password" type="password" value={form.password} onChange={update("password")} required />
          <PasswordStrengthMeter password={form.password} />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link className="muted-link" to="/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
}
