import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not reset password");
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
        <div className="section-title" style={{ fontSize: "0.95rem" }}>Reset Password</div>
        {!token && <div className="error-text">Missing or invalid reset link.</div>}
        {error && <div className="error-text">{error}</div>}
        {done ? (
          <p style={{ color: "var(--low)", fontSize: "0.85rem" }}>Password reset — redirecting to sign in…</p>
        ) : (
          <form onSubmit={submit}>
            <input placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordStrengthMeter password={password} />
            <button className="btn-primary" type="submit" disabled={loading || !token}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link className="muted-link" to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
