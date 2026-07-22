"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, TrendingUp, Activity } from "lucide-react";

interface IncidentItem {
  id: number;
  title: string;
  severity: string;
  risk_score: number;
  source_ip: string;
  destination_ip: string;
  destination_port: number;
  timestamp: string;
}

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [incidentsRes, reportsRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/incidents"),
          fetch("http://127.0.0.1:8000/api/reports"),
        ]);

        const incidentsData = await incidentsRes.json();
        const reportsData = await reportsRes.json();
        setIncidents(incidentsData.data || []);
        setSummary(reportsData.data?.summary || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const severityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    incidents.forEach((incident) => {
      counts[incident.severity] = (counts[incident.severity] || 0) + 1;
    });
    return counts;
  }, [incidents]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-100">Loading analytics workspace…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Threat intelligence</p>
              <h1 className="mt-2 text-3xl font-semibold">Security analytics dashboard</h1>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              SOC operations online
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-blue-400"><Activity size={18} /> Total packets</div>
            <p className="mt-3 text-3xl font-semibold">{summary?.total_packets ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-red-400"><AlertTriangle size={18} /> Critical alerts</div>
            <p className="mt-3 text-3xl font-semibold">{summary?.critical_alerts ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-amber-400"><TrendingUp size={18} /> Average risk</div>
            <p className="mt-3 text-3xl font-semibold">{summary?.risk_score_avg ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-emerald-400"><ShieldCheck size={18} /> Incident count</div>
            <p className="mt-3 text-3xl font-semibold">{incidents.length}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Active incidents</h2>
            <div className="mt-4 space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{incident.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{incident.source_ip} → {incident.destination_ip}:{incident.destination_port}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${incident.severity === "critical" ? "bg-red-500/20 text-red-300" : incident.severity === "high" ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                    <span>Risk score {incident.risk_score}</span>
                    <span>{incident.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Severity breakdown</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(severityBreakdown).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="capitalize text-slate-300">{level}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
