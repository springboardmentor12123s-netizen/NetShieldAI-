import {
  Activity,
  AlertTriangle,
  CheckCircle2,
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
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reports/latest")
      .then(({ data }) => setReport(data))
      .catch((err) => setError(err.message));
  }, []);

  if (!report && !error) return <Loading label="Loading threat report..." />;

  if (error) {
    return (
      <>
        <PageHeader
          eyebrow="MILESTONE 2"
          title="Threat Report"
          description="AI-generated anomaly detection and threat classification report."
        />
        <div className="panel p-8 text-center">
          <FileBarChart2 className="mx-auto mb-4 h-12 w-12 text-slate-700" />
          <h2 className="font-semibold text-slate-300">No report available</h2>
          <p className="mt-2 text-sm text-slate-500">
            {error.includes("404")
              ? "Upload a CSV and run a prediction first to generate a threat report."
              : error}
          </p>
        </div>
      </>
    );
  }

  // ── Prepare chart data ────────────────────────────────────────────────────
  const distributionData = [
    { name: "Normal", value: report.normal_count },
    { name: "Suspicious", value: report.suspicious_count },
    { name: "Attack", value: report.anomaly_count - report.suspicious_count },
  ].filter((d) => d.value > 0);

  const categoryData = Object.entries(report.threat_category_summary || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const severityOrder = ["Critical", "High", "Medium", "Low"];
  const severityData = severityOrder
    .filter((s) => report.severity_summary?.[s] !== undefined)
    .map((name) => ({ name, value: report.severity_summary[name] }));

  const topRows = report.top_risky_rows || [];

  const stats = [
    {
      label: "Total Records",
      value: report.total_records.toLocaleString(),
      icon: Activity,
      color: "text-blue-300 bg-blue-500/10",
    },
    {
      label: "Normal Traffic",
      value: report.normal_count.toLocaleString(),
      icon: ShieldCheck,
      color: "text-cyan bg-cyan/10",
    },
    {
      label: "Suspicious",
      value: report.suspicious_count.toLocaleString(),
      icon: AlertTriangle,
      color: "text-amber-300 bg-amber-500/10",
    },
    {
      label: "Confirmed Attacks",
      value: (report.anomaly_count - report.suspicious_count).toLocaleString(),
      icon: ShieldAlert,
      color: "text-red-300 bg-red-500/10",
    },
    {
      label: "Anomaly Rate",
      value: `${report.anomaly_percentage}%`,
      icon: TrendingUp,
      color: "text-violet-300 bg-violet-500/10",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="MILESTONE 2"
        title="Threat Report"
        description="AI-generated anomaly detection and threat classification report."
      />

      {/* ── Risk badge + timestamp ────────────────────────────────────────── */}
      <div className="panel mb-6 flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-cyan" />
          <div>
            <p className="text-sm font-semibold text-white">Report Generated</p>
            <p className="text-xs text-slate-500">
              {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2">
          <span className="text-xs text-slate-400">Overall Risk Level</span>
          <span
            className={`text-sm font-bold ${RISK_COLORS[report.risk_level] ?? "text-slate-300"}`}
          >
            {report.risk_level}
          </span>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, icon, color }) => (
          <StatCard key={label} label={label} value={value} icon={icon} color={color} />
        ))}
      </section>

      {/* ── Supervised metrics (only when Label column was present) ───────── */}
      {report.supervised_metrics && (
        <section className="panel mb-6 p-6">
          <h2 className="mb-1 font-semibold text-white">Supervised Evaluation Metrics</h2>
          <p className="mb-5 text-xs text-slate-500">
            Computed by comparing predictions against the Label column in your dataset.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Accuracy", report.supervised_metrics.accuracy],
              ["Precision", report.supervised_metrics.precision],
              ["Recall", report.supervised_metrics.recall],
              ["F1 Score", report.supervised_metrics.f1_score],
            ].map(([label, value]) => (
              <div className="rounded-xl bg-slate-950/50 p-4" key={label}>
                <p className="text-2xl font-bold text-cyan">{value ?? "—"}%</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          {report.supervised_metrics.confusion_matrix && (
            <>
              <h3 className="mb-3 mt-6 text-sm font-semibold text-white">Confusion Matrix</h3>
              <div className="grid max-w-sm grid-cols-2 gap-2 text-center text-sm">
                <div className="rounded-lg bg-cyan/10 p-4">
                  <b className="block text-xl text-cyan">
                    {report.supervised_metrics.confusion_matrix[0][0]}
                  </b>
                  <span className="text-xs text-slate-500">True Normal</span>
                </div>
                <div className="rounded-lg bg-red-500/10 p-4">
                  <b className="block text-xl text-red-300">
                    {report.supervised_metrics.confusion_matrix[0][1]}
                  </b>
                  <span className="text-xs text-slate-500">False Anomaly</span>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-4">
                  <b className="block text-xl text-amber-300">
                    {report.supervised_metrics.confusion_matrix[1][0]}
                  </b>
                  <span className="text-xs text-slate-500">Missed Anomaly</span>
                </div>
                <div className="rounded-lg bg-cyan/10 p-4">
                  <b className="block text-xl text-cyan">
                    {report.supervised_metrics.confusion_matrix[1][1]}
                  </b>
                  <span className="text-xs text-slate-500">True Anomaly</span>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <section className="mb-6 grid gap-6 xl:grid-cols-3">
        {/* Prediction distribution pie */}
        <article className="panel p-5">
          <h2 className="font-semibold text-white">Prediction Distribution</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Normal vs Suspicious vs Attack breakdown
          </p>
          <div className="h-64">
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
          </div>
        </article>

        {/* Threat category bar chart */}
        <article className="panel p-5">
          <h2 className="font-semibold text-white">Threat Categories</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Rule-based classification of anomalous traffic
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
                    width={130}
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
        <article className="panel p-5">
          <h2 className="font-semibold text-white">Severity Distribution</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Risk severity counts across all predictions
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
      </section>

      {/* ── Top risky rows table ─────────────────────────────────────────── */}
      <section className="panel p-6">
        <h2 className="mb-1 font-semibold text-white">Top Risky Rows</h2>
        <p className="mb-5 text-xs text-slate-500">
          Up to 20 highest-risk prediction rows from the latest analysis run.
        </p>
        {topRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="mb-4 h-10 w-10 text-cyan/30" />
            <p className="text-sm text-slate-500">No high-risk rows found in this dataset.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Row #</th>
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
                      {row.row_number}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                          row["Prediction Label"] === "Attack"
                            ? "bg-red-500/10 text-red-300"
                            : row["Prediction Label"] === "Suspicious"
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-cyan/10 text-cyan"
                        }`}
                      >
                        {row["Prediction Label"] ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row["Threat Category"] ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              (row["Risk Score"] ?? 0) > 80
                                ? "bg-red-400"
                                : (row["Risk Score"] ?? 0) > 60
                                ? "bg-orange-400"
                                : (row["Risk Score"] ?? 0) > 30
                                ? "bg-amber-400"
                                : "bg-cyan"
                            }`}
                            style={{ width: `${row["Risk Score"] ?? 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300">
                          {row["Risk Score"] ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                          SEVERITY_COLORS[row["Severity"]] ?? "text-slate-400 bg-slate-800"
                        }`}
                      >
                        {row["Severity"] ?? "—"}
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
