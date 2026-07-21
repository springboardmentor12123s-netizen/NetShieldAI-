import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Badge, EmptyState } from "../components/UI";
import { Api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../lib/format";

export default function Alerts() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = useCallback(async () => {
    setAlerts(await Api.get("/alerts?limit=100"));
  }, []);

  useEffect(() => {
    loadAlerts().catch((err) => showToast(err.message, "error"));
  }, [loadAlerts, showToast]);

  async function handleAcknowledge(id) {
    try {
      await Api.post(`/alerts/${id}/acknowledge`, {});
      showToast("Alert acknowledged");
      loadAlerts();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>Alerts</h1>
          <div className="topbar-sub">Auto-generated from high and critical risk detections</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18, borderColor: "rgba(76,141,255,0.25)", background: "var(--accent-blue-dim)" }}>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
          This is a preview of alert management. Full incident workflows, notification routing (Email/SMS/Slack), and escalation rules ship in Milestone 3.
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div className="panel-title">Open &amp; recent alerts</div></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Alert</th><th>Severity</th><th>Risk score</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {alerts.length ? alerts.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.created_at)}</td>
                  <td className="primary">{a.title}</td>
                  <td><Badge level={a.severity} /></td>
                  <td>{a.risk_score}</td>
                  <td>{a.status}</td>
                  <td>
                    {a.status === "open" && (
                      <button className="btn btn-ghost" onClick={() => handleAcknowledge(a.id)}>Acknowledge</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6}><EmptyState>No alerts yet. Score traffic on the Anomaly Detection page to generate some.</EmptyState></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
