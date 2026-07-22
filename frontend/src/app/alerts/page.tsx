"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ShieldAlert, Server, LogOut, LayoutDashboard, Settings } from "lucide-react";

export default function AlertsDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>("Loading...");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isolatedIncidents, setIsolatedIncidents] = useState<Set<string>>(new Set());

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
        setAlerts(result.data || []);
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

  // Helper for dynamic severity colors
  const getSeverityBadge = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-500/20 text-red-400 border border-red-500/50';
    if (s === 'HIGH') return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
    if (s === 'MEDIUM') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-red-500 font-bold text-xl animate-pulse">Loading Threat Database...</div>;
  }

  const handleIsolate = async (incidentId: string, sourceIp: string) => {
    try {
      // Send the kill command to the FastAPI backend
      const res = await fetch("http://127.0.0.1:8000/api/isolate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident_id: incidentId, source_ip: sourceIp })
      });

      if (res.ok) {
        // Update the UI to show the host is isolated
        setIsolatedIncidents(prev => new Set(prev).add(incidentId));
      }
    } catch (error) {
      console.error("Failed to isolate host:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="hidden w-64 flex-col border-r border-gray-800 bg-gray-900 md:flex">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-blue-500 flex items-center gap-2">
            <ShieldAlert size={28} /> NetShield AI
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{role} Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a href="/users" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <Server size={20} /> User Management
          </a>
          <a href="/alerts" className="flex items-center gap-3 px-4 py-3 bg-red-600/10 text-red-400 rounded-lg transition-colors">
            <Activity size={20} /> Alerts
          </a>
          <a href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <Settings size={20} /> Settings
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="flex justify-between items-center p-6 bg-gray-950 border-b border-gray-800 sticky top-0 z-10">
          <h1 className="text-2xl font-semibold text-gray-100">Threat Intelligence & Alerts</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white py-2 px-4 rounded-lg transition-all duration-200 border border-gray-700 hover:border-red-500"
          >
            <LogOut size={18} /> Log Out
          </button>
        </header>

        <div className="p-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Incident Queue</h2>
              <span className="bg-red-900/50 text-red-400 text-sm px-3 py-1 rounded-full border border-red-800">
                {alerts.length} incidents awaiting triage
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-800 text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="p-4 font-medium">Incident</th>
                    <th className="p-4 font-medium">Severity</th>
                    <th className="p-4 font-medium">Risk Score</th>
                    <th className="p-4 font-medium">Source</th>
                    <th className="p-4 font-medium">Destination</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No active threats detected. System is secure.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-mono text-gray-300">{alert.incident}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-red-400 font-bold">{alert.risk_score}</span> / 100
                    </td>
                    <td className="p-4 text-orange-300 font-mono">{alert.source}</td>
                    <td className="p-4 font-mono">{alert.destination}</td>
                    <td className="p-4 text-right">
                      
                      {/* THIS IS THE UPDATED BUTTON LOGIC */}
                      {isolatedIncidents.has(alert.incident) ? (
                        <button 
                          disabled
                          className="text-gray-400 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-xs cursor-not-allowed"
                        >
                          Isolated
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleIsolate(alert.incident, alert.source)}
                          className="text-white hover:text-white bg-red-900/80 hover:bg-red-700 transition-colors text-xs border border-red-800 px-3 py-1.5 rounded-lg"
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
      </main>
    </div>
  );
}