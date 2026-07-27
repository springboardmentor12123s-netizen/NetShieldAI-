import React, { useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import api from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Skeleton from "../components/Skeleton.jsx";
import usePolling from "../hooks/usePolling.js";

const PAGE_SIZE = 15;

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [resolvedFilter, setResolvedFilter] = useState("false");
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        api.get("/alerts", {
          params: {
            resolved: resolvedFilter === "" ? undefined : resolvedFilter === "true",
            severity: severity || undefined,
            search: search || undefined,
            page,
            page_size: PAGE_SIZE,
          },
        }),
        api.get("/alerts/summary"),
      ]);
      setAlerts(a.data.items);
      setTotal(a.data.total);
      setSummary(s.data);
    } finally {
      setLoading(false);
    }
  };

  // Feature 4 — alerts refresh automatically, no manual reload needed.
  usePolling(load, 4000, [page, resolvedFilter, severity]);

  const runSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const resolve = async (id) => {
    await api.post(`/alerts/${id}/resolve`);
    toast.success("Alert resolved");
    await load();
  };

  const markFalsePositive = async (id) => {
    await api.post(`/alerts/${id}/false-positive`);
    toast.success("Marked as false positive");
    await load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="section-title">Alerts</div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="glass-card"><div className="stat-label">Total</div><div className="stat-value">{summary?.total ?? "—"}</div></div>
        <div className="glass-card"><div className="stat-label">Critical</div><div className="stat-value critical">{summary?.critical ?? "—"}</div></div>
        <div className="glass-card"><div className="stat-label">High</div><div className="stat-value" style={{ color: "var(--high)" }}>{summary?.high ?? "—"}</div></div>
        <div className="glass-card"><div className="stat-label">False Positives</div><div className="stat-value" style={{ color: "var(--medium)" }}>{summary?.false_positives ?? "—"}</div></div>
      </div>

      <form onSubmit={runSearch} className="glass-card" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-dim)" }} />
          <input className="input-field" style={{ paddingLeft: 30 }} placeholder="Search by IP or attack type" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ width: 150 }} value={resolvedFilter} onChange={(e) => { setResolvedFilter(e.target.value); setPage(1); }}>
          <option value="false">Active</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
        <select className="input-field" style={{ width: 150 }} value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} type="submit">Search</button>
      </form>

      <div className="glass-card">
        {loading ? (
          <Skeleton height={240} />
        ) : alerts.length === 0 ? (
          <div className="empty-state">No alerts match these filters.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Source IP</th><th>Attack</th><th>Risk</th><th>Severity</th><th>Recommendation</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.source_ip}</td>
                    <td>{a.attack_type}</td>
                    <td>{a.risk_score}%</td>
                    <td><StatusBadge status={a.severity} label={a.severity} /></td>
                    <td style={{ color: "var(--text-dim)" }}>{a.recommendation}</td>
                    <td>{a.false_positive ? "False Positive" : a.resolved ? "Resolved" : "Active"}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      {!a.resolved && (
                        <>
                          <button className="logout-btn" onClick={() => resolve(a.id)}>Resolve</button>
                          <button className="logout-btn" onClick={() => markFalsePositive(a.id)}>False Positive</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Page {page} of {totalPages} · {total} alerts</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="icon-btn" style={{ width: "auto", padding: "4px 12px" }} disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                <button className="icon-btn" style={{ width: "auto", padding: "4px 12px" }} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
