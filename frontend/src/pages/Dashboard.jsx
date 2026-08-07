import { Activity, Database, ShieldAlert, ShieldCheck, Target, Package, Radio, Archive, AlertTriangle, Gauge, FolderOpen, CheckCircle, Clock } from "lucide-react";
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
import { useLiveData } from "../context/LiveDataContext";

const tooltipStyle = {
  background: "rgba(16, 28, 46, 0.9)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 10,
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
  color: "#fff",
};

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 800;
    const startTime = performance.now();
    
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(Math.floor(start + (end - start) * ease));
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };
    requestAnimationFrame(update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
}

export default function Dashboard() {
  const [historicalData, setHistoricalData] = useState(null);
  const [incidentStats, setIncidentStats] = useState(null);
  const [error, setError] = useState("");
  
  const { liveStats, predictions: livePredictions, trafficHistory } = useLiveData();

  useEffect(() => {
    Promise.all([
      api.get("/dashboard"),
      api.get("/incidents/stats")
    ])
      .then(([dashboardRes, incidentsRes]) => {
        setHistoricalData(dashboardRes.data);
        setIncidentStats(incidentsRes.data);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (!historicalData && !error) return <Loading label="Loading threat overview..." />;
  if (error) return <div className="panel p-8 text-red-300">{error}</div>;

  const cards = [
    { label: "Total Packets", value: liveStats.totalPackets, icon: Package, color: "text-blue-300 bg-blue-500/20" },
    { label: "Active Flows", value: liveStats.activeFlows, icon: Radio, color: "text-emerald-300 bg-emerald-500/20" },
    { label: "Expired Flows", value: liveStats.expiredFlows, icon: Archive, color: "text-slate-300 bg-slate-500/20" },
    { label: "Total Predictions", value: liveStats.totalPredictions, icon: Target, color: "text-indigo-300 bg-indigo-500/20" },
    { label: "Attack Count", value: liveStats.attackCount, icon: ShieldAlert, color: "text-rose-400 bg-rose-500/20" },
    { label: "Normal Traffic", value: liveStats.normalTraffic, icon: ShieldCheck, color: "text-cyan-300 bg-cyan-500/20" },
    { label: "Critical Threats", value: liveStats.criticalThreats, icon: AlertTriangle, color: "text-amber-400 bg-amber-500/20" },
    { label: "Average Risk Score", value: liveStats.averageRiskScore, icon: Gauge, color: "text-fuchsia-300 bg-fuchsia-500/20" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Operations Center"
        description="Live telemetry and threat analytics dashboard."
      />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <article 
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-cyan-500/10"
          >
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl transition-all duration-500 group-hover:bg-white/10"></div>
            
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-inner ${color}`}>
                  <Icon className="h-6 w-6 drop-shadow-md" />
                </span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                <AnimatedNumber value={value} />
                {label === "Average Risk Score" && <span className="ml-1 text-lg text-slate-400">/ 100</span>}
              </h3>
              <p className="mt-2 text-sm font-medium tracking-wide text-slate-400 uppercase">{label}</p>
            </div>
          </article>
        ))}
      </section>
      {incidentStats && (
        <>
          <div className="mt-8 flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">Incident Management</h2>
          </div>
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <article className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-xl transition-all hover:bg-rose-500/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-rose-500/10">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 shadow-inner">
                  <FolderOpen className="h-6 w-6 drop-shadow-md" />
                </span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white"><AnimatedNumber value={incidentStats.open_incidents} /></h3>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-rose-300">Open Incidents</p>
            </article>

            <article className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-xl transition-all hover:bg-emerald-500/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-emerald-500/10">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shadow-inner">
                  <CheckCircle className="h-6 w-6 drop-shadow-md" />
                </span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white"><AnimatedNumber value={incidentStats.resolved_incidents} /></h3>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-emerald-300">Resolved Incidents</p>
            </article>

            <article className="group relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-xl transition-all hover:bg-red-500/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-red-500/10">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-500 shadow-inner">
                  <AlertTriangle className="h-6 w-6 drop-shadow-md" />
                </span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white"><AnimatedNumber value={incidentStats.critical_incidents} /></h3>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-red-400">Critical Incidents</p>
            </article>

            <article className="group relative overflow-hidden rounded-2xl border border-slate-500/20 bg-slate-500/5 p-6 backdrop-blur-xl transition-all hover:bg-slate-500/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-slate-500/10">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/20 text-slate-300 shadow-inner">
                  <Clock className="h-6 w-6 drop-shadow-md" />
                </span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white">{incidentStats.average_resolution_time}</h3>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-400">Avg Resolution Time</p>
            </article>
          </section>
        </>
      )}

      {/* Analytics Section */}
      <section className="mt-8 space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Live Analytics</h2>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live</span>
          </div>
        </div>

        {trafficHistory.length === 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md"></div>
            ))}
          </div>
        ) : livePredictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-16 text-center backdrop-blur-md">
            <Activity className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-semibold text-white">Waiting for network traffic</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-400">Charts will appear here once the prediction engine starts processing flows.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 1. Traffic Over Time */}
            <article className="panel border border-white/5 bg-slate-900/50 p-5 backdrop-blur-md">
              <h3 className="font-semibold text-white">Traffic Over Time</h3>
              <p className="mb-4 mt-1 text-xs text-slate-400">Processed packets and predictions (last 30s)</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={trafficHistory}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" name="Total Packets" dataKey="packets" stroke="#3b82f6" strokeWidth={3} dot={false} />
                    <Line type="monotone" name="Predictions" dataKey="predictions" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* 2. Attack vs Normal */}
            <article className="panel border border-white/5 bg-slate-900/50 p-5 backdrop-blur-md">
              <h3 className="font-semibold text-white">Attack vs Normal</h3>
              <p className="mb-4 mt-1 text-xs text-slate-400">Distribution of recent threat predictions</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Normal", value: liveStats.normalTraffic, fill: "#10b981" },
                        { name: "Attack", value: liveStats.attackCount, fill: "#ef4444" }
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {[
                        { name: "Normal", value: liveStats.normalTraffic, fill: "#10b981" },
                        { name: "Attack", value: liveStats.attackCount, fill: "#ef4444" }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* 3. Protocol Distribution */}
            <article className="panel border border-white/5 bg-slate-900/50 p-5 backdrop-blur-md">
              <h3 className="font-semibold text-white">Protocol Distribution</h3>
              <p className="mb-4 mt-1 text-xs text-slate-400">Network protocols identified in live flows</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const counts = { TCP: 0, UDP: 0, ICMP: 0, Others: 0 };
                        livePredictions.forEach(p => {
                          const proto = p.flow_id ? String(p.flow_id).split('-').pop().toUpperCase() : "";
                          if (proto.includes("TCP") || proto === "6") counts.TCP++;
                          else if (proto.includes("UDP") || proto === "17") counts.UDP++;
                          else if (proto.includes("ICMP") || proto === "1") counts.ICMP++;
                          else counts.Others++;
                        });
                        return [
                          { name: "TCP", value: counts.TCP, fill: "#3b82f6" },
                          { name: "UDP", value: counts.UDP, fill: "#f59e0b" },
                          { name: "ICMP", value: counts.ICMP, fill: "#8b5cf6" },
                          { name: "Others", value: counts.Others, fill: "#64748b" }
                        ].filter(d => d.value > 0);
                      })()}
                      dataKey="value"
                      outerRadius={100}
                      stroke="none"
                    >
                      {(() => {
                        const counts = { TCP: 0, UDP: 0, ICMP: 0, Others: 0 };
                        livePredictions.forEach(p => {
                          const proto = p.flow_id ? String(p.flow_id).split('-').pop().toUpperCase() : "";
                          if (proto.includes("TCP") || proto === "6") counts.TCP++;
                          else if (proto.includes("UDP") || proto === "17") counts.UDP++;
                          else if (proto.includes("ICMP") || proto === "1") counts.ICMP++;
                          else counts.Others++;
                        });
                        return [
                          { name: "TCP", value: counts.TCP, fill: "#3b82f6" },
                          { name: "UDP", value: counts.UDP, fill: "#f59e0b" },
                          { name: "ICMP", value: counts.ICMP, fill: "#8b5cf6" },
                          { name: "Others", value: counts.Others, fill: "#64748b" }
                        ].filter(d => d.value > 0);
                      })().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* 4. Severity Distribution */}
            <article className="panel border border-white/5 bg-slate-900/50 p-5 backdrop-blur-md">
              <h3 className="font-semibold text-white">Severity Distribution</h3>
              <p className="mb-4 mt-1 text-xs text-slate-400">Threat severities ranked by volume</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={[
                    { name: 'Critical', value: livePredictions.filter(p => p.severity === 'Critical').length, fill: '#ef4444' },
                    { name: 'High', value: livePredictions.filter(p => p.severity === 'High').length, fill: '#f97316' },
                    { name: 'Medium', value: livePredictions.filter(p => p.severity === 'Medium').length, fill: '#eab308' },
                    { name: 'Low', value: livePredictions.filter(p => p.severity === 'Low').length, fill: '#10b981' }
                  ]}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[
                        { name: 'Critical', value: livePredictions.filter(p => p.severity === 'Critical').length, fill: '#ef4444' },
                        { name: 'High', value: livePredictions.filter(p => p.severity === 'High').length, fill: '#f97316' },
                        { name: 'Medium', value: livePredictions.filter(p => p.severity === 'Medium').length, fill: '#eab308' },
                        { name: 'Low', value: livePredictions.filter(p => p.severity === 'Low').length, fill: '#10b981' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        )}
      </section>

      {historicalData && (
        <section className="mt-8 grid gap-6 xl:grid-cols-3">
          {/* Traffic distribution pie chart */}
          <article className="panel p-5 border border-white/5 bg-slate-900/50 backdrop-blur-md">
            <h2 className="font-semibold text-white">Historical Distribution</h2>
            <p className="mb-4 mt-1 text-xs text-slate-400">Normal vs anomalous overall datasets</p>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={historicalData.traffic_distribution}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {historicalData.traffic_distribution.map((_, index) => (
                      <Cell fill={index === 0 ? "#06b6d4" : "#fb7185"} key={index} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Dataset activity line chart */}
          <article className="panel p-5 xl:col-span-2 border border-white/5 bg-slate-900/50 backdrop-blur-md">
            <h2 className="font-semibold text-white">Dataset Activity</h2>
            <p className="mb-4 mt-1 text-xs text-slate-400">Records processed in recent datasets</p>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={historicalData.dataset_activity}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    dataKey="records"
                    stroke="#0ea5e9"
                    strokeWidth={4}
                    dot={{ fill: "#0ea5e9", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#fff", stroke: "#0ea5e9" }}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Anomalies by dataset bar chart */}
          <article className="panel p-5 xl:col-span-3 border border-white/5 bg-slate-900/50 backdrop-blur-md">
            <h2 className="font-semibold text-white">Anomalies by dataset</h2>
            <p className="mb-4 mt-1 text-xs text-slate-400">
              Detected attack volume across prediction runs
            </p>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={historicalData.dataset_activity}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="anomalies" fill="#fb7185" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
