"use client";

import { useState, useEffect, useMemo } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, Wifi, Brain, Bell, Settings, LogOut, AlertTriangle, Search, ArrowUpDown, Globe, Server, ShieldAlert, ChevronDown, ChevronUp, FileDown, Cpu } from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TrafficMonitor() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({key: 'created_at', direction: 'desc'});
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/traffic", label: "Traffic Monitor", icon: Wifi },
    { href: "/scanner", label: "AI Scanner", icon: Brain },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts/');
        const data = await res.json();
        setAlerts(data);
      } catch (error) { console.error(error); }
    };
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const parseDate = (dateStr: string) => {
    return new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  };

    // Live Statistics (Excluding AI Sandbox simulated alerts)
  const stats = useMemo(() => {
    const realAlerts = alerts.filter(a => a.status !== "Simulated");
    const srcIps = new Set(realAlerts.map(a => a.flow_id.split('-')[0]));
    const dstIps = new Set(realAlerts.map(a => a.flow_id.split('-')[1]));
    const maxRisk = realAlerts.reduce((max, a) => Math.max(max, a.risk_score), 0);
    return {
      total: realAlerts.length,
      uniqueSrc: srcIps.size,
      uniqueDst: dstIps.size,
      maxRisk: maxRisk
    };
  }, [alerts]);

  // Filtering and Sorting Logic
  const processedAlerts = useMemo(() => {
    let result = [...alerts];
    
    if (searchQuery) {
      result = result.filter(a => a.flow_id.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (protocolFilter !== "All") {
      result = result.filter(a => a.flow_id.includes(protocolFilter));
    }
    if (classFilter === "Threats") {
      result = result.filter(a => a.threat_type !== "BENIGN");
    } else if (classFilter === "Normal") {
      result = result.filter(a => a.threat_type === "BENIGN");
    }

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === 'created_at') {
        valA = parseDate(a.created_at).getTime();
        valB = parseDate(b.created_at).getTime();
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [alerts, searchQuery, protocolFilter, classFilter, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="ml-1 opacity-30 inline" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 inline text-cyan-400" /> : <ChevronDown size={12} className="ml-1 inline text-cyan-400" />;
  };

  // NEW: Generate PDF Report for Traffic Monitor
  const generateTrafficPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("NetShield AI - Live Traffic Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Filters: Protocol=${protocolFilter}, Class=${classFilter}, Search="${searchQuery || 'None'}"`, 14, 33);
    
    if (processedAlerts.length === 0) {
      doc.setFontSize(12);
      doc.text("No traffic data matches the current filters.", 14, 45);
    } else {
      // Map filtered/sorted data for the PDF
      const tableData = processedAlerts.map(alert => {
        const ipParts = alert.flow_id.split('-');
        return [
          parseDate(alert.created_at).toLocaleString(),
          ipParts[0],
          ipParts[1],
          ipParts[2] || "TCP",
          alert.threat_type,
          `${alert.risk_score}%`
        ];
      });
      
      // Generate Table (Cyan header for Traffic Monitor)
      autoTable(doc, {
        head: [['Time Detected', 'Source IP', 'Dest IP', 'Protocol', 'Classification', 'Risk']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' }, // Cyan theme
        styles: { fontSize: 8, cellPadding: 2 }
      });
    }
    
    doc.save(`NetShield_Traffic_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 p-3 rounded transition-colors ${isActive ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" : "text-gray-400 hover:bg-gray-800/50"}`}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3 border-t border-gray-800">
          <Link href="/" className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"><LogOut size={18} /> Logout</Link>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl tracking-wider">Traffic Monitor</h2>
          
          <div className="flex items-center gap-4">
            {/* NEW: Download Report Button */}
            <button 
              onClick={generateTrafficPDF} 
              className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold py-2 px-4 rounded text-xs hover:bg-cyan-500/30 transition-all"
            >
              <FileDown size={16} />
              Download Report
            </button>
            
            <div className="flex items-center gap-2 text-sm text-green-500">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Sniffing Active</span>
            </div>
          </div>
        </div>

        {/* Live Statistics Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-3 rounded-lg flex items-center gap-3">
            <Globe size={20} className="text-cyan-400" />
            <div>
              <div className="text-xs text-gray-500">Total Flows</div>
              <div className="text-lg font-bold">{stats.total}</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-gray-800 p-3 rounded-lg flex items-center gap-3">
            <Server size={20} className="text-blue-400" />
            <div>
              <div className="text-xs text-gray-500">Unique Src IPs</div>
              <div className="text-lg font-bold">{stats.uniqueSrc}</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-gray-800 p-3 rounded-lg flex items-center gap-3">
            <Server size={20} className="text-green-400" />
            <div>
              <div className="text-xs text-gray-500">Unique Dst IPs</div>
              <div className="text-lg font-bold">{stats.uniqueDst}</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-gray-800 p-3 rounded-lg flex items-center gap-3">
            <ShieldAlert size={20} className={`${stats.maxRisk >= 75 ? 'text-red-500' : 'text-yellow-500'}`} />
            <div>
              <div className="text-xs text-gray-500">Max Risk Score</div>
              <div className="text-lg font-bold">{stats.maxRisk}%</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by IP address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050505] border border-gray-700 rounded text-sm pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select 
              value={protocolFilter} 
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="bg-[#050505] border border-gray-700 rounded text-sm px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
            </select>
            <select 
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-[#050505] border border-gray-700 rounded text-sm px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Traffic</option>
              <option value="Threats">Threats Only</option>
              <option value="Normal">Normal Only</option>
            </select>
          </div>
        </div>

        {/* Advanced Table with Sorting and Expansion */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#050505] text-gray-500 uppercase text-xs tracking-wider cursor-pointer">
              <tr>
                <th className="p-3 hover:text-cyan-400" onClick={() => handleSort('created_at')}>Time {getSortIcon('created_at')}</th>
                <th className="p-3 hover:text-cyan-400">Source IP</th>
                <th className="p-3 hover:text-cyan-400">Destination IP</th>
                <th className="p-3">Protocol</th>
                <th className="p-3 hover:text-cyan-400" onClick={() => handleSort('threat_type')}>Classification {getSortIcon('threat_type')}</th>
                <th className="p-3 hover:text-cyan-400" onClick={() => handleSort('risk_score')}>Risk {getSortIcon('risk_score')}</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {processedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">No flows match your current filters.</td>
                </tr>
              ) : (
                processedAlerts.map((alert, index) => {
                  const ipParts = alert.flow_id.split('-');
                  const srcIp = ipParts[0];
                  const dstIp = ipParts[1];
                  const protocol = ipParts[2] || "TCP";
                  const dateStr = alert.created_at.endsWith('Z') ? alert.created_at : alert.created_at + 'Z';
                  const isExpanded = expandedRow === index;
                  const isSimulated = alert.status === "Simulated";
                  
                  return (
                    <>
                      <tr key={index} onClick={() => toggleRow(index)} className={`hover:bg-gray-900/50 cursor-pointer transition-colors ${
                        isSimulated ? "bg-purple-900/10 text-purple-300" : 
                        alert.threat_type === "BENIGN" ? "text-gray-300" : 
                        "text-red-400"
                      }`}>
                        <td className="p-3 text-xs text-gray-400">{parseDate(dateStr).toLocaleTimeString()}</td>
                        <td className="p-3 font-mono text-cyan-400">{srcIp}</td>
                        <td className="p-3 font-mono text-cyan-400">{dstIp}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-xs rounded ${protocol === 'TCP' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                            {protocol}
                          </span>
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          {isSimulated ? (
                            <span className="flex items-center gap-1 text-purple-400 text-xs font-bold">
                              <Cpu size={12} /> AI SANDBOX
                            </span>
                          ) : (
                            <>
                              {alert.threat_type !== "BENIGN" && <AlertTriangle size={14} className="text-red-500" />}
                              {alert.threat_type}
                            </>
                          )}
                        </td>
                        <td className="p-3 font-bold">{alert.risk_score}%</td>
                        <td className="p-3 text-xs">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} className="text-gray-600" />}</td>
                      </tr>
                      
                      {/* EXPANDABLE THREAT INTEL ROW */}
                      {isExpanded && (
                        <tr className="bg-[#080808] text-gray-400">
                          <td colSpan={7} className="p-4 border-l-2 border-cyan-500">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                              <div>
                                <div className="text-gray-600 uppercase tracking-wider mb-1">Flow ID</div>
                                <div className="text-cyan-400 font-mono">{alert.id}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 uppercase tracking-wider mb-1">Severity Level</div>
                                <div className="font-bold text-red-400">{alert.severity}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 uppercase tracking-wider mb-1">Status</div>
                                <div className="text-yellow-400">{alert.status}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 uppercase tracking-wider mb-1">Protocol Details</div>
                                <div className="text-gray-300">{protocol} (Port 443/80)</div>
                              </div>
                              <div className="col-span-2 md:col-span-4 mt-2 bg-[#050505] p-3 rounded border border-gray-800">
                                <div className="text-gray-600 uppercase tracking-wider mb-2">Simulated Threat Intel</div>
                                <div className="flex gap-4 text-xs">
                                  <span className="text-gray-500">GeoIP: <span className="text-white">Unknown / Local</span></span>
                                  <span className="text-gray-500">Reputation: <span className={alert.risk_score > 50 ? 'text-red-400' : 'text-green-400'}>{alert.risk_score > 50 ? 'Malicious' : 'Clean'}</span></span>
                                  <span className="text-gray-500">AI Model: <span className="text-white">Isolation Forest + RF</span></span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}