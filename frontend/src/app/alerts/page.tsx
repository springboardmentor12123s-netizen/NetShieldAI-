"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, Wifi, Brain, Bell, Settings, LogOut, FileDown } from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Alert {
  id: string;
  flow_id: string | null;
  severity: string;
  threat_type: string;
  risk_score: number;
  status: string;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/traffic", label: "Traffic Monitor", icon: Wifi },
    { href: "/scanner", label: "AI Scanner", icon: Brain },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const fetchAlerts = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/alerts/");
      const data = await response.json();
      setAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000); 
    return () => clearInterval(interval);
  }, []);

  const updateAlertStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:8000/api/alerts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setAlerts(prev => prev.map(a => a.id === id ? {...a, status: newStatus} : a));
    } catch (error) {
      console.error("Failed to update alert status:", error);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("NetShield AI - Security Alert Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    const threatAlerts = alerts.filter(a => a.threat_type !== "BENIGN");
    
    if (threatAlerts.length === 0) {
      doc.setFontSize(12);
      doc.text("No threats detected. System is secure.", 14, 40);
    } else {
      const tableData = threatAlerts.map(alert => [
        new Date(alert.created_at).toLocaleString(),
        alert.severity,
        alert.threat_type,
        `${alert.risk_score}%`,
        alert.status
      ]);
      
      autoTable(doc, {
        head: [['Time Detected', 'Severity', 'Threat Type', 'Risk Score', 'Status']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 }
      });
    }
    
    doc.save(`NetShield_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-500 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-yellow-500 text-black";
      default: return "bg-blue-500 text-white";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-mono">
      
      <aside className="w-64 bg-[#0a0a0a] border-r border-gray-800 flex flex-col p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-10 p-2">
          <Shield size={28} className="text-cyan-400" />
          <h1 className="text-xl font-bold tracking-wider">NETSHIELD</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-3 p-3 rounded transition-colors ${
                  isActive 
                    ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" 
                    : "text-gray-400 hover:bg-gray-800/50"
                }`}
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-gray-800">
          <Link href="/" className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors cursor-pointer">
            <LogOut size={18} /> Logout
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl tracking-wider">Security Alerts</h2>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={generatePDF} 
              className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold py-2 px-4 rounded text-xs hover:bg-cyan-500/30 transition-all"
            >
              <FileDown size={16} />
              Download Report
            </button>
            
            <div className="flex items-center gap-2 text-sm text-green-500">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live Monitoring Active</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)] overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#080808]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Threat Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time Detected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">Loading alerts...</td>
                </tr>
              ) : alerts.filter(a => a.threat_type !== "BENIGN").length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">No threats detected. System secure.</td>
                </tr>
              ) : (
                alerts.filter(a => a.threat_type !== "BENIGN").map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-200">{alert.threat_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-600 rounded-full h-2 mr-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${alert.risk_score}%` }}></div>
                        </div>
                        <span>{alert.risk_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${alert.status === "New" ? "bg-blue-900 text-blue-300" : alert.status === "Investigating" ? "bg-yellow-900 text-yellow-300" : "bg-gray-700 text-gray-400"}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {alert.status === "New" && (
                        <button onClick={() => updateAlertStatus(alert.id, "Investigating")} className="text-indigo-400 hover:text-indigo-300 mr-3">
                          Investigate
                        </button>
                      )}
                      {(alert.status === "New" || alert.status === "Investigating") && (
                        <button onClick={() => updateAlertStatus(alert.id, "Resolved")} className="text-green-400 hover:text-green-300">
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}