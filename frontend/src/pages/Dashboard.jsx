import { Activity, Database, ShieldAlert, ShieldCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data: result }) => setData(result))
      .catch((err) => setError(err.message));
  }, []);

  if (!data && !error) return <Loading label="Loading threat overview..." />;
  if (error) return <div className="panel p-8 text-red-300">{error}</div>;

  const cards = [
    { label: "Uploaded datasets", value: data.total_datasets, icon: Database, color: "text-blue-300 bg-blue-500/10" },
    { label: "Total records", value: data.total_records.toLocaleString(), icon: Activity, color: "text-violet-300 bg-violet-500/10" },
    { label: "Normal traffic", value: data.normal_count.toLocaleString(), icon: ShieldCheck, color: "text-cyan bg-cyan/10" },
    { label: "Attack count", value: data.attack_count.toLocaleString(), icon: ShieldAlert, color: "text-red-300 bg-red-500/10" },
    { label: "Detection accuracy", value: `${data.detection_accuracy}%`, icon: Target, color: "text-amber-300 bg-amber-500/10" },
  ];

  return (
    <>
      <PageHeader
        title="Security overview"
        description="A concise view of datasets, model performance, and detected network anomalies."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <article className="panel p-5" key={label}>
            <span className={`mb-5 grid h-10 w-10 place-items-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Traffic distribution pie chart */}
        <article className="panel p-5">
          <h2 className="font-semibold text-white">Traffic distribution</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">Normal vs anomalous predictions</p>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.traffic_distribution}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {data.traffic_distribution.map((_, index) => (
                    <Cell fill={index === 0 ? "#39d9c8" : "#fb7185"} key={index} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Dataset activity line chart */}
        <article className="panel p-5 xl:col-span-2">
          <h2 className="font-semibold text-white">Dataset activity</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">Records processed in recent datasets</p>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={data.dataset_activity}>
                <CartesianGrid stroke="#1e2d43" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  dataKey="records"
                  stroke="#39d9c8"
                  strokeWidth={3}
                  dot={{ fill: "#39d9c8" }}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Anomalies by dataset bar chart */}
        <article className="panel p-5 xl:col-span-3">
          <h2 className="font-semibold text-white">Anomalies by dataset</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            Detected attack volume across prediction runs
          </p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.dataset_activity}>
                <CartesianGrid stroke="#1e2d43" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="anomalies" fill="#fb7185" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </>
  );
}
