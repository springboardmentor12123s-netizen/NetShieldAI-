"use client";

import { useState, useEffect } from 'react';
import { Shield, Activity, Wifi, AlertTriangle, Brain, Gauge, BarChart3, LineChart, PieChart, Bell, Settings, LogOut, ChevronLeft, ChevronRight, LayoutGrid, Layers } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [flows, setFlows] = useState<any[]>([]);
  const [aiVerdict, setAiVerdict] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'all' | 'carousel'>('all');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch standard traffic data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch('http://localhost:8000/api/traffic/stats');
        const statsData = await statsRes.json();
        setStats(statsData);

        const flowsRes = await fetch('http://localhost:8000/api/traffic/flows');
        const flowsData = await flowsRes.json();
        setFlows(flowsData.flows);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const runAiScan = async () => {
    if (flows.length === 0) return;
    setAnalyzing(true);
    const latestFlow = flows[0];
    
    try {
      const response = await fetch('http://localhost:8000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_duration: latestFlow.flow_duration || 0,
          total_fwd_packets: latestFlow.total_fwd_packets || 0,
          total_backward_packets: latestFlow.total_backward_packets || 0,
          fwd_packet_length_max: latestFlow.total_bytes || 0,
          fwd_packet_length_mean: (latestFlow.total_bytes || 0) / 2,
          flow_bytes_per_sec: latestFlow.total_bytes || 0,
          flow_packets_per_sec: latestFlow.total_fwd_packets || 0
        })
      });
      const data = await response.json();
      setAiVerdict(data);
    } catch (error) {
      console.error("AI Scan Error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Chart Data Configurations
  const trafficLineData = {
    labels: ['10s ago', '8s ago', '6s ago', '4s ago', '2s ago', 'Now'],
    datasets: [{
      label: 'Traffic Volume (MB)',
      data: [65, 59, 80, 81, 56, stats?.total_flows || 0],
      borderColor: '#06B6D4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const protocolDoughnutData = {
    labels: ['TCP', 'UDP', 'ICMP'],
    datasets: [{
      data: [stats?.protocol_distribution?.TCP || 0, stats?.protocol_distribution?.UDP || 0, stats?.protocol_distribution?.ICMP || 0],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      borderColor: '#111827',
      borderWidth: 3
    }]
  };

    const attackBarData = {
    labels: ['DDoS', 'PortScan', 'BruteForce', 'Other'],
    datasets: [{
      label: 'Alert Count',
      data: [
        stats?.alert_analytics?.threat_distribution?.DDoS || 0,
        stats?.alert_analytics?.threat_distribution?.PortScan || 0,
        stats?.alert_analytics?.threat_distribution?.BruteForce || 0,
        stats?.alert_analytics?.threat_distribution?.Other || 0
      ],
      backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#6B7280']
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

  // Array of charts for the Carousel
  const charts = [
    { title: 'Traffic Volume', icon: <LineChart size={16} className="text-cyan-400"/>, component: <Line data={trafficLineData} options={chartOptions} /> },
    { title: 'Protocol Distribution', icon: <PieChart size={16} className="text-cyan-400"/>, component: <Doughnut data={protocolDoughnutData} /> },
    { title: 'Attack Classification', icon: <BarChart3 size={16} className="text-cyan-400"/>, component: <Bar data={attackBarData} options={chartOptions} /> }
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-mono">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-gray-800 flex flex-col p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-10 p-2">
          <Shield size={28} className="text-cyan-400" />
          <h1 className="text-xl font-bold tracking-wider">NETSHIELD</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400">
            <Activity size={18} /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded text-gray-400 hover:bg-gray-800/50 transition-colors">
            <Wifi size={18} /> Traffic Monitor
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded text-gray-400 hover:bg-gray-800/50 transition-colors">
            <Brain size={18} /> AI Scanner
          </a>
          <a href="/alerts" className="flex items-center gap-3 p-3 rounded text-gray-400 hover:bg-gray-800/50 transition-colors">
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
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl tracking-wider">Command Center</h2>
          <div className="flex items-center gap-2 text-sm text-green-500">
            <Activity size={16} /> SYSTEM ONLINE
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <div className="text-gray-400 text-xs mb-1">TOTAL FLOWS</div>
            <div className="text-2xl font-bold text-cyan-400">{stats?.total_flows || 0}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <div className="text-gray-400 text-xs mb-1">KNOWN THREATS</div>
            <div className="text-2xl font-bold text-red-500">
              {(stats?.label_distribution?.DDoS || 0) + (stats?.label_distribution?.PortScan || 0) + (stats?.label_distribution?.BruteForce || 0)}
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <div className="text-gray-400 text-xs mb-1">PROTOCOLS</div>
            <div className="flex gap-3 mt-1 text-sm">
              <span className="text-blue-400">TCP: {stats?.protocol_distribution?.TCP || 0}</span>
              <span className="text-green-400">UDP: {stats?.protocol_distribution?.UDP || 0}</span>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-cyan-500/30 p-4 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.1)] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={16} className="text-cyan-400" />
              <span className="text-gray-400 text-xs tracking-wider">AI SCANNER</span>
            </div>
            <button onClick={runAiScan} disabled={analyzing} className="w-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold py-1.5 rounded text-xs hover:bg-cyan-500/30 transition-all disabled:opacity-50 mb-2">
              {analyzing ? "ANALYZING..." : "SCAN LATEST FLOW"}
            </button>
            {aiVerdict && (
              <div className="text-center">
                <div className={`text-lg font-bold ${getRiskColor(aiVerdict.risk_score)}`}>
                  RISK: {aiVerdict.risk_score}/100
                </div>
                <div className="text-[10px] text-gray-400">{aiVerdict.threat_classification}</div>
              </div>
            )}
          </div>
        </div>

        {/* Chart View Toggle & Charts Row */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm tracking-wider">VISUAL ANALYTICS</h3>
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-gray-800 rounded p-1">
              <button 
                onClick={() => setViewMode('all')} 
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${viewMode === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <LayoutGrid size={12} /> View All
              </button>
              <button 
                onClick={() => setViewMode('carousel')} 
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${viewMode === 'carousel' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
              >
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
              <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm">{charts[carouselIndex].icon} {charts[carouselIndex].title}</div>
              <div className="h-72 flex items-center justify-center">
                {charts[carouselIndex].component}
              </div>
              
              {/* Carousel Controls */}
              <button 
                onClick={() => setCarouselIndex(prev => prev === 0 ? charts.length - 1 : prev - 1)} 
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#111827] border border-gray-700 rounded-full p-2 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCarouselIndex(prev => (prev + 1) % charts.length)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#111827] border border-gray-700 rounded-full p-2 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
              
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {charts.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${idx === carouselIndex ? 'bg-cyan-400' : 'bg-gray-700'}`}></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Traffic Table */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.05)]">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2 bg-[#080808]">
            <Wifi size={16} className="text-cyan-400" /> 
            <span className="tracking-wider text-sm">LIVE NETWORK FLOW MONITOR</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#050505] text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Source IP</th>
                  <th className="p-3">Dest IP</th>
                  <th className="p-3">Port</th>
                  <th className="p-3">Protocol</th>
                  <th className="p-3">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {flows.map((flow, index) => (
                  <tr key={index} className={`hover:bg-gray-900/50 ${flow.label !== 'BENIGN' ? 'bg-red-900/10 text-red-400' : 'text-gray-300'}`}>
                    <td className="p-3 text-xs">{new Date(flow.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3">{flow.src_ip}</td>
                    <td className="p-3">{flow.dst_ip}</td>
                    <td className="p-3">{flow.dst_port}</td>
                    <td className="p-3">{flow.protocol}</td>
                    <td className="p-3 flex items-center gap-2">
                      {flow.label !== 'BENIGN' && <AlertTriangle size={14} className="text-red-500" />}
                      {flow.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}