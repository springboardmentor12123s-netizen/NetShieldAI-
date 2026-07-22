"use client";

import { useEffect, useState } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);
  const [role, setRole] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAlerts = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You're not logged in. Please log in first.");
      return;
    }

    fetch("http://127.0.0.1:8000/alerts", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch alerts (status " + res.status + ")");
        }
        return res.json();
      })
      .then((data) => setAlerts(data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    fetchAlerts();
  }, []);

  const handleResolve = async (alertId) => {
    setResolvingId(alertId);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/alerts/${alertId}/resolve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resolve alert");
      }

      fetchAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  const severityColor = (sev) => {
    if (sev === "Critical") return "text-red-400 bg-red-500/10 border-red-500/30";
    if (sev === "High") return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (sev === "Medium") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
  };

  const filteredAlerts = alerts
    ? alerts.filter((a) => {
        const matchesSeverity =
          severityFilter === "All" || a.severity === severityFilter;
        const matchesStatus =
          statusFilter === "All" || a.status === statusFilter;
        return matchesSeverity && matchesStatus;
      })
    : [];

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900/70 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-red-400">{error}</p>
          <a
            href="/"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline"
          >
            Go to login
          </a>
        </div>
      </main>
    );
  }

  if (!alerts) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-400">Loading alerts...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Threat Alerts</h1>
            <p className="text-slate-500 text-sm">
              Alerts generated from high-risk predictions
            </p>
          </div>
          <a href="/" className="text-slate-400 hover:text-white text-sm underline">
            Back to home
          </a>
        </div>

        <div className="flex gap-3 mb-6">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-500">
              {alerts.length === 0
                ? "No alerts yet. Run a prediction to generate one."
                : "No alerts match the selected filters."}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-slate-400 text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-slate-400 text-sm font-medium">Risk</th>
                  <th className="px-4 py-3 text-slate-400 text-sm font-medium">Severity</th>
                  <th className="px-4 py-3 text-slate-400 text-sm font-medium">Detected by</th>
                  <th className="px-4 py-3 text-slate-400 text-sm font-medium">Status</th>
                  {role === "admin" && (
                    <th className="px-4 py-3 text-slate-400 text-sm font-medium">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((a) => (
                  <tr key={a.id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-white">{a.prediction}</td>
                    <td className="px-4 py-3 text-white">{a.risk_score}/100</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${severityColor(
                          a.severity
                        )}`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{a.detected_by}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          a.status === "Resolved"
                            ? "bg-slate-700 text-slate-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    {role === "admin" && (
                      <td className="px-4 py-3">
                        {a.status === "Open" ? (
                          <button
                            onClick={() => handleResolve(a.id)}
                            disabled={resolvingId === a.id}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            {resolvingId === a.id ? "Resolving..." : "Resolve"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}