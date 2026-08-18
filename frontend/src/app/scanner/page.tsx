"use client";

import { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, Wifi, Brain, Bell, Settings, LogOut, Cpu, Zap } from 'lucide-react';

export default function AIScanner() {
  const [verdict, setVerdict] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [flowData, setFlowData] = useState({
    flow_duration: 50000,
    total_fwd_packets: 20,
    total_backward_packets: 20,
    fwd_packet_length_max: 500,
    flow_bytes_per_sec: 20000,
    flow_packets_per_sec: 100
  });

  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/traffic", label: "Traffic Monitor", icon: Wifi },
    { href: "/scanner", label: "AI Scanner", icon: Brain },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlowData({ ...flowData, [e.target.name]: parseFloat(e.target.value) });
  };

  const applyPreset = (preset: string) => {
    if (preset === "DDoS") {
      // Updated values to trigger the new 5M bytes/sec threshold
      setFlowData({ flow_duration: 50, total_fwd_packets: 5000, total_backward_packets: 5, fwd_packet_length_max: 10000, flow_bytes_per_sec: 8000000, flow_packets_per_sec: 60000 });
    } else if (preset === "PortScan") {
      setFlowData({ flow_duration: 2000, total_fwd_packets: 800, total_backward_packets: 2, fwd_packet_length_max: 80, flow_bytes_per_sec: 20000, flow_packets_per_sec: 500 });
    } else if (preset === "Normal") {
      setFlowData({ flow_duration: 50000, total_fwd_packets: 20, total_backward_packets: 20, fwd_packet_length_max: 500, flow_bytes_per_sec: 20000, flow_packets_per_sec: 100 });
    }
  };

  const runScan = async () => {
    setAnalyzing(true);
    setVerdict(null);
    try {
      const response = await fetch('http://localhost:8000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flowData,
          fwd_packet_length_mean: flowData.fwd_packet_length_max / 2 
        })
      });
      
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      setVerdict(data);
    } catch (error) { 
      console.error("AI Scan Error:", error); 
    } finally { 
      setAnalyzing(false); 
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
        <div className="flex items-center gap-3 mb-8">
          <Cpu size={28} className="text-cyan-400" />
          <h2 className="text-2xl tracking-wider">AI Threat Sandbox</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
            <h3 className="text-lg mb-4 text-gray-300">Configure Network Flow</h3>
            
            <div className="flex gap-2 mb-6">
              <button onClick={() => applyPreset("Normal")} className="flex-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs py-2 rounded hover:bg-green-500/20">Normal</button>
              <button onClick={() => applyPreset("DDoS")} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2 rounded hover:bg-red-500/20">DDoS</button>
              <button onClick={() => applyPreset("PortScan")} className="flex-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs py-2 rounded hover:bg-orange-500/20">PortScan</button>
            </div>

            <div className="space-y-4">
              {Object.entries(flowData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">{key.replace(/_/g, ' ')}</label>
                  <input 
                    type="range" 
                    min={0} 
                    max={key.includes('duration') ? 100000 : 10000000} 
                    value={value} 
                    onChange={handleInputChange} 
                    name={key} 
                    className="w-full accent-cyan-500" 
                  />
                  <div className="text-right text-xs text-cyan-400 mt-1">{value.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <button onClick={runScan} disabled={analyzing} className="w-full mt-6 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold py-3 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Zap size={18} /> {analyzing ? "ANALYZING..." : "EXECUTE AI SCAN"}
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg flex flex-col">
            <h3 className="text-lg mb-4 text-gray-300">AI Verdict</h3>
            
            {!verdict && !analyzing && (
              <div className="flex-1 flex items-center justify-center text-gray-700 text-sm">
                Awaiting scan execution...
              </div>
            )}

            {analyzing && (
              <div className="flex-1 flex items-center justify-center text-cyan-400 animate-pulse text-sm">
                AI Models processing payload...
              </div>
            )}

            {verdict && (
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-2 ${verdict.risk_score >= 75 ? 'text-red-500' : verdict.risk_score >= 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {verdict.risk_score}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Risk Score (0-100)</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#050505] p-4 rounded border border-gray-800">
                    <div className="text-xs text-gray-500 mb-1">Classification</div>
                    <div className={`text-lg font-bold ${verdict.threat_classification !== "BENIGN" ? 'text-red-400' : 'text-green-400'}`}>{verdict.threat_classification}</div>
                  </div>
                  <div className="bg-[#050505] p-4 rounded border border-gray-800">
                    <div className="text-xs text-gray-500 mb-1">Anomaly Status</div>
                    <div className={`text-lg font-bold ${verdict.is_anomaly ? 'text-orange-400' : 'text-green-400'}`}>{verdict.is_anomaly ? "ANOMALY" : "NORMAL"}</div>
                  </div>
                </div>

                <div className="bg-[#050505] p-4 rounded border border-gray-800 text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between"><span>Isolation Forest:</span><span className="text-cyan-400">Executed</span></div>
                  <div className="flex justify-between"><span>Random Forest:</span><span className="text-cyan-400">Executed</span></div>
                  <div className="flex justify-between"><span>Label Encoder:</span><span className="text-cyan-400">Decoded</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}