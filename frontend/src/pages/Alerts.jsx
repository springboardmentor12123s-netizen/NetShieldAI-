import { useCallback, useEffect, useState } from "react";
import LineChart from "../components/LineChart";
import { Badge, EmptyState, StatCard } from "../components/UI";
import { Api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../lib/format";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
  { value: "false_positive", label: "False positive" },
];

export default function Alerts() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState({});
  const [noteDraft, setNoteDraft] = useState({});

  const loadAlerts = useCallback(async (filter, source) => {
    const params = new URLSearchParams({ limit: "100" });
    if (filter) params.set("status_filter", filter);
    if (source) params.set("source_filter", source);
    setAlerts(await Api.get(`/alerts?${params.toString()}`));
  }, []);

  const loadStats = useCallback(async () => {
    setStats(await Api.get("/alerts/stats"));
  }, []);

  useEffect(() => {
    loadStats().catch((err) => showToast(err.message, "error"));
  }, [loadStats, showToast]);

  useEffect(() => {
    loadAlerts(statusFilter, sourceFilter).catch((err) => showToast(err.message, "error"));
  }, [statusFilter, sourceFilter, loadAlerts, showToast]);

  function handleSelectStatus(id, newStatus) {
    setPendingStatus((prev) => ({ ...prev, [id]: newStatus }));
    setExpandedId(id);
  }

  async function handleConfirmStatus(id) {
    const newStatus = pendingStatus[id];
    const notes = noteDraft[id]?.trim() || null;
    setUpdatingId(id);
    try {
      await Api.post(`/alerts/${id}/status`, { status: newStatus, notes });
      showToast(`Alert marked as ${newStatus.replace("_", " ")}`);
      setExpandedId(null);
      setNoteDraft((prev) => ({ ...prev, [id]: "" }));
      await Promise.all([loadAlerts(statusFilter, sourceFilter), loadStats()]);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleCancelStatus(id, originalStatus) {
    setPendingStatus((prev) => ({ ...prev, [id]: originalStatus }));
    setExpandedId(null);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Alerts</h1>
          <div className="topbar-sub">Auto-generated from high and critical risk detections</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            className={`chip ${sourceFilter === "" ? "active" : ""}`}
            onClick={() => setSourceFilter("")}
          >
            All sources
          </span>
          <span
            className={`chip ${sourceFilter === "live_capture" ? "active" : ""}`}
            onClick={() => setSourceFilter("live_capture")}
          >
            🔴 Live capture only
          </span>
          <span
            className={`chip ${sourceFilter === "synthetic" ? "active" : ""}`}
            onClick={() => setSourceFilter("synthetic")}
          >
            Synthetic only
          </span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-4" style={{ marginBottom: 18 }}>
          <StatCard label="Open" value={stats.total_open} />
          <StatCard label="Acknowledged" value={stats.total_acknowledged} />
          <StatCard label="Resolved" value={stats.total_resolved} />
          <StatCard label="Critical (all time)" value={stats.total_critical} />
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Alerts — last 7 days</div></div>
          <LineChart points={(stats?.trend || []).map((t) => ({ time: t.day, count: t.count }))} />
        </div>
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Status breakdown</div></div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 8 }}>
            {stats?.resolved_today ?? 0} alert(s) resolved today · {stats?.total_false_positive ?? 0} marked false positive
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Open &amp; recent alerts</div>
          <div className="chip-row" style={{ margin: 0 }}>
            {["", ...STATUS_OPTIONS.map((s) => s.value)].map((s) => (
              <span
                key={s || "all"}
                className={`chip ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s ? STATUS_OPTIONS.find((o) => o.value === s)?.label : "All"}
              </span>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Alert</th><th>Source</th><th>Severity</th><th>Risk score</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {alerts.length ? alerts.map((a) => (
                <>
                  <tr key={a.id}>
                    <td>{formatDateTime(a.created_at)}</td>
                    <td className="primary">{a.title}</td>
                    <td>
                      {a.source === "live_capture" ? (
                        <span style={{ color: "var(--signal-cyan)", fontSize: 11.5, fontWeight: 600 }}>● LIVE</span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)", fontSize: 11.5 }}>synthetic</span>
                      )}
                    </td>
                    <td><Badge level={a.severity} /></td>
                    <td>{a.risk_score}</td>
                    <td style={{ textTransform: "capitalize" }}>{a.status.replace("_", " ")}</td>
                    <td>
                      <select
                        value={pendingStatus[a.id] ?? a.status}
                        disabled={updatingId === a.id}
                        onChange={(e) => handleSelectStatus(a.id, e.target.value)}
                        style={{
                          background: "var(--bg-base)",
                          border: "1px solid var(--border-hair)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-primary)",
                          fontSize: 12.5,
                          padding: "5px 8px",
                        }}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === a.id && (
                    <tr>
                      <td colSpan={7} style={{ background: "var(--bg-panel-raised)", padding: "14px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            Add a note (optional) — marking as{" "}
                            <strong style={{ color: "var(--text-primary)" }}>
                              {STATUS_OPTIONS.find((o) => o.value === pendingStatus[a.id])?.label}
                            </strong>
                          </label>
                          <textarea
                            value={noteDraft[a.id] || ""}
                            onChange={(e) => setNoteDraft((prev) => ({ ...prev, [a.id]: e.target.value }))}
                            placeholder="e.g. Confirmed with team — internal vulnerability scan"
                            rows={2}
                            style={{
                              background: "var(--bg-base)",
                              border: "1px solid var(--border-hair)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              padding: "8px 10px",
                              resize: "vertical",
                              fontFamily: "var(--font-body)",
                            }}
                          />
                          {a.notes && (
                            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>
                              Previous note: {a.notes}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleConfirmStatus(a.id)}
                              disabled={updatingId === a.id}
                            >
                              {updatingId === a.id ? "Saving…" : "Confirm"}
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => handleCancelStatus(a.id, a.status)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )) : (
                <tr><td colSpan={7}><EmptyState>No alerts yet. Score traffic on the Anomaly Detection page to generate some.</EmptyState></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}