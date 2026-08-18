"use client";

import { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, Wifi, Brain, Bell, Settings, LogOut, Database, Cpu, HardDrive, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [toggles, setToggles] = useState({ autoBlock: true, emailAlerts: false, aiAnomaly: true });
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState("");

  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/traffic", label: "Traffic Monitor", icon: Wifi },
    { href: "/scanner", label: "AI Scanner", icon: Brain },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleToggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const clearDatabase = async () => {
    setClearing(true);
    setClearMsg("");
    try {
      const res = await fetch('http://localhost:8000/api/alerts/', { method: 'DELETE' });
      const data = await res.json();
      setClearMsg(data.message);
    } catch (error) {
      setClearMsg("Failed to clear database.");
    } finally {
      setClearing(false);
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
        <h2 className="text-2xl tracking-wider mb-6">System Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Database size={20} className="text-cyan-400" />
              <h3 className="text-lg">Database Status</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>PostgreSQL: <span className="text-green-500">Connected</span></p>
              <p>MongoDB: <span className="text-green-500">Connected</span></p>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Cpu size={20} className="text-cyan-400" />
              <h3 className="text-lg">AI Models</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Isolation Forest: <span className="text-green-500">Loaded</span></p>
              <p>Random Forest: <span className="text-green-500">Loaded</span></p>
              <p>Dataset: <span className="text-gray-300">CICIDS2017</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive size={20} className="text-cyan-400" />
              <h3 className="text-lg">System Configuration</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: "autoBlock", label: "Auto-Block Malicious IPs" },
                { key: "emailAlerts", label: "Email Threat Alerts" },
                { key: "aiAnomaly", label: "AI Anomaly Detection" }
              ].map((opt) => (
                <div key={opt.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{opt.label}</span>
                  <button onClick={() => handleToggle(opt.key)} className={`w-12 h-6 rounded-full transition-colors relative ${toggles[opt.key as keyof typeof toggles] ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${toggles[opt.key as keyof typeof toggles] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="bg-[#0a0a0a] border border-red-500/30 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="text-lg text-red-400">Danger Zone</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">This will permanently delete all alerts in the database. Useful for resetting the demo.</p>
            <button onClick={clearDatabase} disabled={clearing} className="w-full bg-red-500/10 border border-red-500/50 text-red-400 font-bold py-2 rounded hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Trash2 size={16} /> {clearing ? "Clearing..." : "Clear All Alerts"}
            </button>
            {clearMsg && <p className="text-center text-xs text-green-500 mt-4">{clearMsg}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}