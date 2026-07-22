import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Cpu,
  Gauge,
  ShieldAlert,
  Wifi,
  AlertTriangle,
  MoreHorizontal,
  Database,
  Brain,
  ServerCog,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StatCard } from "@/components/soc/StatCard";
import { SeverityBadge } from "@/components/soc/SeverityBadge";
import {
  attackTypesData,
  generateAlerts,
  protocolDistribution,
  threatTimeline,
  trafficSeries,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "SOC Dashboard — NetShield AI" },
      { name: "description", content: "Real-time SOC operations overview." },
    ],
  }),
  component: Dashboard,
});

const PIE_COLORS = [
  "var(--primary)",
  "var(--safe)",
  "var(--info)",
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
  labelStyle: { color: "oklch(0.72 0.03 255)" },
};

function Dashboard() {
  const [traffic, setTraffic] = useState(() => trafficSeries(24));
  const [pps, setPps] = useState(1245);
  const [teams, setTeams] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]); 
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const alerts = useMemo(() => generateAlerts(8), []);
  const timeline = useMemo(() => threatTimeline(), []);
  const attacks = useMemo(() => attackTypesData(), []);
  const protocols = useMemo(() => protocolDistribution(), []);

  useEffect(() => {
    axios.get("http://localhost:8000/teams").then((res) => {
  setTeams(res.data);
});

axios.get("http://localhost:8000/audit-logs").then((res) => {
  setAuditLogs(res.data);
});
axios
.post("http://localhost:8000/ai/predict", {
    dur: 0,
    proto: 0,
    service: 0,
    state: 0,
    spkts: 2,
    dpkts: 2,
    sbytes: 200,
    dbytes: 150,
    rate: 20,
    sttl: 64,
    dttl: 64,
    sload: 100,
    dload: 100,
    sloss: 0,
    dloss: 0,
    sinpkt: 10,
    dinpkt: 10,
    sjit: 0,
    djit: 0,
    swin: 255,
    stcpb: 0,
    dtcpb: 0,
    dwin: 255,
    tcprtt: 1,
    synack: 1,
    ackdat: 1,
    smean: 100,
    dmean: 100,
    trans_depth: 0,
    response_body_len: 0,
    ct_srv_src: 1,
    ct_state_ttl: 1,
    ct_dst_ltm: 1,
    ct_src_dport_ltm: 1,
    ct_dst_sport_ltm: 1,
    ct_dst_src_ltm: 1,
    is_ftp_login: 0,
    ct_ftp_cmd: 0,
    ct_flw_http_mthd: 0,
    ct_src_ltm: 1,
    ct_srv_dst: 1,
    is_sm_ips_ports: 0,
})
.then((res) => {
    setAiPrediction(res.data);
    return axios.get("http://localhost:8000/ai/history");
  })
  .then((res) => {
    setHistory(res.data);
  })
  .catch((err) => {
    console.error(err);
  });




    const i = setInterval(() => {
      setPps((p) => Math.max(400, Math.round(p + (Math.random() - 0.5) * 260)));
      setTraffic((t) => {
        const last = t[t.length - 1];
        const nextHour = (parseInt(last.t.split(":")[0], 10) + 1) % 24;
        const base = 800 + Math.sin(nextHour / 3) * 250 + Math.random() * 300;
        const next = {
          t: `${String(nextHour).padStart(2, "0")}:00`,
          inbound: Math.round(base + Math.random() * 200),
          outbound: Math.round(base * 0.7 + Math.random() * 180),
          anomalies: Math.max(0, Math.round(Math.sin(nextHour / 2) * 8 + Math.random() * 6)),
        };
        return [...t.slice(1), next];
      });
    }, 2500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Security Operations Center</div>
          <h1 className="mt-1 text-2xl font-semibold">Threat overview</h1>
          <p className="text-sm text-muted-foreground">
            Live posture across your network, sensors, and AI detection models.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 text-safe px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-safe pulse-dot" />
            Overall risk: Moderate
          </span>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Devices" value="1,284" delta={2.1} icon={Wifi} tone="info" hint="42 subnets" />
        <StatCard label="Network Traffic" value={`${(pps / 1000).toFixed(2)} Gbps`} delta={-1.4} icon={Activity} tone="primary" hint={`${pps.toLocaleString()} pkt/s`} />
        <StatCard label="Detected Threats" value="317" delta={12.6} icon={ShieldAlert} tone="suspicious" hint="last 24h" />
        <StatCard label="Critical Alerts" value="7" delta={40} icon={AlertTriangle} tone="critical" hint="needs triage" />
        <StatCard label="Risk Score" value="62 / 100" delta={-3.2} icon={Gauge} tone="warning" hint="Moderate" />
      </div>

      <div className="glass-card p-5 border border-primary/30">
    <div className="flex items-center justify-between mb-5">

    <div>
        <h2 className="text-xl font-bold">
            🤖 AI Threat Detection
        </h2>

        <p className="text-sm text-muted-foreground">
            Real-time Machine Learning Prediction
        </p>
    </div>

    <button
    onClick={() =>
        window.open(
            "http://127.0.0.1:8000/report/generate",
            "_blank"
        )
    }
    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
>
    📄 Download Report
</button>

</div>

    {aiPrediction && (

    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        <StatCard
            label="Threat"
            value={aiPrediction.threat}
            icon={ShieldAlert}
            tone="critical"
        />

        <StatCard
            label="Confidence"
            value={`${aiPrediction.confidence}%`}
            icon={Brain}
            tone="info"
        />

        <StatCard
            label="Risk Score"
            value={aiPrediction.risk}
            icon={Gauge}
            tone="warning"
        />

        <StatCard
            label="Severity"
            value={aiPrediction.severity}
            icon={AlertTriangle}
            tone="critical"
        />

        <StatCard
            label="Anomaly"
            value={aiPrediction.anomaly ? "YES" : "NO"}
            icon={Cpu}
            tone={
                aiPrediction.Anomaly
                ? "critical"
                : "safe"
            }
        />

    </div>

    )}

</div>

<div className="glass-card p-5 mt-5">

  <div className="flex items-center justify-between mb-4">

    <h2 className="text-lg font-semibold">
      🧠 Recent AI Predictions
    </h2>

    <span className="text-xs text-muted-foreground">
      Last 20 Predictions
    </span>

  </div>

  <div className="overflow-x-auto">

    <table className="min-w-full table-auto text-sm">

      <thead>

        <tr className="border-b border-border/60 text-left">

          <th className="py-3 px-4 text-left">Time</th>

          <th className="py-3 px-4 text-left">Threat</th>

<th className="py-3 px-4 text-left">Confidence</th>

<th className="py-3 px-4 text-left">Risk</th>

<th className="py-3 px-4 text-left">Severity</th>

<th className="py-3 px-4 text-left">Anomaly</th>

        </tr>

      </thead>

      <tbody>

        {history.map((item, index) => (

          <tr
            key={index}
            className="border-b border-border/40 hover:bg-accent/30"
          >

            <td className="py-3">{item.time}</td>

            <td className="py-3 px-4">{item.threat}</td>

            <td className="py-3 px-4">{item.confidence}%</td>

            <td className="py-3 px-4">{item.risk}</td>

            <td>
              <SeverityBadge level={item.severity.toLowerCase()} />
            </td>

            <td>
              <span
className={`px-3 py-1 rounded-full text-xs font-semibold ${
item.anomaly
? "bg-red-500/20 text-red-400"
: "bg-green-500/20 text-green-400"
}`}>

{item.anomaly ? "ANOMALY" : "NORMAL"}

</span>
            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Real-time network traffic</div>
              <div className="text-xs text-muted-foreground">Packets per second across all interfaces</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <LegendDot color="var(--primary)" label="Inbound" />
              <LegendDot color="var(--info)" label="Outbound" />
              <LegendDot color="var(--critical)" label="Anomalies" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic}>
                <defs>
                  <linearGradient id="gIn" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.21 262)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.62 0.21 262)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.15 235)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.72 0.15 235)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="t" stroke="oklch(0.72 0.03 255)" fontSize={11} />
                <YAxis stroke="oklch(0.72 0.03 255)" fontSize={11} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="inbound" stroke="oklch(0.62 0.21 262)" fill="url(#gIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="outbound" stroke="oklch(0.72 0.15 235)" fill="url(#gOut)" strokeWidth={2} />
                <Line type="monotone" dataKey="anomalies" stroke="oklch(0.63 0.25 25)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Protocol distribution</div>
              <div className="text-xs text-muted-foreground">Last hour</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={protocols} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} stroke="none" paddingAngle={2}>
                  {protocols.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: "oklch(0.72 0.03 255)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Threat timeline</div>
              <div className="text-xs text-muted-foreground">Alerts by severity, last 24h</div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="t" stroke="oklch(0.72 0.03 255)" fontSize={11} />
                <YAxis stroke="oklch(0.72 0.03 255)" fontSize={11} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="low" stackId="s" fill="oklch(0.72 0.18 155)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="s" fill="oklch(0.85 0.17 92)" />
                <Bar dataKey="high" stackId="s" fill="oklch(0.72 0.19 55)" />
                <Bar dataKey="critical" stackId="s" fill="oklch(0.63 0.25 25)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Top attack types</div>
              <div className="text-xs text-muted-foreground">Last 7 days</div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attacks} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" horizontal={false} />
                <XAxis type="number" stroke="oklch(0.72 0.03 255)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="oklch(0.72 0.03 255)" fontSize={11} width={120} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="count" fill="oklch(0.62 0.21 262)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts + system health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Recent alerts</div>
              <div className="text-xs text-muted-foreground">Auto-refreshing from detection pipeline</div>
            </div>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">Destination</th>
                  <th className="py-2 pr-4 font-medium">Protocol</th>
                  <th className="py-2 pr-4 font-medium">Threat</th>
                  <th className="py-2 pr-4 font-medium">Severity</th>
                  <th className="py-2 pr-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                      {new Date(a.time).toISOString().slice(11, 19)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{a.srcIp}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{a.dstIp}</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-mono">
                        {a.protocol}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{a.threat}</td>
                    <td className="py-2.5 pr-4"><SeverityBadge level={a.severity} /></td>
                    <td className="py-2.5 pr-2 text-right">
                      <button className="h-7 w-7 rounded-md hover:bg-accent/60 inline-flex items-center justify-center">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="text-sm font-semibold mb-4">System health</div>
            <div className="space-y-3">
              <HealthRow icon={ServerCog} label="API Gateway" value="Operational" tone="safe" meter={98} />
              <HealthRow icon={Database} label="PostgreSQL" value="Operational" tone="safe" meter={94} />
              <HealthRow icon={Database} label="MongoDB" value="Operational" tone="safe" meter={91} />
              <HealthRow icon={Brain} label="ML Inference" value="Degraded" tone="warning" meter={72} />
              <HealthRow icon={Cpu} label="Sensor Fleet" value="Operational" tone="safe" meter={99} />
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="text-sm font-semibold mb-3">Notifications</div>
            <ul className="space-y-3 text-sm">
              {[
                { t: "Critical anomaly detected on 10.0.4.21", tone: "critical", time: "just now" },
                { t: "Model 'IsolationForest-v3' retrained", tone: "info", time: "2 min ago" },
                { t: "New CVE feed synced (18 entries)", tone: "safe", time: "6 min ago" },
                { t: "Sensor eth1 packet loss > 2%", tone: "warning", time: "12 min ago" },
              ].map((n, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full pulse-dot bg-${n.tone}`} />
                  <div className="flex-1">
                    <div className="text-sm">{n.t}</div>
                    <div className="text-[11px] text-muted-foreground">{n.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function HealthRow({
  icon: Icon,
  label,
  value,
  tone,
  meter,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "safe" | "warning" | "critical" | "info";
  meter: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className={`text-xs font-medium text-${tone}`}>{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <div className={`h-full bg-${tone} rounded-full`} style={{ width: `${meter}%` }} />
      </div>
      
    </div>
  );
}
