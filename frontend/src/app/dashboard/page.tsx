"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, Wifi, AlertTriangle, Brain, BarChart3, LineChart, PieChart, Bell, Settings, LogOut, ChevronLeft, ChevronRight, LayoutGrid, Layers, Cpu } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, ChartEvent, ActiveElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

export default function Dashboard() {
  const [alerts, setAlerts] = useState<any[]>([]); 
  
  const [viewMode, setViewMode] = useState<'all' | 'carousel'>('all');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '24h' | '7d'>('15m');
  const [showOtherAttacks, setShowOtherAttacks] = useState(false);

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
        const alertsRes = await fetch('http://localhost:8000/api/alerts/');
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000); 
    return () => clearInterval(interval);
  }, []);

  // Filter out "Simulated" alerts so charts only show REAL Wi-Fi data
  const realAlerts = useMemo(() => alerts.filter(a => a.status !== "Simulated"), [alerts]);

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskTextColor = (score: number) => {
    if (score >= 75) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  }

  const parseDate = (dateStr: string) => {
    return new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  };

  // --- LIVE CALCULATIONS (REAL TRAFFIC ONLY) ---
  const totalFlows = realAlerts.length;
  const activeAlerts = realAlerts.filter(a => a.threat_type !== "BENIGN").length;
  
  const tcpFlows = realAlerts.filter(a => a.flow_id.includes('TCP')).length;
  const udpFlows = realAlerts.filter(a => a.flow_id.includes('UDP')).length;
  const icmpFlows = totalFlows - tcpFlows - udpFlows;

  const mainAttacks = ["DDoS", "PortScan", "BruteForce"];
  const ddosCount = realAlerts.filter(a => a.threat_type === "DDoS").length;
  const portScanCount = realAlerts.filter(a => a.threat_type === "PortScan").length;
  const bruteForceCount = realAlerts.filter(a => a.threat_type === "BruteForce").length;
  
  const otherAttacks = realAlerts.filter(a => a.threat_type !== "BENIGN" && !mainAttacks.includes(a.threat_type));
  const otherCount = otherAttacks.length;

  const otherAttackTypes = Array.from(new Set(otherAttacks.map(a => a.threat_type)));
  const otherAttackCounts = otherAttackTypes.map(type => otherAttacks.filter(a => a.threat_type === type).length);

  // --- ACCURATE TIME-SLOT LINE CHART DATA ---
  const getTrafficDataForRange = (range: '15m' | '1h' | '24h' | '7d') => {
    const now = Date.now();
    let intervalMs = 3 * 60 * 1000; 
    let labels = ['15m ago', '12m ago', '9m ago', '6m ago', '3m ago', 'Now'];
    
    if (range === '1h') {
      intervalMs = 10 * 60 * 1000; 
      labels = ['60m ago', '50m ago', '40m ago', '30m ago', '20m ago', '10m ago'];
    } else if (range === '24h') {
      intervalMs = 4 * 60 * 60 * 1000; 
      labels = ['24h ago', '20h ago', '16h ago', '12h ago', '8h ago', '4h ago'];
    } else if (range === '7d') {
      intervalMs = 24 * 60 * 60 * 1000; 
      labels = ['7d ago', '6d ago', '5d ago', '4d ago', '3d ago', '2d ago'];
    }

    const data = [];
    for (let i = 5; i >= 0; i--) {
      const start = now - (i + 1) * intervalMs;
      const end = now - i * intervalMs;
      const count = realAlerts.filter(a => {
        const t = parseDate(a.created_at).getTime();
        return t >= start && t < end;
      }).length;
      data.push(count);
    }
    return { labels, data };
  };

  const trafficData = getTrafficDataForRange(timeRange);

  const trafficLineData = {
    labels: trafficData.labels,
    datasets: [{
      label: 'Traffic Volume',
      data: trafficData.data, // FIXED: Uses accurate time-bucketed data
      borderColor: '#06B6D4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const protocolDoughnutData = {
    labels: ['TCP', 'UDP', 'ICMP/Other'],
    datasets: [{
      data: [tcpFlows, udpFlows, icmpFlows],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      borderColor: '#111827',
      borderWidth: 3
    }]
  };

  const mainBarData = {
    labels: ['DDoS', 'PortScan', 'BruteForce', 'Other'],
    datasets: [{
      label: 'Alert Count',
      data: [ddosCount, portScanCount, bruteForceCount, otherCount],
      backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#6B7280']
    }]
  };

  const expandedBarData = {
    labels: otherAttackTypes.length > 0 ? otherAttackTypes : ['No Other Attacks'],
    datasets: [{
      label: 'Alert Count',
      data: otherAttackCounts.length > 0 ? otherAttackCounts : [0],
      backgroundColor: ['#6B7280', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    onHover: (event: ChartEvent, elements: ActiveElement[]) => {
      if (viewMode === 'carousel' && carouselIndex === 2 && elements.length > 0 && elements[0].index === 3) {
        if (event.native && event.native.target) {
          (event.native.target as HTMLElement).style.cursor = 'pointer';
        }
      } else {
        if (event.native && event.native.target) {
          (event.native.target as HTMLElement).style.cursor = 'default';
        }
      }
    },
    onClick: (event: ChartEvent, elements: ActiveElement[]) => {
      if (viewMode === 'carousel' && carouselIndex === 2 && elements.length > 0) {
        if (elements[0].index === 3) {
          setShowOtherAttacks(!showOtherAttacks);
        }
      }
    }
  };

  const charts = [
    { title: 'Traffic Volume', icon: <LineChart size={16} className="text-cyan-400"/>, component: <Line data={trafficLineData} options={chartOptions} /> },
    { title: 'Protocol Distribution', icon: <PieChart size={16} className="text-cyan-400"/>, component: <Doughnut data={protocolDoughnutData} /> },
    { title: showOtherAttacks ? 'Other Attack Types' : 'Attack Classification', icon: <BarChart3 size={16} className="text-cyan-400"/>, component: <Bar data={showOtherAttacks ? expandedBarData : mainBarData} options={barChartOptions} /> }
  ];

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
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl tracking-wider">Command Center</h2>
          <div className="flex items-center gap-2 text-sm text-green-500">
            <Activity size={16} /> SYSTEM ONLINE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <div className="text-gray-400 text-xs mb-1">TOTAL FLOWS</div>
            <div className="text-2xl font-bold text-cyan-400">{totalFlows}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <div className="text-gray-400 text-xs mb-1">ACTIVE ALERTS</div>
            <div className="text-2xl font-bold text-red-500">{activeAlerts}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <div className="text-gray-400 text-xs mb-1">PROTOCOLS</div>
            <div className="flex gap-3 mt-1 text-sm">
              <span className="text-blue-400">TCP: {tcpFlows}</span>
              <span className="text-green-400">UDP: {udpFlows}</span>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-cyan-500/30 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.1)] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-cyan-400" />
              <span className="text-gray-400 text-xs tracking-wider">AI LIVE RISK</span>
            </div>
            {realAlerts.length > 0 ? (
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 truncate pr-2">{realAlerts[0].threat_type}</span>
                  <span className={getRiskTextColor(realAlerts[0].risk_score)}>{realAlerts[0].risk_score}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${getRiskColor(realAlerts[0].risk_score)}`} style={{ width: `${realAlerts[0].risk_score}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs text-center">Awaiting flow...</div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm tracking-wider">VISUAL ANALYTICS</h3>
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-gray-800 rounded p-1">
              <button onClick={() => { setViewMode('all'); setShowOtherAttacks(false); }} className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${viewMode === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}>
                <LayoutGrid size={12} /> View All
              </button>
              <button onClick={() => { setViewMode('carousel'); setShowOtherAttacks(false); }} className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${viewMode === 'carousel' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}>
                <Layers size={12} /> Carousel
              </button>
            </div>
          </div>

          {viewMode === 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {charts.map((chart, idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)]">
                  <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm">{chart.icon} {chart.title}</div>
                  <div className="h-48">{chart.component}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)] relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  {charts[carouselIndex].icon} {charts[carouselIndex].title}
                </div>
                
                <div className="flex items-center gap-2">
                  {carouselIndex === 0 && (
                    <div className="flex items-center gap-1 bg-[#050505] p-1 rounded border border-gray-800">
                      {(['15m', '1h', '24h', '7d'] as const).map((range) => (
                        <button key={range} onClick={() => setTimeRange(range)} className={`px-2 py-1 text-xs rounded ${timeRange === range ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                          {range}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-72 flex items-center justify-center">
                {charts[carouselIndex].component}
              </div>
              
              <button onClick={() => { setCarouselIndex(prev => prev === 0 ? charts.length - 1 : prev - 1); setShowOtherAttacks(false); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#111827] border border-gray-700 rounded-full p-2 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => { setCarouselIndex(prev => (prev + 1) % charts.length); setShowOtherAttacks(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#111827] border border-gray-700 rounded-full p-2 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors">
                <ChevronRight size={20} />
              </button>
              
              <div className="flex justify-center gap-2 mt-4">
                {charts.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${idx === carouselIndex ? 'bg-cyan-400' : 'bg-gray-700'}`}></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LIVE NETWORK FLOW MONITOR (Shows ALL alerts, including simulated) */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.05)]">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2 bg-[#080808]">
            <Wifi size={16} className="text-cyan-400" /> 
            <span className="tracking-wider text-sm">LIVE NETWORK FLOW MONITOR</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#050505] text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Source IP</th>
                  <th className="p-3">Destination IP</th>
                  <th className="p-3">Protocol</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {alerts.slice(0, 15).map((alert, index) => {
                  const ipParts = alert.flow_id.split('-');
                  const srcIp = ipParts[0];
                  const dstIp = ipParts[1];
                  const protocol = ipParts[2] || "TCP";
                  const dateStr = alert.created_at.endsWith('Z') ? alert.created_at : alert.created_at + 'Z';
                  const isSimulated = alert.status === "Simulated";
                  
                  return (
                    <tr key={index} className={`hover:bg-gray-900/50 ${
                      isSimulated ? "bg-purple-900/10 text-purple-300" : 
                      alert.threat_type === "BENIGN" ? "text-gray-300" : 
                      "text-red-400"
                    }`}>
                      <td className="p-3 text-xs text-gray-400">{new Date(dateStr).toLocaleTimeString()}</td>
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
                      <td className="p-3">{alert.risk_score}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}