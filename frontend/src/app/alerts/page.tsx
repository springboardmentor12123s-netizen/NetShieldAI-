"use client";

import { useState, useEffect } from 'react';
import { Shield, Bell, AlertTriangle, Activity, Wifi, Brain, Settings, LogOut, CheckCircle, Search } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts from the backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/alerts/');
        const data = await response.json();
        setAlerts(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); 
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    if (severity === 'Critical') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (severity === 'High') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  const getStatusColor = (status: string) => {
    if (status === 'New') return 'text-cyan-400';
    if (status === 'Investigating') return 'text-yellow-400';
    if (status === 'Resolved') return 'text-green-400';
    return 'text-gray-400';
  };

  const exportToCSV = () => {
    if (alerts.length === 0) return;
    
    const headers = ["Timestamp", "Severity", "Threat Type", "Risk Score", "Status", "Flow ID"];
    const csvRows = alerts.map(alert => 
      [alert.created_at, alert.severity, alert.threat_type, alert.risk_score, alert.status, alert.flow_id].join(",")
    );
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "netshield_threat_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-mono">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-gray-800 flex flex-col p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-10 p-2">
          <Shield size={28} className="text-cyan-400" />
          <h1 className="text-xl font-bold tracking-wider">NETSHIELD</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="/dashboard" className="flex items-center gap-3 p-3 rounded text-gray-400 hover:bg-gray-800/50 transition-colors">
            <Activity size={18} /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded text-gray-400 hover:bg-gray-800/50 transition-colors">
            <Wifi size={18} /> Traffic Monitor
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded text-gray-400 hover:bg-gray-800/50 transition-colors">
            <Brain size={18} /> AI Scanner
          </a>
          <a href="/alerts" className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400">
            <Bell size={18} /> Alerts
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded text-gray-400 hover:bg-gray-800/50 transition-colors">
            <Settings size={18} /> Settings
          </a>
        </nav>

        <div className="mt-auto p-3 border-t border-gray-800 flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors cursor-pointer">
          <LogOut size={18} /> Logout
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl tracking-wider">Security Alerts</h2>
          <div className="flex items-center gap-2 text-sm text-cyan-400">
            <AlertTriangle size={16} /> {alerts.length} Active Alerts
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.05)]">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#080808]">
            <div className="flex items-center gap-2 text-sm tracking-wider">
              <Bell size={16} className="text-cyan-400" /> INCIDENT MANAGEMENT
            </div>
            <div className="flex items-center gap-4">
              <button onClick={exportToCSV} className="flex items-center gap-2 text-xs text-gray-400 bg-[#111827] px-3 py-1 rounded border border-gray-700 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors">
                <Search size={12} /> Export to CSV
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#111827] px-3 py-1 rounded border border-gray-700">
                <Search size={12} /> Auto-refreshing
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
              <CheckCircle size={32} className="text-green-500" />
              No active threats detected. System is secure.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#050505] text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Threat Type</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Flow ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-900/50 text-gray-300">
                    <td className="p-3 text-xs">{new Date(alert.created_at).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      {alert.threat_type}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${alert.risk_score > 90 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${alert.risk_score}%` }}></div>
                        </div>
                        <span className="text-xs">{alert.risk_score}%</span>
                      </div>
                    </td>
                    <td className={`p-3 ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </td>
                    <td className="p-3 text-xs text-gray-500 font-mono truncate max-w-[100px]">
                      {alert.flow_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}