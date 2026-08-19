import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch {
      setMessage("Something went wrong. Please try again.");
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
        <div className="section-title" style={{ fontSize: "0.95rem" }}>Forgot Password</div>
        {message ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>{message}</p>
        ) : (
          <form onSubmit={submit}>
            <input placeholder="Your account email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
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
