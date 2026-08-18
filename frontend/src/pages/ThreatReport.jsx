import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileBarChart2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
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
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

const tooltipStyle = {
  background: "#101c2e",
  border: "1px solid #263955",
  borderRadius: 10,
};

// Colours for pie chart slices
const PREDICTION_COLORS = {
  Normal: "#39d9c8",
  Suspicious: "#f59e0b",
  Attack: "#fb7185",
};

// Severity badge colours
const SEVERITY_COLORS = {
  Low: "text-cyan bg-cyan/10",
  Medium: "text-amber-300 bg-amber-500/10",
  High: "text-orange-300 bg-orange-500/10",
  Critical: "text-red-300 bg-red-500/10",
};

// Risk level badge colours
const RISK_COLORS = {
  Low: "text-cyan",
  Medium: "text-amber-300",
  High: "text-orange-300",
  Critical: "text-red-300",
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <article className="panel p-5">
      <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </article>
  );
}

export default function ThreatReport() {
  const [predictions, setPredictions] = useState([]);
  const [flowStats, setFlowStats] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predRes, statsRes] = await Promise.all([
          api.get("/live/predictions"),
          api.get("/live/flow-statistics"),
        ]);
        setPredictions(predRes.data.predictions || []);
        setFlowStats(statsRes.data || null);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) return <Loading label="Loading live threat report..." />;

  if (error && predictions.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="MILESTONE 3"
          title="Live Threat Intelligence"
          description="Real-time anomaly detection and threat classification monitoring."
        />
        <div className="panel p-8 text-center">
          <FileBarChart2 className="mx-auto mb-4 h-12 w-12 text-slate-700" />
          <h2 className="font-semibold text-slate-300">No live data available</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </>
    );
  }

  // Derived Metrics from raw API data
  const totalPredictions = predictions.length;
  const normalTraffic = predictions.filter((p) => p.prediction_label === "Normal").length;
  const attackTraffic = predictions.filter((p) => p.prediction_label === "Attack").length;
  const suspiciousTraffic = predictions.filter((p) => p.prediction_label === "Suspicious").length;
  const criticalAlerts = predictions.filter((p) => p.severity === "Critical").length;

  const totalRiskScore = predictions.reduce((acc, p) => acc + (p.risk_score || 0), 0);
  const averageRiskScore = totalPredictions > 0 ? Math.round(totalRiskScore / totalPredictions) : 0;

  let liveRiskLevel = "Low";
  if (averageRiskScore > 80) liveRiskLevel = "Critical";
  else if (averageRiskScore > 60) liveRiskLevel = "High";
  else if (averageRiskScore > 30) liveRiskLevel = "Medium";

  const mostRecentTimestamp =
    predictions.length > 0
      ? Math.max(...predictions.map((p) => new Date(p.prediction_timestamp).getTime()))
      : Date.now();

  const generatedAt = new Date().toLocaleString();
  const mostRecentDetection = new Date(mostRecentTimestamp).toLocaleString();

  // Traffic Breakdown
  const distributionData = [
    { name: "Normal", value: normalTraffic },
    { name: "Suspicious", value: suspiciousTraffic },
    { name: "Attack", value: attackTraffic },
  ].filter((d) => d.value > 0);

  // Threat Categories
  const categoryCounts = {};
  predictions.forEach((p) => {
    const cat = p.predicted_class;
    if (cat && cat !== "BENIGN") {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  });
  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Severity Distribution
  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  predictions.forEach((p) => {
    if (p.severity) severityCounts[p.severity] = (severityCounts[p.severity] || 0) + 1;
  });
  const severityOrder = ["Critical", "High", "Medium", "Low"];
  const severityData = severityOrder
    .map((name) => ({ name, value: severityCounts[name] }))
    .filter((d) => d.value > 0);

  // Top Target Ports
  const portCounts = {};
  predictions.forEach((p) => {
    const port =
      p.features?.["Dst Port"] ??
      p.features?.["Destination Port"] ??
      p.features?.["dst_port"];
    if (port !== undefined) {
      portCounts[port] = (portCounts[port] || 0) + 1;
    }
  });
  const topPortsData = Object.entries(portCounts)
    .map(([port, count]) => ({ name: `Port ${port}`, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Top Risky Rows
  const topRows = [...predictions]
    .filter((p) => p.prediction_label !== "Normal")
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 20);

  const stats = [
    {
      label: "Total Predictions",
      value: totalPredictions.toLocaleString(),
      icon: Activity,
      color: "text-blue-300 bg-blue-500/10",
    },
    {
      label: "Active Flows",
      value: (flowStats?.active_flows_count || 0).toLocaleString(),
      icon: FileBarChart2,
      color: "text-indigo-300 bg-indigo-500/10",
    },
    {
      label: "Normal Traffic",
      value: normalTraffic.toLocaleString(),
      icon: ShieldCheck,
      color: "text-cyan bg-cyan/10",
    },
    {
      label: "Attack Traffic",
      value: attackTraffic.toLocaleString(),
      icon: ShieldAlert,
      color: "text-red-300 bg-red-500/10",
    },
    {
      label: "Critical Alerts",
      value: criticalAlerts.toLocaleString(),
      icon: AlertTriangle,
      color: "text-orange-300 bg-orange-500/10",
    },
    {
      label: "Average Risk Score",
      value: averageRiskScore.toString(),
      icon: TrendingUp,
      color: "text-violet-300 bg-violet-500/10",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="MILESTONE 3"
        title="Live Threat Intelligence"
        description="Real-time anomaly detection and threat classification monitoring."
      />

      {/* ── Risk badge + timestamps ────────────────────────────────────────── */}
      <div className="panel mb-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-cyan" />
            <div>
              <p className="text-sm font-semibold text-white">Live Report Generated</p>
              <p className="text-xs text-slate-500">{generatedAt}</p>
            </div>
          </div>
          {predictions.length > 0 && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-semibold text-white">Most Recent Detection</p>
                <p className="text-xs text-slate-500">{mostRecentDetection}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2">
          <span className="text-xs text-slate-400">Live Risk Level</span>
          <span
            className={`text-sm font-bold ${RISK_COLORS[liveRiskLevel] ?? "text-slate-300"}`}
          >
            {liveRiskLevel}
          </span>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map(({ label, value, icon, color }) => (
          <StatCard key={label} label={label} value={value} icon={icon} color={color} />
        ))}
      </section>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <section className="mb-6 grid gap-6 xl:grid-cols-4">
        {/* Prediction distribution pie */}
        <article className="panel p-5 xl:col-span-1">
          <h2 className="font-semibold text-white">Traffic Breakdown</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Normal vs Suspicious vs Attack
          </p>
          <div className="h-64">
            {distributionData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {distributionData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PREDICTION_COLORS[entry.name] ?? "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                No breakdown data
              </div>
            )}
          </div>
        </article>

        {/* Threat category bar chart */}
        <article className="panel p-5 xl:col-span-1">
          <h2 className="font-semibold text-white">Threat Categories</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Rule-based live classification
          </p>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid stroke="#1e2d43" strokeDasharray="4 4" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    width={90}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#fb7185" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                No anomalies detected
              </div>
            )}
          </div>
        </article>

        {/* Severity distribution */}
        <article className="panel p-5 xl:col-span-1">
          <h2 className="font-semibold text-white">Severity Distribution</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Risk severity across live traffic
          </p>
          <div className="h-64">
            {severityData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={severityData}>
                  <CartesianGrid stroke="#1e2d43" strokeDasharray="4 4" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[7, 7, 0, 0]}>
                    {severityData.map(({ name }) => (
                      <Cell
                        key={name}
                        fill={
                          name === "Critical"
                            ? "#fb7185"
                            : name === "High"
                            ? "#f97316"
                            : name === "Medium"
                            ? "#f59e0b"
                            : "#39d9c8"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                No severity data
              </div>
            )}
          </div>
        </article>
        
        {/* Top Target Ports */}
        <article className="panel p-5 xl:col-span-1">
          <h2 className="font-semibold text-white">Top Target Ports</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Most frequent destination ports
          </p>
          <div className="h-64">
            {topPortsData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topPortsData} layout="vertical">
                  <CartesianGrid stroke="#1e2d43" strokeDasharray="4 4" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    width={80}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#818cf8" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                No port data available
              </div>
            )}
          </div>
        </article>
      </section>

      {/* ── Top risky flows table ─────────────────────────────────────────── */}
      <section className="panel p-6">
        <h2 className="mb-1 font-semibold text-white">Top Risky Live Flows</h2>
        <p className="mb-5 text-xs text-slate-500">
          Up to 20 highest-risk flows from the recent monitoring window.
        </p>
        {topRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="mb-4 h-10 w-10 text-cyan/30" />
            <p className="text-sm text-slate-500">No high-risk flows detected recently.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Flow ID</th>
                  <th className="px-4 py-3">Prediction Label</th>
                  <th className="px-4 py-3">Threat Category</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Severity</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-800/60 transition hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {row.flow_id || `Flow-${idx}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                          row.prediction_label === "Attack"
                            ? "bg-red-500/10 text-red-300"
                            : row.prediction_label === "Suspicious"
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-cyan/10 text-cyan"
                        }`}
                      >
                        {row.prediction_label ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.predicted_class !== "BENIGN" ? row.predicted_class : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              (row.risk_score ?? 0) > 80
                                ? "bg-red-400"
                                : (row.risk_score ?? 0) > 60
                                ? "bg-orange-400"
                                : (row.risk_score ?? 0) > 30
                                ? "bg-amber-400"
                                : "bg-cyan"
                            }`}
                            style={{ width: `${row.risk_score ?? 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300">
                          {row.risk_score ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                          SEVERITY_COLORS[row.severity] ?? "text-slate-400 bg-slate-800"
                        }`}
                      >
                        {row.severity ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
