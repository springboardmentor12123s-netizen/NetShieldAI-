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

  const handleIsolate = async (incidentId) => {
    // Optional: Add a confirmation dialog
    if (!window.confirm(`Are you sure you want to isolate the host for incident ${incidentId}?`)) {
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "Isolated", 
          assigned_to: "Security Analyst" // This can be dynamic later based on the logged-in user
        })
      });

      if (res.ok) {
        alert(`Host successfully isolated!`);
        // If you have a fetchAlerts() function, call it here to refresh the table!
        // fetchAlerts(); 
      } else {
        alert("Failed to isolate host. Check backend logs.");
      }
    } catch (error) {
      console.error("Error isolating host:", error);
    }
  };

  return (
    <AppShell
      role={role}
      title="Threat Intelligence & Alerts"
      activePath="/alerts"
      onLogout={handleLogout}
    >
      <div>
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
                          onClick={() => handleIsolate(alert?.incident_id || alert?.id)}
                          className="bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-800 px-3 py-1 rounded text-sm transition-colors"
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