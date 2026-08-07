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
  const [updatingId, setUpdatingId] = useState(null);

  const loadAlerts = useCallback(async (filter) => {
    const path = filter ? `/alerts?limit=100&status_filter=${filter}` : "/alerts?limit=100";
    setAlerts(await Api.get(path));
  }, []);

  const loadStats = useCallback(async () => {
    setStats(await Api.get("/alerts/stats"));
  }, []);

  useEffect(() => {
    loadStats().catch((err) => showToast(err.message, "error"));
  }, [loadStats, showToast]);

  useEffect(() => {
    loadAlerts(statusFilter).catch((err) => showToast(err.message, "error"));
  }, [statusFilter, loadAlerts, showToast]);

  async function handleStatusChange(id, newStatus) {
    setUpdatingId(id);
    try {
      await Api.post(`/alerts/${id}/status`, { status: newStatus });
      showToast(`Alert marked as ${newStatus.replace("_", " ")}`);
      await Promise.all([loadAlerts(statusFilter), loadStats()]);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const trendMax = stats?.trend?.length ? Math.max(...stats.trend.map((t) => t.count), 1) : 1;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Alerts</h1>
          <div className="topbar-sub">Auto-generated from high and critical risk detections</div>
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
          {stats ? (
            <>
              <div className="bar-row">
                <div className="bar-label">Open</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(stats.total_open / trendMax) * 0 + (stats.total_open ? 100 : 0)}%` }} /></div>
              </div>
            </>
          ) : null}
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
              <tr><th>Time</th><th>Alert</th><th>Severity</th><th>Risk score</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {alerts.length ? alerts.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.created_at)}</td>
                  <td className="primary">{a.title}</td>
                  <td><Badge level={a.severity} /></td>
                  <td>{a.risk_score}</td>
                  <td style={{ textTransform: "capitalize" }}>{a.status.replace("_", " ")}</td>
                  <td>
                    <select
                      value={a.status}
                      disabled={updatingId === a.id}
                      onChange={(e) => handleStatusChange(a.id, e.target.value)}
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
              )) : (
                <tr><td colSpan={6}><EmptyState>No alerts yet. Score traffic on the Anomaly Detection page to generate some.</EmptyState></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}