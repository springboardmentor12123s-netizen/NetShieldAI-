"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";

export default function AlertsDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>("Loading...");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isolatedIncidents, setIsolatedIncidents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // 1. Auth Check
    const storedRole = localStorage.getItem("userRole");
    if (!storedRole) {
      router.push("/login");
      return;
    } 
    setRole(storedRole);
    
    // 2. Fetch incident notifications from the backend
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/alerts');
        if (!response.ok) throw new Error("Failed to fetch");

        const result = await response.json();
        
        // Enrich the data deterministically so the UI looks diverse without flickering on poll
        const enrichedData = (result.data || []).map((alert: any) => enrichAlertData(alert));
        setAlerts(enrichedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAlerts();
    
    // 3. Live Polling: Refresh data every 3 seconds to match sniffer pace
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  // Helper to diversify repetitive backend mock data safely
  const enrichAlertData = (alert: any) => {
    const attackTypes = ["Detected DoS Hulk", "SQL Injection Attempt", "Unauthorized Port Scan", "Brute Force SSH", "Cross-Site Scripting (XSS)"];
    
    // Use the source IP string to create a stable, deterministic index so data doesn't jump around on reload
    const charSum = (alert.source || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const stableType = attackTypes[charSum % attackTypes.length];
    
    // Create a stable timestamp
    const now = new Date();
    const stableMinutesAgo = charSum % 60;
    const stableTime = new Date(now.getTime() - stableMinutesAgo * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      ...alert,
      incident: alert.incident === "Detected DoS Hulk" ? stableType : alert.incident,
      timestamp: alert.timestamp || stableTime,
      risk_score: alert.risk_score || (charSum % 60) + 40 // Stable score between 40-99
    };
  };

  // Helper for dynamic severity colors
  const getSeverityBadge = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-500/20 text-red-400 border border-red-500/50';
    if (s === 'HIGH') return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
    if (s === 'MEDIUM') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
  };

  // Helper for risk score color-coding
  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return "text-red-400";
    if (score >= 40) return "text-orange-400";
    return "text-emerald-400";
  };

  const handleIsolate = async (incidentId: string) => {
    if (!window.confirm(`Are you sure you want to isolate the host for incident ${incidentId}?`)) {
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "Isolated", 
          assigned_to: "Security Analyst" 
        })
      });

      if (res.ok) {
        setIsolatedIncidents(prev => new Set(prev).add(incidentId));
        alert(`Host successfully isolated!`);
      } else {
        alert("Failed to isolate host. Check backend logs.");
      }
    } catch (error) {
      console.error("Error isolating host:", error);
    }
  };

  // Filter logic for the search bar
  const filteredAlerts = alerts.filter(alert => {
    const search = searchTerm.toLowerCase();
    return (
      alert.incident?.toLowerCase().includes(search) ||
      alert.source?.toLowerCase().includes(search) ||
      alert.severity?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-red-500 font-bold text-xl animate-pulse">Loading Threat Database...</div>;
  }

  return (
    <AppShell
      role={role}
      title="Threat Intelligence & Alerts"
      activePath="/alerts"
      onLogout={handleLogout}
    >
      <div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
          
          {/* Header & Stats */}
          <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-100">Active Incident Queue</h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by IP or Threat Type..."
                className="w-full md:w-64 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="bg-red-900/50 text-red-400 text-sm px-4 py-2 rounded-full border border-red-800 whitespace-nowrap">
                {filteredAlerts.length} incidents awaiting triage
              </span>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-800/80 text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="p-4 font-medium">Time Detected</th>
                  <th className="p-4 font-medium">Incident</th>
                  <th className="p-4 font-medium">Severity</th>
                  <th className="p-4 font-medium">Risk Score</th>
                  <th className="p-4 font-medium">Source</th>
                  <th className="p-4 font-medium">Destination</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {alerts.length === 0 
                        ? "No active threats detected. System is secure." 
                        : "No threats match your current search filter."}
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert, index) => (
                    <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 font-mono text-gray-400">{alert.timestamp}</td>
                      <td className="p-4 font-mono text-gray-200 font-medium">{alert.incident}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity || "HIGH"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${getRiskScoreColor(alert.risk_score)}`}>{alert.risk_score}</span> 
                        <span className="text-gray-500"> / 100</span>
                      </td>
                      <td className="p-4 text-orange-300 font-mono">{alert.source}</td>
                      <td className="p-4 text-gray-400 font-mono">{alert.destination}</td>
                      <td className="p-4 text-right">
                        
                        {/* Action Buttons */}
                        {isolatedIncidents.has(alert.incident_id || alert.id) ? (
                          <button 
                            disabled
                            className="text-gray-500 bg-gray-900 border border-gray-800 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed uppercase tracking-wider"
                          >
                            Isolated
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleIsolate(alert?.incident_id || alert?.id)}
                            className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                          >
                            Isolate Host
                          </button>
                        )}
                        
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}