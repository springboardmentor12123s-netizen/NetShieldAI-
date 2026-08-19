import React, { useState } from "react";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Skeleton from "../components/Skeleton.jsx";
import usePolling from "../hooks/usePolling.js";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [latestThreats, setLatestThreats] = useState([]);
  const [history, setHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [form, setForm] = useState({
    duration: 2.5,
    protocol_type: "tcp",
    src_bytes: 500,
    dst_bytes: 300,
    packet_count: 40,
    flow_rate: 20,
    wrong_fragment: 0,
    urgent: 0,
    count: 5,
    srv_count: 5,
    source_ip: "192.168.1.15",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [s, r, t, h] = await Promise.all([
      api.get("/dashboard/summary"),
      api.get("/dashboard/recent-predictions"),
      api.get("/dashboard/latest-threats"),
      api.get("/dashboard/detection-history"),
    ]);
    setSummary(s.data);
    setRecent(r.data);
    setLatestThreats(t.data);
    setHistory(h.data);
    setLastUpdated(new Date());
  };

  // Feature 4 — Real-Time Dashboard: stats, recent predictions, latest
  // threats, and detection history all refresh automatically, no manual
  // reload required.
  usePolling(load, 4000, []);

  const runPrediction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/predict", {
        ...form,
        duration: Number(form.duration),
        src_bytes: Number(form.src_bytes),
        dst_bytes: Number(form.dst_bytes),
        packet_count: Number(form.packet_count),
        flow_rate: Number(form.flow_rate),
        wrong_fragment: Number(form.wrong_fragment),
        urgent: Number(form.urgent),
        count: Number(form.count),
        srv_count: Number(form.srv_count),
      });
      setResult(res.data);
      if (res.data.is_attack) toast.error(`${res.data.attack_type.toUpperCase()} detected — ${res.data.threat_level} threat`);
      else toast.success("Traffic classified as normal");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Prediction failed — is a model trained yet?");
    } finally {
      setLoading(false);
    }
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div>
      <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Network Overview</span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 400, display: "flex", alignItems: "center" }}>
          <span className="pulse-dot" />
          Live · updated {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
        </span>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card">
          <div className="stat-label">Total Packets</div>
          {summary ? <div className="stat-value">{summary.total_packets}</div> : <Skeleton height={32} />}
        </div>
        <div className="glass-card">
          <div className="stat-label">Normal Traffic</div>
          {summary ? <div className="stat-value accent">{summary.normal_traffic}</div> : <Skeleton height={32} />}
        </div>
        <div className="glass-card">
          <div className="stat-label">Threats Detected</div>
          {summary ? <div className="stat-value critical">{summary.attack_traffic}</div> : <Skeleton height={32} />}
        </div>
        <div className="glass-card">
          <div className="stat-label">Active Alerts</div>
          {summary ? <div className="stat-value critical">{summary.active_alerts}</div> : <Skeleton height={32} />}
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <div className="glass-card">
          <div className="stat-label">Critical Alerts</div>
          {summary ? <div className="stat-value critical">{summary.critical_alerts}</div> : <Skeleton height={24} />}
        </div>
        <div className="glass-card">
          <div className="stat-label">Packets Today</div>
          {summary ? <div className="stat-value">{summary.packets_today}</div> : <Skeleton height={24} />}
        </div>
        <div className="glass-card">
          <div className="stat-label">Network Health</div>
          {summary ? <StatusBadge status={summary.network_health} label={summary.network_health} /> : <Skeleton height={20} width={80} />}
        </div>
        <div className="glass-card">
          <div className="stat-label">System Health</div>
          {summary ? <StatusBadge status={summary.system_health} label={summary.system_health} /> : <Skeleton height={20} width={80} />}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        <div className="glass-card">
          <div className="stat-label">AI Model Status</div>
          {summary ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <StatusBadge status={summary.ai_model_status.status} label={summary.ai_model_status.label} />
              {summary.ai_model_status.metrics && (
                <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>
                  Accuracy: {(summary.ai_model_status.metrics.accuracy * 100).toFixed(1)}%
                </span>
              )}
            </div>
          ) : <Skeleton height={20} width={140} />}
        </div>
        <div className="glass-card">
          <div className="stat-label">Dataset Status</div>
          {summary ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <StatusBadge status={summary.dataset_status.status} label={summary.dataset_status.label} />
              <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>{summary.dataset_status.rows} rows</span>
            </div>
          ) : <Skeleton height={20} width={140} />}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 28 }}>
        <div className="section-title">Detection History (24h)</div>
        {history.length === 0 ? (
          <div className="empty-state">No predictions in the last 24 hours yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid stroke="var(--panel-border)" strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--text-dim)" }} hide />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} />
              <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--panel-border)" }} />
              <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="attacks" stroke="var(--critical)" strokeWidth={2} dot={false} name="Attacks" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="glass-card">
          <div className="section-title">Analyze Traffic Sample</div>
          <p style={{ color: "var(--text-dim)", fontSize: "0.8rem", marginTop: -8, marginBottom: 16 }}>
            Feed a packet/flow into the AI model and get a live risk score.
          </p>
          <form onSubmit={runPrediction}>
            <div className="grid grid-2">
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Source IP
                <input className="input-field" style={{ marginTop: 4, marginBottom: 10 }} value={form.source_ip} onChange={update("source_ip")} />
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Protocol
                <select className="input-field" style={{ marginTop: 4, marginBottom: 10 }} value={form.protocol_type} onChange={update("protocol_type")}>
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                  <option value="icmp">icmp</option>
                </select>
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Duration (s)
                <input className="input-field" style={{ marginTop: 4, marginBottom: 10 }} type="number" step="0.1" value={form.duration} onChange={update("duration")} />
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Flow Rate
                <input className="input-field" style={{ marginTop: 4, marginBottom: 10 }} type="number" value={form.flow_rate} onChange={update("flow_rate")} />
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Src Bytes
                <input className="input-field" style={{ marginTop: 4, marginBottom: 10 }} type="number" value={form.src_bytes} onChange={update("src_bytes")} />
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Dst Bytes
                <input className="input-field" style={{ marginTop: 4, marginBottom: 10 }} type="number" value={form.dst_bytes} onChange={update("dst_bytes")} />
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Packet Count
                <input className="input-field" style={{ marginTop: 4, marginBottom: 10 }} type="number" value={form.packet_count} onChange={update("packet_count")} />
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Conn. Count
                <input className="input-field" style={{ marginTop: 4, marginBottom: 10 }} type="number" value={form.count} onChange={update("count")} />
              </label>
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 14 }}>
              {loading ? "Analyzing…" : "Run AI Analysis"}
            </button>
          </form>

          {result && (
            <div style={{ marginTop: 18, borderTop: "1px solid var(--panel-border)", paddingTop: 16 }}>
              <div className="stat-label">Result — {result.prediction_id}</div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 6 }}>
                <span className={`pill ${result.is_attack ? "critical" : "low"}`}>
                  {result.is_attack ? "Attack Detected" : "Normal"}
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{result.attack_type}</span>
                <span style={{ color: "var(--text-dim)" }}>Confidence: {result.confidence}%</span>
                <span style={{ color: "var(--text-dim)" }}>Risk: {result.risk_score}%</span>
                <StatusBadge status={result.threat_level?.toLowerCase()} label={result.threat_level} />
              </div>
              {result.recommended_actions?.length > 0 && (
                <ul style={{ marginTop: 10, paddingLeft: 18, color: "var(--text-dim)", fontSize: "0.8rem" }}>
                  {result.recommended_actions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ marginBottom: 20 }}>
          <div className="section-title">Latest Threats</div>
          {latestThreats.length === 0 ? (
            <div className="empty-state">No active threats. All clear.</div>
          ) : (
            <table>
              <thead><tr><th>Source IP</th><th>Type</th><th>Severity</th></tr></thead>
              <tbody>
                {latestThreats.map((t) => (
                  <tr key={t.id}>
                    <td>{t.source_ip}</td>
                    <td>{t.attack_type}</td>
                    <td><StatusBadge status={t.severity} label={t.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="section-title" style={{ marginTop: 22 }}>Recent Predictions</div>
          {recent.length === 0 ? (
            <div className="empty-state">No traffic analyzed yet. Run an analysis to populate this feed.</div>
          ) : (
            <table>
              <thead><tr><th>Source IP</th><th>Type</th><th>Risk</th></tr></thead>
              <tbody>
                {recent.slice(0, 8).map((p) => (
                  <tr key={p._id}>
                    <td>{p.source_ip}</td>
                    <td>{p.attack_type}</td>
                    <td>{p.risk_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
