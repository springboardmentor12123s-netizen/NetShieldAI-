import React, { useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Search, Play, Square, Radio } from "lucide-react";
import api from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Skeleton from "../components/Skeleton.jsx";
import usePolling from "../hooks/usePolling.js";

const PAGE_SIZE = 20;

export default function PacketMonitoring() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [protocol, setProtocol] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState(""); // "", "live", "simulated"
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState(-1);
  const [loading, setLoading] = useState(true);

  // ---- Feature 1: Live Monitoring state ----
  const [monitorStatus, setMonitorStatus] = useState(null);
  const [monitorBusy, setMonitorBusy] = useState(false);
  const [recentPredictions, setRecentPredictions] = useState([]);

  const load = async () => {
    const res = await api.get("/packets", {
      params: {
        search: search || undefined,
        protocol: protocol || undefined,
        status: status || undefined,
        source: source || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: PAGE_SIZE,
      },
    });
    setItems(res.data.items);
    setTotal(res.data.total);
    setLoading(false);
  };

  const loadMonitorStatus = async () => {
    const res = await api.get("/monitoring/status");
    setMonitorStatus(res.data);
  };

  const loadRecentPredictions = async () => {
    const res = await api.get("/dashboard/recent-predictions", { params: { limit: 10 } });
    setRecentPredictions(res.data);
  };

  // Feature 4: this page auto-refreshes on its own — packets, monitoring
  // status, and live AI predictions all update without a manual reload.
  usePolling(load, 3000, [page, protocol, status, source, sortBy, sortDir]);
  usePolling(loadMonitorStatus, 2000, []);
  usePolling(loadRecentPredictions, 3000, []);

  const runSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const simulateMore = async () => {
    await api.post("/packets/simulate", null, { params: { count: 40 } });
    toast.success("Simulated 40 new packets");
    load();
  };

  const startMonitoring = async () => {
    setMonitorBusy(true);
    try {
      const res = await api.post("/monitoring/start");
      toast.success(res.data.message || "Live monitoring started");
      setMonitorStatus(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not start live monitoring");
    } finally {
      setMonitorBusy(false);
    }
  };

  const stopMonitoring = async () => {
    setMonitorBusy(true);
    try {
      const res = await api.post("/monitoring/stop");
      toast.success(res.data.message || "Live monitoring stopped");
      setMonitorStatus(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not stop live monitoring");
    } finally {
      setMonitorBusy(false);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(sortDir === 1 ? -1 : 1);
    else { setSortBy(field); setSortDir(-1); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isRunning = !!monitorStatus?.running;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Packet Monitoring</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="icon-btn" style={{ width: "auto", padding: "6px 12px", display: "flex", gap: 6 }} onClick={simulateMore}>
            <RefreshCw size={14} /> Simulate Traffic
          </button>
        </div>
      </div>

      {/* ---- Feature 1: Live Monitoring control panel ---- */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className={`pulse-dot${isRunning ? "" : " off"}`} />
            <div>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Radio size={16} />
                Live Packet Capture
              </div>
              <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginTop: 2 }}>
                {monitorStatus ? (
                  isRunning
                    ? `Running on "${monitorStatus.interface}" · ${monitorStatus.packets_captured} packets captured · ${monitorStatus.flows_processed} flows analyzed`
                    : "Not currently capturing traffic"
                ) : "Checking status…"}
              </div>
              {monitorStatus?.error && (
                <div className="error-text" style={{ marginTop: 6, marginBottom: 0 }}>{monitorStatus.error}</div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "8px 18px", display: "flex", alignItems: "center", gap: 6, opacity: isRunning ? 0.5 : 1 }}
              onClick={startMonitoring}
              disabled={isRunning || monitorBusy}
            >
              <Play size={14} /> Start Monitoring
            </button>
            <button
              className="icon-btn"
              style={{ width: "auto", padding: "8px 18px", display: "flex", alignItems: "center", gap: 6, opacity: isRunning ? 1 : 0.5 }}
              onClick={stopMonitoring}
              disabled={!isRunning || monitorBusy}
            >
              <Square size={14} /> Stop Monitoring
            </button>
          </div>
        </div>
      </div>

      {/* ---- Live AI Predictions feed ---- */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>Live AI Predictions</div>
        {recentPredictions.length === 0 ? (
          <div className="empty-state">No predictions yet. Start monitoring or run a manual analysis on the Dashboard.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Source IP</th><th>Attack Type</th><th>Confidence</th><th>Risk</th><th>Threat Level</th><th>When</th></tr>
            </thead>
            <tbody>
              {recentPredictions.map((p) => (
                <tr key={p._id}>
                  <td>{p.source_ip}</td>
                  <td>{p.is_attack ? p.attack_type : <span style={{ color: "var(--low)" }}>normal</span>}</td>
                  <td>{p.confidence}%</td>
                  <td>{p.risk_score}%</td>
                  <td><StatusBadge status={p.threat_level?.toLowerCase()} label={p.threat_level} /></td>
                  <td>{new Date(p.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={runSearch} className="glass-card" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-dim)" }} />
          <input
            className="input-field"
            style={{ paddingLeft: 30 }}
            placeholder="Search by IP or packet ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field" style={{ width: 140 }} value={protocol} onChange={(e) => { setProtocol(e.target.value); setPage(1); }}>
          <option value="">All Protocols</option>
          {["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input-field" style={{ width: 140 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="normal">Normal</option>
          <option value="suspicious">Suspicious</option>
          <option value="blocked">Blocked</option>
        </select>
        <select className="input-field" style={{ width: 140 }} value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}>
          <option value="">Live + Simulated</option>
          <option value="live">Live Only</option>
          <option value="simulated">Simulated Only</option>
        </select>
        <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} type="submit">Search</button>
      </form>

      <div className="glass-card">
        {loading ? (
          <Skeleton height={300} />
        ) : items.length === 0 ? (
          <div className="empty-state">No packets match these filters.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Packet ID</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Src Port</th>
                  <th>Dst Port</th>
                  <th onClick={() => toggleSort("packet_size")} style={{ cursor: "pointer" }}>Size {sortBy === "packet_size" ? (sortDir === 1 ? "▲" : "▼") : ""}</th>
                  <th onClick={() => toggleSort("duration")} style={{ cursor: "pointer" }}>Duration {sortBy === "duration" ? (sortDir === 1 ? "▲" : "▼") : ""}</th>
                  <th onClick={() => toggleSort("flow_rate")} style={{ cursor: "pointer" }}>Flow Rate {sortBy === "flow_rate" ? (sortDir === 1 ? "▲" : "▼") : ""}</th>
                  <th onClick={() => toggleSort("timestamp")} style={{ cursor: "pointer" }}>Timestamp {sortBy === "timestamp" ? (sortDir === 1 ? "▲" : "▼") : ""}</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.packet_id}</td>
                    <td>{p.source_ip}</td>
                    <td>{p.destination_ip}</td>
                    <td>{p.protocol}</td>
                    <td>{p.source_port}</td>
                    <td>{p.destination_port}</td>
                    <td>{p.packet_size} B</td>
                    <td>{p.duration}s</td>
                    <td>{p.flow_rate}</td>
                    <td>{new Date(p.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`pill ${p.source === "live" ? "low" : "medium"}`}>
                        {p.source === "live" ? "LIVE" : "SIM"}
                      </span>
                    </td>
                    <td><StatusBadge status={p.status} label={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>
                Page {page} of {totalPages} · {total} packets
              </span>
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
