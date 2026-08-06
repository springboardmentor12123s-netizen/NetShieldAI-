"use client";

import React, { useState } from "react";
import { Globe, ShieldAlert, Crosshair, Server, Trash, Plus, RefreshCw, CheckCircle } from "lucide-react";

interface BadIP {
    ip: string;
    reputedScore: number; // 0 (Clean) to 100 (Hostile)
    location: string;
    reason: string;
    blocked: boolean;
}

export default function ThreatIntelligencePage() {
    const [ips, setIps] = useState<BadIP[]>([
        { ip: "185.220.101.4", reputedScore: 92, location: "Netherlands (Tor Exit)", reason: "SSH Brute-Force", blocked: true },
        { ip: "91.240.118.5", reputedScore: 88, location: "Russia", reason: "SQL Injection Probing", blocked: true },
        { ip: "45.142.195.34", reputedScore: 74, location: "China", reason: "TCP Port Sweeping", blocked: false },
        { ip: "198.51.100.12", reputedScore: 45, location: "United States", reason: "Unsanctioned Ping sweeps", blocked: false },
    ]);
    const [ipInput, setIpInput] = useState("");
    const [reasonInput, setReasonInput] = useState("");
    const [syncing, setSyncing] = useState(false);

    const handleAddIP = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ipInput) return;
        const newIp: BadIP = {
            ip: ipInput,
            reputedScore: 95,
            location: "Unknown / Provisioned",
            reason: reasonInput || "Operator Manually Blacklisted",
            blocked: true,
        };
        setIps([newIp, ...ips]);
        setIpInput("");
        setReasonInput("");
    };

    const handleToggleBlock = (ip: string) => {
        setIps(prev => prev.map(item => item.ip === ip ? { ...item, blocked: !item.blocked } : item));
    };

    const handleOSINTSync = () => {
        setSyncing(true);
        setTimeout(() => {
            setSyncing(false);
            alert("Threat Intelligence feeds successfully synchronized.");
        }, 1500);
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        AI Threat Intelligence & OSINT Feeds
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Interact with global blacklists, analyze malicious reputation indices, and blacklist threat actors.
                    </p>
                </div>
                <button
                    onClick={handleOSINTSync}
                    disabled={syncing}
                    className="flex items-center gap-2 rounded-lg bg-indigo-655 hover:bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing OSINT..." : "Sync OSINT Feeds"}
                </button>
            </div>

            {/* Malicious IP Blacklist and Add form */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Active IP Blacklist Table */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-2 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Malicious IP Blacklist Engine
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            IP blocks dynamically updated by the local IDS controller.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                                <tr className="border-b border-slate-900 text-slate-550 uppercase font-semibold text-[10px] tracking-wider bg-slate-950/40">
                                    <th className="py-3 px-4">Threat Origin IP</th>
                                    <th className="py-3 px-4 text-center">Reputation Score</th>
                                    <th className="py-3 px-4">Country Node</th>
                                    <th className="py-3 px-4">Reason / Activity</th>
                                    <th className="py-3 px-4 text-center">Firewall Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {ips.map((item) => (
                                    <tr key={item.ip} className="hover:bg-slate-900/10 text-slate-300">
                                        <td className="py-3.5 px-4 font-semibold text-white">{item.ip}</td>
                                        <td className="py-3.5 px-4 text-center font-bold">
                                            <span className={item.reputedScore > 80 ? "text-red-400" : item.reputedScore > 50 ? "text-amber-400" : "text-slate-400"}>
                                                {item.reputedScore}/100
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-400">{item.location}</td>
                                        <td className="py-3.5 px-4 text-slate-500">{item.reason}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => handleToggleBlock(item.ip)}
                                                className={`rounded px-2 py-1 font-bold text-[9px] uppercase tracking-wider transition-all border ${item.blocked
                                                        ? "border-red-500 bg-red-950/20 text-red-400"
                                                        : "border-slate-850 bg-slate-950 text-slate-400 hover:text-white"
                                                    }`}
                                            >
                                                {item.blocked ? "BLOCKED" : "MONITOR"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Custom Blacklist IP Vector Form */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-1 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Inject Blacklist Node
                        </h3>
                        <p className="text-xs text-slate-550 mt-0.5 font-mono">
                            Add manual firewall rules blocks.
                        </p>
                    </div>

                    <form onSubmit={handleAddIP} className="space-y-4 font-mono text-xs">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider">Target IP Address</label>
                            <input
                                type="text"
                                placeholder="e.g. 198.51.100.55"
                                value={ipInput}
                                onChange={(e) => setIpInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider">Classification Reason</label>
                            <input
                                type="text"
                                placeholder="e.g. DNS Flood attempts"
                                value={reasonInput}
                                onChange={(e) => setReasonInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-2 rounded bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" /> Add IP Block Rule
                        </button>
                    </form>
                </div>
            </div>

            {/* Global OSINT Diagnostic Aggregator */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6 backdrop-blur-sm space-y-4">
                <div>
                    <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
                        <Globe className="h-4.5 w-4.5 text-indigo-400" />
                        OSINT Threat intelligence Aggregator Feeds
                    </h3>
                    <p className="text-xs text-slate-550 mt-0.5 font-mono">
                        Global indicators of compromise synchronized in cache memory.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 font-mono text-[11px] text-slate-450">
                    <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-900 flex justify-between items-center">
                        <div className="space-y-0.5">
                            <span className="block text-white font-bold">AlienVault OTX</span>
                            <span className="text-[10px] text-slate-500">Last Synced: 2 min ago</span>
                        </div>
                        <span className="text-emerald-450 font-bold bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded text-[9px]">ONLINE</span>
                    </div>

                    <div className="rounded-lg bg-slate-955/40 p-4 border border-slate-900 flex justify-between items-center">
                        <div className="space-y-0.5">
                            <span className="block text-white font-bold">Abuse.ch SSLBL</span>
                            <span className="text-[10px] text-slate-500">Last Synced: 5 min ago</span>
                        </div>
                        <span className="text-emerald-450 font-bold bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded text-[9px]">ONLINE</span>
                    </div>

                    <div className="rounded-lg bg-slate-955/40 p-4 border border-slate-900 flex justify-between items-center">
                        <div className="space-y-0.5">
                            <span className="block text-white font-bold">Spamhaus DROP</span>
                            <span className="text-[10px] text-slate-500">Last Synced: 10 min ago</span>
                        </div>
                        <span className="text-emerald-450 font-bold bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded text-[9px]">ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
