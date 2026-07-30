"use client";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [rawJson, setRawJson] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/reports");
        const json = await res.json();
        console.log("API Response:", json); // <-- Check your browser console (F12)
        setRawJson(JSON.stringify(json, null, 2));
        setReportData(json.data); 
      } catch (error) {
        console.error("Failed to load executive report:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, []);

  const reportText = useMemo(() => {
    const summary = reportData?.summary;
    const recs = reportData?.recommendations ?? [];

    return [
      "NetShield AI Executive Threat Report",
      "=================================",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Summary",
      "-------",
      `- Database incidents tracked: ${summary?.database_incidents_tracked ?? 0}`,
      `- Hosts actively isolated: ${summary?.hosts_actively_isolated ?? 0}`,
      `- Total packets analyzed: ${summary?.total_packets ?? 0}`,
      `- Average risk score: ${summary?.risk_score_avg ?? 0}`,
      "",
      "Recommendations",
      "---------------",
      ...recs.map((rec: string, index: number) => `${index + 1}. ${rec}`),
      "",
      "Operational note:",
      "- Continue monitoring for persistent lateral movement and credential abuse patterns.",
      "- Validate isolation procedures for every critical incident before re-enabling network access."
    ].join("\n");
  }, [reportData]);

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "netshield-executive-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6 text-gray-400">Loading executive intelligence...</div>;

  return (
    <AppShell role="SOC Lead" title="Executive Threat Report" activePath="/reports" onLogout={() => window.location.assign("/login")}>
      <div className="space-y-6 text-gray-100">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Executive Threat Report</h1>
          <button
            onClick={handleDownload}
            className="rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-600/20"
          >
            Download report
          </button>
        </div>

      {/* Live Database Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Database Incidents Tracked</p>
          <p className="text-3xl font-mono font-bold mt-1 text-red-400">
            {reportData?.summary?.database_incidents_tracked ?? 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Hosts Actively Isolated</p>
          <p className="text-3xl font-mono font-bold mt-1 text-emerald-400">
            {reportData?.summary?.hosts_actively_isolated ?? 0}
          </p>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg space-y-3">
        <h2 className="text-lg font-semibold text-gray-200">AI SOC Recommendations</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-400 text-sm">
          {reportData?.recommendations?.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>

      {/* Debug Box: Shows exact JSON structure coming from FastAPI */}
      <div className="bg-black border border-gray-800 p-4 rounded-lg space-y-2">
        <p className="text-xs font-mono text-yellow-500 uppercase tracking-wider">Debug Payload Preview</p>
        <pre className="text-xs font-mono text-gray-400 overflow-x-auto p-2 bg-gray-950 rounded">
          {rawJson}
        </pre>
      </div>
      </div>
    </AppShell>
  );
}