import axios from "axios";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Search,
  Filter,
  Download,
  Wifi,
  ArrowDownToLine,
  ArrowUpFromLine,
  Signal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/soc/StatCard";
import {
  generatePackets,
  trafficSeries,
  type Packet,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/network")({
  head: () => ({
    meta: [
      { title: "Network Monitoring — NetShield AI" },
      { name: "description", content: "Live packet capture, interfaces and protocol analysis." },
    ],
  }),
  component: NetworkMonitoring,
});

const PIE_COLORS = [
  "var(--primary)",
  "var(--info)",
  "var(--safe)",
  "var(--warning)",
  "var(--suspicious)",
  "var(--critical)",
  "var(--accent)",
];

const chartTooltip = {
  contentStyle: {
    background: "oklch(0.20 0.035 265)",
    border: "1px solid oklch(1 0 0 / 0.1)",
    borderRadius: 12,
    fontSize: 12,
    color: "oklch(0.97 0.01 250)",
  },
};

function NetworkMonitoring() {
  const [traffic, setTraffic] = useState(() => trafficSeries(30));
  const [liveStats, setLiveStats] = useState({
    
  packets: 0,
  packets_sent: 0,
  packets_recv: 0,
  bytes_sent: 0,
  bytes_recv: 0,

  upload_speed: 0,
  download_speed: 0,

  active_connections: 0,
  interfaces_up: 0,

  protocols: [],
});

const [trafficHistory, setTrafficHistory] = useState<
{
    time: string;
    packets: number;
}[]
>([]);
const [interfaces, setInterfaces] = useState<any[]>([]);

  const [connections, setConnections] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [protocol, setProtocol] = useState<string>("ALL");
  const [capturing, setCapturing] = useState(true);

  useEffect(() => {
    if (!capturing) return;
    async function loadNetworkStats() {
      const interfaceResponse = await axios.get(
  "http://127.0.0.1:8000/network/interfaces"
);

setInterfaces(interfaceResponse.data);
const connectionRes = await axios.get(
    "http://localhost:8000/network/connections"
);

setConnections(connectionRes.data);
  try {
    const res = await axios.get("http://localhost:8000/network/live");
    setLiveStats(res.data);
    setTrafficHistory((prev) => {

    const updated = [

        ...prev,

        {
            time: new Date().toLocaleTimeString(),
            packets: res.data.packets,
        },

    ];

    return updated.slice(-20);

});
  } catch (err) {
    console.error(err);
  }
}

loadNetworkStats();

    const i = setInterval(() => {
      setTraffic((t) => {
        const last = t[t.length - 1];
        const nextHour = (parseInt(last.t.split(":")[0], 10) + 1) % 24;
        const base = 800 + Math.sin(nextHour / 3) * 250 + Math.random() * 300;
        return [
          ...t.slice(1),
          {
            t: `${String(nextHour).padStart(2, "0")}:00`,
            inbound: Math.round(base + Math.random() * 200),
            outbound: Math.round(base * 0.7 + Math.random() * 180),
            anomalies: Math.max(0, Math.round(Math.random() * 8)),
          },
        ];
      });
      loadNetworkStats();

    }, 1500);
    return () => clearInterval(i);
  }, [capturing]);

  const filtered = connections.filter((c) => {
  if (protocol !== "ALL") return true; // We'll improve protocol filtering later.

  if (!query) return true;

  const q = query.toLowerCase();

  return (
    (c.local || "").toLowerCase().includes(q) ||
    (c.remote || "").toLowerCase().includes(q) ||
    (c.status || "").toLowerCase().includes(q) ||
    String(c.pid || "").includes(q)
  );
});


  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Network Monitoring</div>
          <h1 className="mt-1 text-2xl font-semibold">Packet capture &amp; flow analysis</h1>
          <p className="text-sm text-muted-foreground">
            Real-time visibility across sensors, interfaces and protocols.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCapturing((c) => !c)}
            className={cn(
              "h-9 px-3 rounded-lg text-sm inline-flex items-center gap-2 border",
              capturing
                ? "border-critical/40 bg-critical/10 text-critical"
                : "border-safe/40 bg-safe/10 text-safe",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full bg-current", capturing && "pulse-dot")} />
            {capturing ? "Stop capture" : "Start capture"}
          </button>
          <button className="h-9 px-3 rounded-lg text-sm inline-flex items-center gap-2 border border-border/60 hover:bg-accent/60">
            <Download className="h-4 w-4" /> PCAP
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
  label="Packets"
  value={liveStats.packets.toLocaleString()}
  icon={Activity}
  tone="primary"
/>

<StatCard
  label="Packets Sent"
  value={liveStats.packets_sent.toLocaleString()}
  icon={ArrowUpFromLine}
  tone="info"
/>

<StatCard
  label="Packets Received"
  value={liveStats.packets_recv.toLocaleString()}
  icon={ArrowDownToLine}
  tone="safe"
/>

<StatCard
  label="Bytes Received"
  value={(liveStats.bytes_recv / 1024 / 1024).toFixed(2) + " MB"}
  icon={Wifi}
  tone="warning"
/>

      </div>

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

  <StatCard
    label="Interfaces Up"
    value={liveStats.interfaces_up.toLocaleString()}
    icon={Wifi}
    tone="safe"
  />

  <StatCard
    label="Active Connections"
    value={liveStats.active_connections.toLocaleString()}
    icon={Activity}
    tone="primary"
  />

  <StatCard
    label="Upload Speed"
    value={(liveStats.upload_speed / 1024).toFixed(2) + " KB/s"}
    icon={ArrowUpFromLine}
    tone="info"
  />

  <StatCard
    label="Download Speed"
    value={(liveStats.download_speed / 1024).toFixed(2) + " KB/s"}
    icon={ArrowDownToLine}
    tone="warning"
  />

</div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Live traffic volume</div>
              <div className="text-xs text-muted-foreground">Aggregated across all interfaces</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficHistory}>
                <defs>
                  <linearGradient id="nIn" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.21 262)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.62 0.21 262)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="time" stroke="oklch(0.72 0.03 255)" fontSize={11} />
                <YAxis stroke="oklch(0.72 0.03 255)" fontSize={11} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="packets" stroke="oklch(0.62 0.21 262)" fill="url(#nIn)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="text-sm font-semibold mb-4">Protocol mix</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={liveStats.protocols} dataKey="count" nameKey="protocol" innerRadius={50} outerRadius={90} paddingAngle={2} stroke="none">
                  {liveStats.protocols.map((p: any, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            {liveStats.protocols.map((p: any, i) => (
              <div key={p.protocol} className="flex items-center justify-between border border-border/40 rounded-md px-2 py-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {p.protocol}
                </span>
                <span className="text-muted-foreground">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interfaces */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Network interfaces</div>
          <div className="text-xs text-muted-foreground">Sensor: probe-01 · edge-us-east-1</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {interfaces.map((i) => (
            <div key={i.name} className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <Wifi className="h-4 w-4 text-primary" />
                  {i.name}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded",
                    i.status === "Up"
                      ? "bg-safe/15 text-safe border border-safe/30"
                      : "bg-critical/15 text-critical border border-critical/30",
                  )}
                >
                  {i.status}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground font-mono">{i.ip}</div>
              <div className="text-[10px] text-muted-foreground/80 font-mono">{i.mac}</div>
              <div className="mt-3 text-xs text-muted-foreground">
    <div>Speed: {i.speed} Mbps</div>
</div>
            </div>
          ))}
        </div>
      </div>

      {/* Packets */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-sm font-semibold">Packet capture</div>
            <div className="text-xs text-muted-foreground">
              {filtered.length} live connections· {capturing ? "capturing" : "paused"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter IP, port, protocol…"
                className="h-9 w-64 rounded-lg bg-muted/40 border border-border pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/60"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="h-9 rounded-lg bg-muted/40 border border-border pl-9 pr-8 text-sm focus:outline-none focus:border-primary/60"
              >
                {["ALL", "TCP", "UDP", "HTTPS", "HTTP", "DNS", "ICMP", "SSH", "SMB"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background/95 backdrop-blur">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="py-2 pr-4 font-medium">Local Address</th>
<th className="py-2 pr-4 font-medium">Remote Address</th>
<th className="py-2 pr-4 font-medium">Status</th>
<th className="py-2 pr-4 font-medium">PID</th>
              </tr>
            </thead>
            <tbody>
  {filtered.map((c, index) => (
    <tr
      key={index}
      className="border-b border-border/30 last:border-0 hover:bg-accent/30"
    >
      <td className="py-2 pr-4 font-mono text-xs">
        {c.local || "-"}
      </td>

      <td className="py-2 pr-4 font-mono text-xs">
        {c.remote || "-"}
      </td>

      <td className="py-2 pr-4">
        <span
          className={cn(
            "rounded px-2 py-1 text-[10px] border",
            c.status === "ESTABLISHED"
              ? "bg-safe/10 text-safe border-safe/30"
              : "bg-warning/10 text-warning border-warning/30"
          )}
        >
          {c.status || "NONE"}
        </span>
      </td>

      <td className="py-2 pr-4 font-mono">
        {c.pid ?? "-"}
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
