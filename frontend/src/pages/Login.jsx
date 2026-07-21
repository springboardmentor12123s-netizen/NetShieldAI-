import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RadarCanvas from "../components/RadarCanvas";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <RadarCanvas />
        <div className="login-visual-content">
          <h2>Every packet tells a story. NetShield AI reads it in real time.</h2>
          <p>
            Unsupervised anomaly detection, attack classification, and composite risk scoring —
            watching your network so your team doesn't have to watch every flow by hand.
          </p>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div className="brand">
            <div className="brand-mark"></div>
            <div>
              <div className="brand-name">NetShield AI</div>
              <div className="brand-sub">Threat Monitoring</div>
            </div>
          </div>

          <h1>Sign in</h1>
          <p className="sub">Access the security operations console.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@netshield.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>

          <div className="demo-creds">
            demo admin &nbsp;→&nbsp; admin@netshield.ai / Admin@123<br />
            demo analyst &nbsp;→&nbsp; analyst@netshield.ai / Analyst@123
          </div>
        </div>
      </div>
    </div>
  );
}
