import { useCallback, useEffect, useState } from "react";
import LineChart from "../components/LineChart";
import { StatCard, BarRow, EmptyState } from "../components/UI";
import { Api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../lib/format";

const PERIOD_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export default function Reports() {
  const { showToast } = useToast();
  const [days, setDays] = useState(7);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async (period) => {
    setLoading(true);
    try {
      const data = await Api.get(`/reports/threat-intelligence?days=${period}`);
      setReport(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadReport(days);
  }, [days, loadReport]);

  function handlePrint() {
    window.print();
  }

  const attackEntries = report ? Object.entries(report.detection.attack_type_breakdown || {}) : [];
  const attackMax = attackEntries.length ? Math.max(...attackEntries.map(([, v]) => v), 1) : 1;
  const attackerMax = report?.top_attackers?.length ? Math.max(...report.top_attackers.map((a) => a.count), 1) : 1;
  const targetMax = report?.top_targets?.length ? Math.max(...report.top_targets.map((t) => t.count), 1) : 1;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Threat Intelligence Report</h1>
          <div className="topbar-sub">
            {report ? `Generated ${formatDateTime(report.generated_at)}` : "Aggregated security posture summary"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{
              background: "var(--bg-panel-raised)",
              border: "1px solid var(--border-glow)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: 13,
              padding: "9px 12px",
            }}
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={handlePrint}>Export / Print</button>
        </div>
      </div>

      {loading || !report ? (
        <EmptyState>Loading report…</EmptyState>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 18 }}>
            <StatCard label="Total alerts" value={report.alerts.total.toLocaleString()} />
            <StatCard label="Resolved" value={report.alerts.resolved} />
            <StatCard label="False positives" value={report.alerts.false_positive} />
            <StatCard label="Flows scored" value={report.detection.total_scored.toLocaleString()} />
          </div>

          <div className="grid grid-2" style={{ marginBottom: 18 }}>
            <div className="panel">
              <div className="panel-header"><div className="panel-title">Alert trend</div></div>
              <LineChart points={report.alerts.trend.map((t) => ({ time: t.day, count: t.count }))} />
            </div>
            <div className="panel">
              <div className="panel-header"><div className="panel-title">Attack type breakdown</div></div>
              {attackEntries.length ? (
                attackEntries.map(([k, v]) => (
                  <BarRow key={k} label={k.replace(/_/g, " ")} value={v} max={attackMax} />
                ))
              ) : <EmptyState>No attacks detected in this period</EmptyState>}
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: 18 }}>
            <div className="panel">
              <div className="panel-header"><div className="panel-title">Top attackers (source IPs)</div></div>
              {report.top_attackers.length ? (
                report.top_attackers.map((a) => (
                  <BarRow key={a.ip} label={a.ip} value={a.count} max={attackerMax} />
                ))
              ) : <EmptyState>No anomalous sources yet</EmptyState>}
            </div>
            <div className="panel">
              <div className="panel-header"><div className="panel-title">Top targets (destination IPs)</div></div>
              {report.top_targets.length ? (
                report.top_targets.map((t) => (
                  <BarRow key={t.ip} label={t.ip} value={t.count} max={targetMax} />
                ))
              ) : <EmptyState>No anomalous targets yet</EmptyState>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><div className="panel-title">Detection model performance</div></div>
            {report.model_performance ? (
              <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)" }}>
                  <div className="stat-value">{report.model_performance.accuracy}</div>
                  <div className="stat-label">Accuracy</div>
                </div>
                <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)" }}>
                  <div className="stat-value">{report.model_performance.precision}</div>
                  <div className="stat-label">Precision</div>
                </div>
                <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)" }}>
                  <div className="stat-value">{report.model_performance.recall}</div>
                  <div className="stat-label">Recall</div>
                </div>
                <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)" }}>
                  <div className="stat-value">{report.model_performance.f1_score}</div>
                  <div className="stat-label">F1-score</div>
                </div>
              </div>
            ) : <EmptyState>No trained model yet</EmptyState>}
            {report.model_performance && (
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 12 }}>
                {report.model_performance.model_name.replace(/_/g, " ")} · trained on {report.model_performance.dataset_used}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}