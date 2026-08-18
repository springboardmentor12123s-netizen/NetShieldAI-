import { useCallback, useEffect, useRef, useState } from "react";
import LineChart from "../components/LineChart";
import { StatCard, BarRow, EmptyState } from "../components/UI";
import { Icon } from "../components/Icon";
import { Api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatTime, kb } from "../lib/format";

const PROTOCOLS = ["", "TCP", "UDP", "ICMP"];

export default function TrafficMonitoring() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [protocol, setProtocol] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [liveToggling, setLiveToggling] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null); // { running, last_error, available_interfaces }
  const pollRef = useRef(null);

  const loadStats = useCallback(async () => {
    const data = await Api.get("/traffic/stats");
    setStats(data);
  }, []);

  const loadTable = useCallback(async (proto) => {
    const path = proto ? `/traffic?limit=60&protocol=${proto}` : "/traffic?limit=60";
    const data = await Api.get(path);
    setRows(data);
  }, []);

  useEffect(() => {
    loadStats().catch((err) => showToast(err.message, "error"));
  }, [loadStats, showToast]);

  useEffect(() => {
    loadTable(protocol).catch((err) => showToast(err.message, "error"));
  }, [protocol, loadTable, showToast]);

  const refreshLiveStatus = useCallback(() => {
    Api.get("/traffic/live/status")
      .then((res) => {
        setLiveActive(res.running);
        setLiveStatus(res);
      })
      .catch(() => {});
  }, []);

  // Check live capture status on mount
  useEffect(() => {
    refreshLiveStatus();
  }, [refreshLiveStatus]);

  // Poll for fresh data every 4s while live capture is active
  useEffect(() => {
    if (liveActive) {
      pollRef.current = setInterval(() => {
        loadStats().catch(() => {});
        loadTable(protocol).catch(() => {});
      }, 4000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [liveActive, protocol, loadStats, loadTable]);

  async function handleCapture() {
    setCapturing(true);
    try {
      await Api.post("/traffic/generate", { count: 150, anomaly_ratio: 0.15 });
      showToast("Captured 150 new flow records");
      await Promise.all([loadStats(), loadTable(protocol)]);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCapturing(false);
    }
  }

  async function handleToggleLive() {
    setLiveToggling(true);
    try {
      if (liveActive) {
        await Api.post("/traffic/live/stop", {});
        showToast("Live capture stopped");
        setLiveActive(false);
      } else {
        await Api.post("/traffic/live/start", {});
        showToast("Live capture started — sniffing real Wi-Fi traffic");
        setLiveActive(true);
      }
    } catch (err) {
      // Surfaces the backend's explicit reason (e.g. "requires running
      // outside Docker") instead of failing silently.
      showToast(err.message, "error");
    } finally {
      setLiveToggling(false);
      refreshLiveStatus();
    }
  }

  const protoMax = stats ? Math.max(...Object.values(stats.protocol_breakdown), 1) : 1;
  const dockerLimited = liveStatus?.last_error?.toLowerCase().includes("docker");

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Traffic Monitoring</h1>
          <div className="topbar-sub">Packet capture, flow analysis, and protocol visibility</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {liveActive && (
            <div className="pulse-live">
              <span className="pulse-dot"></span> LIVE CAPTURE
            </div>
          )}
          <button
            className={liveActive ? "btn btn-secondary" : "btn btn-primary"}
            onClick={handleToggleLive}
            disabled={liveToggling}
            title={dockerLimited ? "Requires running the backend outside Docker" : undefined}
          >
            {liveToggling ? "Working…" : liveActive ? "Stop Live Capture" : "Start Live Capture"}
          </button>
          <button className="btn btn-secondary" onClick={handleCapture} disabled={capturing}>
            {Icon.plus} {capturing ? "Capturing…" : "Simulate flows"}
          </button>
        </div>
      </div>

      

      {stats && (
        <div className="grid grid-4" style={{ marginBottom: 18 }}>
          <StatCard label="Total flows" value={stats.total_flows.toLocaleString()} />
          <StatCard label="Total bytes" value={kb(stats.total_bytes)} />
          <StatCard label="Unique sources" value={stats.unique_src_ips} />
          <StatCard label="Unique destinations" value={stats.unique_dst_ips} />
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Flow volume — last 30 minutes</div></div>
          <LineChart points={stats?.flows_per_minute || []} />
        </div>
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Protocol distribution</div></div>
          {stats && Object.keys(stats.protocol_breakdown).length ? (
            Object.entries(stats.protocol_breakdown).map(([k, v]) => (
              <BarRow key={k} label={k} value={v} max={protoMax} />
            ))
          ) : <EmptyState>No traffic captured yet</EmptyState>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Recent flows</div>
          <div className="chip-row" style={{ margin: 0 }}>
            {PROTOCOLS.map((p) => (
              <span
                key={p || "all"}
                className={`chip ${protocol === p ? "active" : ""}`}
                onClick={() => setProtocol(p)}
              >
                {p || "All"}
              </span>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th>
                <th>Packets</th><th>Bytes</th><th>Pkts/s</th><th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatTime(r.timestamp)}</td>
                  <td className="primary">{r.src_ip}:{r.src_port ?? "-"}</td>
                  <td className="primary">{r.dst_ip}:{r.dst_port ?? "-"}</td>
                  <td>{r.protocol}</td>
                  <td>{r.packet_count.toLocaleString()}</td>
                  <td>{kb(r.byte_count)}</td>
                  <td>{r.packets_per_second}</td>
                  <td>{r.tcp_flags || "-"}</td>
                </tr>
              )) : (
                <tr><td colSpan={8}><EmptyState>No flows for this filter yet.</EmptyState></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}