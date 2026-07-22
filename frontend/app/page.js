"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [prediction, setPrediction] = useState("");
  const [riskScore, setRiskScore] = useState(null);
  const [severity, setSeverity] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAlertsCount, setOpenAlertsCount] = useState(0);

  // On page load, check if the user is already logged in (e.g. came back via browser Back button)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedUsername = localStorage.getItem("username");
    if (savedToken) {
      setToken(savedToken);
      setRole(savedRole || "");
      setUsername(savedUsername || "");
    }
  }, []);

  // Fetch the count of open alerts whenever we have a valid token
  useEffect(() => {
    if (!token) return;

    fetch("http://127.0.0.1:8000/alerts", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const openCount = data.filter((a) => a.status === "Open").length;
        setOpenAlertsCount(openCount);
      })
      .catch(() => setOpenAlertsCount(0));
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Login failed. Check your username and password.");
      }

      const data = await response.json();
      setToken(data.access_token);
      setRole(data.role);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          username,
          email: email || null,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed.");
      }

      setMessage("Account created! You can now log in.");
      setMode("login");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setError("");
    setPrediction("");
    setRiskScore(null);
    setSeverity("");
    setConfidence(null);
    setLoading(true);

    try {
      // Fetch one real random traffic record from the dataset
      const sampleRes = await fetch("http://127.0.0.1:8000/sample-traffic", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!sampleRes.ok) {
        throw new Error("Failed to fetch sample traffic data.");
      }

      const sampleData = await sampleRes.json();

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ features: sampleData.features }),
      });

      if (!response.ok) {
        throw new Error("Prediction failed. Try logging in again.");
      }

      const data = await response.json();
      setPrediction(data.prediction);
      setRiskScore(data.risk_score);
      setSeverity(data.severity);
      setConfidence(data.confidence);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setRole("");
    setPrediction("");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setUsername("");
    setPassword("");
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setMessage("");
  };

  const severityColor = (sev) => {
    if (sev === "Critical") return "text-red-400 bg-red-500/10 border-red-500/30";
    if (sev === "High") return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (sev === "Medium") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
  };

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">

        <div className="hidden md:flex flex-col items-center text-center">
          <svg viewBox="0 0 200 200" className="w-64 h-64 mb-6">
            <path
              d="M100 15 L165 40 L165 95 C165 140 135 175 100 190 C65 175 35 140 35 95 L35 40 Z"
              fill="rgba(59,130,246,0.08)"
              stroke="#3b82f6"
              strokeWidth="2.5"
            />
            <path
              d="M75 100 L92 118 L128 78"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="30" cy="60" r="4" fill="#3b82f6" />
            <circle cx="170" cy="60" r="4" fill="#3b82f6" />
            <circle cx="20" cy="120" r="3" fill="#22d3ee" />
            <circle cx="180" cy="120" r="3" fill="#22d3ee" />
            <circle cx="100" cy="10" r="3" fill="#22d3ee" />
            <line x1="30" y1="60" x2="35" y2="55" stroke="#3b82f6" strokeWidth="1" opacity="0.5" />
            <line x1="170" y1="60" x2="165" y2="55" stroke="#3b82f6" strokeWidth="1" opacity="0.5" />
            <line x1="20" y1="120" x2="35" y2="105" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
            <line x1="180" y1="120" x2="165" y2="105" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Real-Time Threat Detection</h2>
          <p className="text-slate-400 max-w-xs">
            AI-powered monitoring that identifies suspicious network activity before it becomes a security incident.
          </p>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6 md:hidden">
            <h1 className="text-3xl font-bold text-white">NetShield AI</h1>
            <p className="text-slate-400 mt-1">Network Anomaly Detection Dashboard</p>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="hidden md:block mb-6">
              <h1 className="text-2xl font-bold text-white">NetShield AI</h1>
              <p className="text-slate-500 text-sm">Network Anomaly Detection Dashboard</p>
            </div>

            {!token ? (
              <>
                <div className="flex mb-6 bg-slate-950 rounded-lg p-1 border border-slate-800">
                  <button
                    onClick={() => switchMode("login")}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                      mode === "login"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => switchMode("signup")}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                      mode === "signup"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    {mode === "login" ? "Security Analyst Login" : "Create an Account"}
                  </h2>

                  {mode === "signup" && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Full name</label>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      placeholder="analyst1"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {mode === "signup" && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        Email <span className="text-slate-600">(optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {mode === "signup" && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Confirm password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    {loading
                      ? mode === "login"
                        ? "Logging in..."
                        : "Creating account..."
                      : mode === "login"
                      ? "Log In"
                      : "Sign Up"}
                  </button>
                </form>

                {message && (
                  <p className="text-green-400 text-sm mt-4 text-center">{message}</p>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Logged in as {username} ({role})
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-400 text-xs underline"
                  >
                    Logout
                  </button>
                </div>

                <a
                  href="/dashboard"
                  className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition mb-4"
                >
                  View Traffic Dashboard
                </a>

                <a
                  href="/alerts"
                  className="relative block w-full text-center bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition mb-4"
                >
                  Threat Alerts
                  {openAlertsCount > 0 && (
                    <span className="absolute top-1/2 right-4 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {openAlertsCount} open
                    </span>
                  )}
                </a>

                {role === "admin" && (
                  <a
                    href="/admin"
                    className="block w-full text-center bg-red-800 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition mb-4"
                  >
                    Admin Panel
                  </a>
                )}

                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mb-4"
                >
                  {loading ? "Analyzing traffic..." : "Run Sample Prediction"}
                </button>

                {prediction && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-left space-y-3">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Prediction Result</p>
                      <p className="text-2xl font-bold text-white">{prediction}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Risk Score</p>
                        <p className="text-xl font-bold text-white">{riskScore}/100</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${severityColor(severity)}`}>
                        {severity}
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xs">
                        Model confidence: {confidence}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
            )}
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            NetShield AI © 2026 — Powered by Machine Learning
          </p>
        </div>
      </div>
    </main>
  );
}