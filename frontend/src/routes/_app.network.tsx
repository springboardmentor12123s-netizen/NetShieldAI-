import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { PacketsAPI, type Packet, getDst, getSize, getSrc, getStatus, getTime } from "@/lib/api";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_app/network")({
  head: () => ({
    meta: [
      { title: "Network Monitoring — SentinelOps" },
      { name: "description", content: "Inspect live packet captures across the network." },
    ],
  }),
  component: NetworkPage,
});

function NetworkPage() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [q, setQ] = useState("");
  const [protocol, setProtocol] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PacketsAPI.list();
      setPackets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const protocols = useMemo(() => {
    const s = new Set<string>();
    for (const p of packets) if (p.protocol) s.add(p.protocol.toString().toUpperCase());
    return Array.from(s);
  }, [packets]);

  const filtered = packets.filter((p) => {
    const src = getSrc(p);
    const dst = getDst(p);
    const matchQ =
      !q ||
      src.includes(q) ||
      dst.includes(q) ||
      String(p.id).includes(q) ||
      (p.protocol ?? "").toLowerCase().includes(q.toLowerCase());
    const matchP = protocol === "all" || (p.protocol ?? "").toUpperCase() === protocol;
    const matchS = status === "all" || getStatus(p) === status;
    return matchQ && matchP && matchS;
  });

  const onAdd = async () => {
    const src = window.prompt("Source IP", "10.0.0.12");
    if (!src) return;
    const dst = window.prompt("Destination IP", "8.8.8.8");
    if (!dst) return;
    const proto = window.prompt("Protocol", "TCP") ?? "TCP";
    const size = Number(window.prompt("Packet size (bytes)", "512") ?? 512);
    try {
      await PacketsAPI.create({
        source_ip: src,
        destination_ip: dst,
        protocol: proto.toUpperCase(),
        packet_size: size,
        status: "monitoring",
      });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Create failed");
    }
  };

  const onDelete = async (id: Packet["id"]) => {
    if (!window.confirm(`Delete packet #${id}?`)) return;
    setBusyId(String(id));
    try {
      await PacketsAPI.remove(id);
      setPackets((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Network Monitoring</h1>
          <div className="page__subtitle">
            {filtered.length.toLocaleString()} of {packets.length.toLocaleString()} packets
          </div>
        </div>
      </div>

      <div className="filterbar">
        <div className="search">
          <Search size={13} />
          <input
            className="input"
            placeholder="Search IP, protocol, or ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="select" value={protocol} onChange={(e) => setProtocol(e.target.value)}>
          <option value="all">All Protocols</option>
          {protocols.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="normal">Normal</option>
          <option value="suspicious">Suspicious</option>
          <option value="monitoring">Monitoring</option>
          <option value="unknown">Unknown</option>
        </select>
        <div className="filterbar__spacer" />
        <button className="btn" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
        <button className="btn btn--primary" onClick={onAdd}>
          <Plus size={13} /> Add Packet
        </button>
      </div>

      {error && (
        <div className="alert alert--high" style={{ marginBottom: 12 }}>
          <div className="alert__type">Request failed</div>
          <div className="muted" style={{ fontSize: 12 }}>{error}</div>
        </div>
      )}

      <Card title="Packet Inspector" padded={false}>
        <div className="table-wrap" style={{ maxHeight: 560 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th style={{ textAlign: "right" }}>Size</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="table__empty" colSpan={8}>
                    No packets match current filters.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={String(p.id)}>
                  <td className="mono">#{p.id}</td>
                  <td className="mono">{getSrc(p)}</td>
                  <td className="mono">{getDst(p)}</td>
                  <td>{(p.protocol ?? "—").toString().toUpperCase()}</td>
                  <td style={{ textAlign: "right" }} className="mono">{getSize(p)}</td>
                  <td><StatusBadge status={getStatus(p)} /></td>
                  <td className="mono muted">
                    {getTime(p) ? new Date(getTime(p)).toLocaleTimeString() : "—"}
                  </td>
                  <td>
                    <button
                      className="btn btn--icon"
                      aria-label={`Delete packet ${p.id}`}
                      title="Delete"
                      disabled={busyId === String(p.id)}
                      onClick={() => onDelete(p.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}