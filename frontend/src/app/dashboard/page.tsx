"use client";

import { useState, useEffect } from 'react';
import { Shield, Activity, Wifi, AlertTriangle, Brain, Gauge } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [flows, setFlows] = useState<any[]>([]);
  const [aiVerdict, setAiVerdict] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  // Function to run AI analysis on the latest flow
  const runAiScan = async () => {
    if (flows.length === 0) return;
    setAnalyzing(true);
    
    // Get the most recent flow
    const latestFlow = flows[0];
    
    try {
      const response = await fetch('http://localhost:8000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_duration: latestFlow.flow_duration || 0,
          total_fwd_packets: latestFlow.total_fwd_packets || 0,
          total_backward_packets: latestFlow.total_backward_packets || 0,
          fwd_packet_length_max: latestFlow.total_bytes || 0, // mapping approx
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

  // Determine Risk Score Color
  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-mono p-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-4">
        <Shield size={32} className="text-cyan-400" />
        <h1 className="text-2xl tracking-widest">NETSHIELD AI - COMMAND CENTER</h1>
        <div className="ml-auto flex items-center gap-2 text-sm text-green-500">
          <Activity size={16} /> SYSTEM ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="text-gray-400 text-sm mb-2">TOTAL FLOWS</div>
          <div className="text-3xl font-bold text-cyan-400">{stats?.total_flows || 0}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="text-gray-400 text-sm mb-2">PROTOCOLS</div>
          <div className="flex gap-4 mt-2">
            <span className="text-blue-400">TCP: {stats?.protocol_distribution?.TCP || 0}</span>
            <span className="text-green-400">UDP: {stats?.protocol_distribution?.UDP || 0}</span>
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="text-gray-400 text-sm mb-2">KNOWN THREATS</div>
          <div className="text-3xl font-bold text-red-500">
            {stats?.label_distribution?.DDoS + stats?.label_distribution?.PortScan + stats?.label_distribution?.BruteForce || 0}
          </div>
        </div>

        {/* AI THREAT SCANNER CARD */}
        <div className="bg-[#0a0a0a] border border-cyan-500/30 p-6 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.2)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} className="text-cyan-400" />
            <span className="text-gray-400 text-sm tracking-wider">AI THREAT SCANNER</span>
          </div>
          
          <button 
            onClick={runAiScan} 
            disabled={analyzing}
            className="w-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold py-2 rounded hover:bg-cyan-500/30 transition-all duration-300 disabled:opacity-50 mb-4"
          >
            {analyzing ? "ANALYZING..." : "SCAN LATEST FLOW"}
          </button>

          {aiVerdict && (
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Gauge size={32} className={getRiskColor(aiVerdict.risk_score)} />
              </div>
              <div className={`text-2xl font-bold ${getRiskColor(aiVerdict.risk_score)}`}>
                RISK: {aiVerdict.risk_score}/100
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Classification: <span className="text-white">{aiVerdict.threat_classification}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Traffic Table */}
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2 bg-[#080808]">
          <Wifi size={16} className="text-cyan-400" /> 
          <span className="tracking-wider text-sm">LIVE NETWORK FLOW MONITOR</span>
        </div>
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

    </main>
  );
}