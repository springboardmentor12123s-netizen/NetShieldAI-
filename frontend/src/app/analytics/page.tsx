"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, TrendingUp, Activity } from "lucide-react";
import AppShell from "../../components/AppShell";

interface IncidentItem {
  id?: string | number;
  incident_id?: string;
  incident?: string;
  title?: string;
  severity?: string;
  risk_score?: number;
  source?: string;
  source_ip?: string;
  destination?: string;
  destination_ip?: string;
  timestamp?: string;
  created_at?: string;
}

export default function AnalyticsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveStats() {
      try {
        // Just fetch the live alerts, we will calculate the stats dynamically!
        const res = await fetch(`${API_URL}/api/alerts`);
        const incidentsData = await res.json();
        
        setIncidents(incidentsData.data || incidentsData || []);
      } catch (error) {
        console.error("Failed to fetch live stats:", error);
      } finally {
        setLoading(false);
      }
    }

    // 1. Initial Load
    loadLiveStats();

    // 2. Set up Auto-Refresh (Polling every 1 seconds)
    const intervalId = setInterval(loadLiveStats, 1000);

    // 3. Clean up interval if user leaves the page
    return () => clearInterval(intervalId);
  }, []);

  // Calculate dynamic stats based on live traffic
  const { severityBreakdown, averageRisk } = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    let totalRisk = 0;

    incidents.forEach((incident) => {
      // Calculate Severities
      const sev = (incident.severity || "high").toLowerCase();
      if (counts[sev] !== undefined) {
        counts[sev]++;
      } else {
        counts[sev] = 1;
      }
      
      // Calculate Risk
      totalRisk += (incident.risk_score || 0);
    });

    const avgRisk = incidents.length > 0 ? (totalRisk / incidents.length).toFixed(1) : "0";

    return { severityBreakdown: counts, averageRisk: avgRisk };
  }, [incidents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100 flex items-center justify-center animate-pulse">
        Loading analytics workspace...
      </div>
    );
  }

  return (
    <AppShell 
      role="Analyst" 
      title="Security Analytics Dashboard" 
      activePath="/analytics" 
      onLogout={() => window.location.assign("/login")}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Threat Intelligence</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-100">Analytics Overview</h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              SOC operations online
            </div>
          </div>
        </div>

        {/* Metrics Grid - NOW FULLY DYNAMIC */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-blue-400"><Activity size={18} /> Total packets tracked</div>
            <p className="mt-3 text-3xl font-semibold">{incidents.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-red-400"><AlertTriangle size={18} /> Critical alerts</div>
            <p className="mt-3 text-3xl font-semibold">{severityBreakdown.critical || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-amber-400"><TrendingUp size={18} /> Average risk</div>
            <p className="mt-3 text-3xl font-semibold">{averageRisk}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3 text-emerald-400"><ShieldCheck size={18} /> Incident count</div>
            <p className="mt-3 text-3xl font-semibold">{incidents.length}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Active Incidents Feed */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-slate-100">Active incidents</h2>
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {incidents.length === 0 ? (
                <div className="p-4 text-slate-500 text-center border border-slate-800 rounded-xl bg-slate-950/60">
                  No active incidents
                </div>
              ) : (
                incidents.map((incident, idx) => {
                  const title = incident.incident || incident.title || incident.incident_id || "Unknown Threat";
                  const source = incident.source || incident.source_ip || "Unknown IP";
                  const dest = incident.destination || incident.destination_ip || "Unknown Dest";
                  const severity = (incident.severity || "high").toLowerCase();
                  const risk = incident.risk_score || "N/A";
                  const time = incident.timestamp || incident.created_at || "Just now";

                  return (
                    <div key={incident.id || idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-200">{title}</p>
                          <p className="mt-1 text-sm text-slate-400 font-mono">
                            {source} &rarr; {dest}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          severity === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                          severity === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : 
                          severity === "medium" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                          "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}>
                          {severity}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                        <span className="font-medium">
                          Risk Score: <span className={risk !== "N/A" && risk > 70 ? "text-red-400" : "text-emerald-400"}>{risk}</span>
                        </span>
                        <span className="font-mono text-xs">{time}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">Severity breakdown</h2>
            <div className="space-y-3">
              {Object.entries(severityBreakdown).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="uppercase text-xs font-bold tracking-wider text-slate-300">{level}</span>
                  <span className={`font-mono text-lg font-semibold ${
                    level === 'critical' && count > 0 ? 'text-red-400' : 
                    level === 'high' && count > 0 ? 'text-orange-400' : 
                    'text-slate-100'
                  }`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}