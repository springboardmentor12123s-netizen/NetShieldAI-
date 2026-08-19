import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

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
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Save JWT first so /users/me can authenticate.
      localStorage.setItem(
        "netshield_token",
        res.data.access_token
      );

      // IMPORTANT:
      // Load the authenticated user and role BEFORE navigating.
      // This prevents the temporary "Security Analyst" display
      // when the logged-in user is actually an admin.
      await refreshUser();

      toast.success("Welcome back!");

      // "/" is the public landing page.
      // "/dashboard" is the protected dashboard.
      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      // Remove an invalid/stale token if authentication loading fails.
      if (err.response?.status === 401) {
        localStorage.removeItem("netshield_token");
      }

      setError(
        err.response?.data?.detail ||
        "Login failed. Please check your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="glass-card auth-card">

        {/* Logo */}
        <div
          className="brand"
          style={{
            marginBottom: 20,
            justifyContent: "center",
          }}
        >
          <span className="brand-mark" />
          NETSHIELD AI
        </div>

        {/* Error */}
        {error && (
          <div className="error-text">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={submit}>

          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {/* Remember Me */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.8rem",
              color: "var(--text-dim)",
              marginBottom: 14,
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: "auto",
                margin: 0,
              }}
            />
            Remember me
          </label>

          {/* Login Button */}
          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Links */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <Link
            className="muted-link"
            to="/forgot-password"
          >
            Forgot password?
          </Link>

          <Link
            className="muted-link"
            to="/register"
          >
            Create account
          </Link>
        </div>

      </div>
    </div>
  );
}