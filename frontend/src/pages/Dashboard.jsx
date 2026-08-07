import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LineChart from "../components/LineChart";
import { StatCard, BarRow, EmptyState } from "../components/UI";
import { Icon } from "../components/Icon";
import { Api } from "../lib/api";
import { useToast } from "../context/ToastContext";

const RISK_COLORS = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
};
const RISK_LEVELS = ["low", "medium", "high", "critical"];

export default function Dashboard() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, st, r] = await Promise.all([
          Api.get("/dashboard/summary"),
          Api.get("/traffic/stats"),
          Api.get("/anomaly/report"),
        ]);
        setSummary(s);
        setStats(st);
        setReport(r);
      } catch (err) {
        showToast(err.message, "error");
      }
    })();
  }, [showToast]);

  const protoMax = stats ? Math.max(...Object.values(stats.protocol_breakdown), 1) : 1;
  const riskMax = report ? Math.max(...RISK_LEVELS.map((l) => report.risk_level_breakdown?.[l] || 0), 1) : 1;
  const attackEntries = report ? Object.entries(report.attack_type_breakdown || {}) : [];
  const attackMax = attackEntries.length ? Math.max(...attackEntries.map(([, v]) => v), 1) : 1;
  const talkerMax = stats?.top_talkers?.length ? Math.max(...stats.top_talkers.map((t) => t.bytes), 1) : 1;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Security Overview</h1>
          <div className="topbar-sub">Live posture across monitored network segments</div>
        </div>
        <div className="pulse-live"><span className="pulse-dot"></span> LIVE MONITORING</div>
      </div>

      {summary && (
        <div className="grid grid-4" style={{ marginBottom: 18 }}>
          <StatCard icon={Icon.flows} label="Total flows captured" value={summary.total_flows.toLocaleString()} />
          <StatCard
            icon={Icon.anomaly}
            label="Anomalies detected"
            value={summary.total_anomalies.toLocaleString()}
            sub={`${summary.detection_rate}% of scored flows`}
          />
          <StatCard icon={Icon.alert} label="Open alerts" value={summary.open_alerts} sub={`${summary.critical_alerts} critical`} />
          <StatCard icon={Icon.score} label="Avg. risk score" value={summary.avg_risk_score} sub="0–100 composite scale" />
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-eyebrow">Network Monitoring</div>
              <div className="panel-title">Flow volume — last 30 minutes</div>
            </div>
            <Link to="/traffic" className="btn btn-ghost">View traffic →</Link>
          </div>
          <LineChart points={stats?.flows_per_minute || []} />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-eyebrow">Detection Engine</div>
              <div className="panel-title">Risk level breakdown</div>
            </div>
          </div>
          {report ? RISK_LEVELS.map((level) => (
            <BarRow key={level} label={level} value={report.risk_level_breakdown?.[level] || 0} max={riskMax} color={RISK_COLORS[level]} />
          )) : <EmptyState>Loading…</EmptyState>}
        </div>
      </div>

      <div className="grid grid-3">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Protocol breakdown</div></div>
          {stats && Object.keys(stats.protocol_breakdown).length ? (
            Object.entries(stats.protocol_breakdown).map(([k, v]) => (
              <BarRow key={k} label={k} value={v} max={protoMax} />
            ))
          ) : <EmptyState>No traffic yet</EmptyState>}
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">Top talkers</div></div>
          {stats?.top_talkers?.length ? (
            stats.top_talkers.map((t) => (
              <BarRow key={t.ip} label={t.ip} value={t.bytes} max={talkerMax} displayValue={`${(t.bytes / 1024).toFixed(1)}KB`} />
            ))
          ) : <EmptyState>No traffic yet</EmptyState>}
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">Attack types detected</div></div>
          {attackEntries.length ? (
            attackEntries.map(([k, v]) => (
              <BarRow key={k} label={k.replace(/_/g, " ")} value={v} max={attackMax} />
            ))
          ) : <EmptyState>Run detection to see results</EmptyState>}
        </div>
      </div>
    </>
  );
}