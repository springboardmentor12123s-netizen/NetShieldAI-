"use client";

import { useEffect, useState, useMemo } from "react";
import AppShell from "../../components/AppShell";
import { ShieldAlert, Cpu, FileText, Activity, Zap } from "lucide-react";

interface AlertData {
  id?: string | number;
  incident_id?: string;
  incident?: string;
  title?: string;
  category?: string;
  severity?: string;
  risk_score?: number;
  source?: string;
  source_ip?: string;
  destination?: string;
  destination_ip?: string;
  status?: string;
  timestamp?: string;
  created_at?: string;
}

interface ReportSummary {
  total_packets?: number;
  critical_alerts?: number;
  hosts_actively_isolated?: number;
  risk_score_avg?: number;
}

export default function ReportsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => {
    const fetchLiveIntelligence = async () => {
      try {
        const [alertsRes, reportsRes] = await Promise.all([
          fetch(`${API_URL}/api/alerts`),
          fetch(`${API_URL}/api/reports`),
        ]);

        if (!alertsRes.ok || !reportsRes.ok) {
          throw new Error("Failed to fetch intelligence endpoints from backend");
        }

        const alertsJson = await alertsRes.json();
        const reportsJson = await reportsRes.json();

        // Raw backend data extraction without client-side mock alterations
        const rawAlerts: AlertData[] = alertsJson.data || alertsJson || [];
        const rawSummary: ReportSummary = reportsJson.data?.summary || reportsJson.summary || reportsJson.data || {};

        setAlerts(rawAlerts);
        setSummary(rawSummary);
      } catch (error) {
        console.error("Error fetching live intelligence from backend:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveIntelligence();
    const interval = setInterval(fetchLiveIntelligence, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute metrics strictly from real incoming alerts & backend summary
  const metrics = useMemo(() => {
    const totalPackets = summary?.total_packets ?? alerts.length;
    
    // Count isolated hosts directly from real status fields in alerts
    const isolatedCount = summary?.hosts_actively_isolated ?? alerts.filter(
      (a) => (a.status || "").toLowerCase() === "isolated"
    ).length;

    // Determine real top threat vector directly from backend incident/category names
    const vectorCounts: Record<string, number> = {};
    let topVectorName = "No Threats Detected";
    let maxCount = 0;

    alerts.forEach((alert) => {
      const vector = alert.incident || alert.title || alert.category || "Unclassified Threat";
      vectorCounts[vector] = (vectorCounts[vector] || 0) + 1;
      if (vectorCounts[vector] > maxCount) {
        maxCount = vectorCounts[vector];
        topVectorName = vector;
      }
    });

    return {
      totalPackets,
      isolatedCount,
      topVector: topVectorName,
    };
  }, [alerts, summary]);

  // Generate dynamic AI situation text directly from actual API statistics
  const aiAnalysis = useMemo(() => {
    const isElevated = metrics.isolatedCount > 0 || alerts.length > 5;
    return (
      `NetShield AI has captured and analyzed ${metrics.totalPackets} network packets in the active operational window. ` +
      `The network threat level is currently ${isElevated ? "ELEVATED" : "STABLE"}. ` +
      (alerts.length > 0
        ? `There are currently ${alerts.length} active incidents logged, with '${metrics.topVector}' identified as the primary threat vector signature. `
        : `No malicious signature anomalies detected. `) +
      `The automated SOC mechanism has quarantined ${metrics.isolatedCount} host(s).`
    );
  }, [alerts, metrics]);

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow popups to generate the PDF report.");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NetShield AI - Executive Threat Intelligence Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 850px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 24px; font-size: 26px; }
            h2 { color: #334155; margin-top: 28px; font-size: 18px; }
            .summary-box { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 18px; margin-bottom: 24px; border-radius: 0 8px 8px 0; }
            .metrics { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
            .metric-card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; text-align: center; flex: 1; background: #ffffff; }
            .metric-value { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 6px; }
            .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th { background-color: #f1f5f9; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; font-weight: 600; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            .status-isolated { color: #dc2626; font-weight: 700; }
            .status-investigating { color: #d97706; font-weight: 600; }
            .status-active { color: #2563eb; font-weight: 600; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <h1>Executive Threat Intelligence Report</h1>
          <div class="summary-box">
            <h2>AI Situation Overview</h2>
            <p>${aiAnalysis}</p>
          </div>
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-label">Total Packets Tracked</div>
              <div class="metric-value">${metrics.totalPackets}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Primary Threat Vector</div>
              <div class="metric-value">${metrics.topVector}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Isolated Hosts</div>
              <div class="metric-value">${metrics.isolatedCount}</div>
            </div>
          </div>
          <h2>Live Anomaly Detections Log</h2>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Threat Incident</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Risk Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${alerts
                .map((a) => {
                  const time = a.timestamp || a.created_at || "N/A";
                  const type = a.incident || a.title || a.category || "Unclassified Threat";
                  const src = a.source || a.source_ip || "Unknown";
                  const dst = a.destination || a.destination_ip || "Unknown";
                  const risk = a.risk_score ?? "N/A";
                  const status = a.status || "Active";

                  return `<tr>
                    <td>${time}</td>
                    <td><strong>${type}</strong></td>
                    <td style="font-family: monospace;">${src}</td>
                    <td style="font-family: monospace;">${dst}</td>
                    <td>${risk}</td>
                    <td class="status-${status.toLowerCase()}">${status}</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">Generated by NetShield AI Security Operations Center on ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-blue-500 flex items-center justify-center animate-pulse font-bold text-xl">
        Fetching Real Backend Intelligence...
      </div>
    );
  }

  return (
    <AppShell role="Analyst" title="Threat Reports & Export" activePath="/reports" onLogout={() => window.location.assign("/login")}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* AI Executive Summary Card */}
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <FileText size={18} /> Executive AI Summary
          </h2>
          <p className="text-slate-300 leading-relaxed">{aiAnalysis}</p>
        </div>

        {/* Dynamic Metric Cards based on real data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Packets</p>
              <p className="text-2xl font-bold text-slate-100">{metrics.totalPackets}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
              <Zap size={24} />
            </div>
            <div className="truncate">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Top Threat Vector</p>
              <p className="text-lg font-bold text-slate-100 truncate max-w-[170px]" title={metrics.topVector}>
                {metrics.topVector}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Isolated Hosts</p>
              <p className="text-2xl font-bold text-red-400">{metrics.isolatedCount}</p>
            </div>
          </div>
        </div>

        {/* Real Live Anomaly Log Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Cpu size={18} className="text-purple-400" /> Live Threat Records ({alerts.length})
            </h2>
            <button
              onClick={handleExportPDF}
              className="bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]"
            >
              Export PDF Report
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {alerts.length === 0 ? (
              <div className="p-4 text-slate-500 text-center border border-slate-800 rounded-xl bg-slate-950/60">
                No active threats returned by backend
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const title = alert.incident || alert.title || alert.category || "Unclassified Threat";
                const source = alert.source || alert.source_ip || "Unknown IP";
                const dest = alert.destination || alert.destination_ip || "Unknown Dest";
                const risk = alert.risk_score ?? "N/A";
                const status = alert.status || "Active";
                const time = alert.timestamp || alert.created_at || "Just now";
                const severity = (alert.severity || "high").toLowerCase();

                return (
                  <div
                    key={alert.id || alert.incident_id || idx}
                    className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="truncate pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-medium truncate">{title}</span>
                        {risk !== "N/A" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                            Risk: {risk}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            severity === "critical"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : severity === "high"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}
                        >
                          {severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1 truncate">
                        {source} &rarr; {dest}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono text-slate-500 mb-1">{time}</p>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          status.toLowerCase() === "isolated"
                            ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : status.toLowerCase() === "resolved"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}