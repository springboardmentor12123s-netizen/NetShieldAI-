"use client";

import React, { useState } from "react";
import { ShieldCheck, Activity, Filter, RefreshCw, BarChart2, ShieldAlert, Cpu } from "lucide-react";

interface ClassificationItem {
    id: string;
    protocol: string;
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    timestamp: string;
    confidence: number;
}

export default function ThreatClassificationPage() {
    const [severityFilter, setSeverityFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    const handleReload = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 900);
    };

    const classifications: ClassificationItem[] = [
        { id: "CLS-5201", protocol: "TCP", type: "DDoS Reflector Attack", severity: "critical", timestamp: "2026-08-05 21:35:10", confidence: 99.2 },
        { id: "CLS-5202", protocol: "UDP", type: "Port Scanning Activity", severity: "high", timestamp: "2026-08-05 21:30:15", confidence: 87.4 },
        { id: "CLS-5203", protocol: "ICMP", type: "Ping Flood Anomaly", severity: "medium", timestamp: "2026-08-05 21:28:44", confidence: 76.5 },
        { id: "CLS-5204", protocol: "TCP", type: "SSH brute-force login", severity: "high", timestamp: "2026-08-05 21:22:12", confidence: 92.1 },
        { id: "CLS-5205", protocol: "TCP", type: "Normal Flow (Benign)", severity: "low", timestamp: "2026-08-05 21:18:00", confidence: 98.9 },
    ];

    const filtered = classifications.filter(
        c => severityFilter === "all" || c.severity === severityFilter
    );

    const getBadgeStyle = (severity: string) => {
        switch (severity) {
            case "critical":
                return "border-red-500/50 bg-red-950/20 text-red-400";
            case "high":
                return "border-orange-500/50 bg-orange-950/20 text-orange-400";
            case "medium":
                return "border-amber-500/50 bg-amber-950/20 text-amber-400";
            default:
                return "border-emerald-500/50 bg-emerald-950/20 text-emerald-400";
        }
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Threat Classification Engine
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Multiclass classifier output categorizing anomalies by system signature and protocol weights
                    </p>
                </div>
                <div className="flex gap-2 text-xs font-semibold font-mono">
                    <button
                        onClick={handleReload}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-805 text-slate-350 hover:text-white px-4 py-2.5 uppercase tracking-wider text-[10px]"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh classification
                    </button>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-mono"
                    >
                        <option value="all">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid gap-6 md:grid-cols-4 font-mono text-xs">
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Classification Accuracy</span>
                    <span className="text-indigo-400 font-bold text-lg">94.8%</span>
                </div>
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Total Classifications</span>
                    <span className="text-white font-bold text-lg">145,901</span>
                </div>
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Active Malicious Class</span>
                    <span className="text-orange-400 font-bold text-lg">12.1%</span>
                </div>
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Last Run Trace</span>
                    <span className="text-emerald-400 font-bold text-lg">Clean Process</span>
                </div>
            </div>

            {/* Main Classifiers Panels */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Detections List */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-2 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Classifier Logs & History
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real-time pipeline classifications of ingestion streams.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
                                    <th className="py-3 px-4">Trace ID</th>
                                    <th className="py-3 px-4">Protocol</th>
                                    <th className="py-3 px-4">Classification Label</th>
                                    <th className="py-3 px-4">Severity</th>
                                    <th className="py-3 px-4">Confidence</th>
                                    <th className="py-3 px-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-909">
                                {filtered.map((item) => (
                                    <tr key={item.id} className="text-slate-350 hover:bg-slate-900/20 transition-all">
                                        <td className="py-3 px-4 text-white font-semibold">{item.id}</td>
                                        <td className="py-3 px-4">{item.protocol}</td>
                                        <td className="py-3 px-4">{item.type}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2 py-0.5 text-[9px] font-semibold border rounded uppercase ${getBadgeStyle(item.severity)}`}>
                                                {item.severity}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">{item.confidence}%</td>
                                        <td className="py-3 px-4 text-slate-500">{item.timestamp}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Threat severity summary */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Severity Distribution
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Count breakdown per severity category mapping.
                        </p>
                    </div>

                    {/* Progress bars representing proportions */}
                    <div className="space-y-4 font-mono text-xs pt-2">
                        <div className="space-y-1">
                            <div className="flex justify-between text-slate-405">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-500" /> Critical Risks</span>
                                <span className="text-red-405 font-bold">1.2% (1,750)</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded text-[10px]">
                                <div className="h-full bg-red-550 w-[1.2%]" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-slate-405">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-orange-500" /> High Threats</span>
                                <span className="text-orange-405 font-bold">3.9% (5,690)</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded text-[10px]">
                                <div className="h-full bg-orange-550 w-[3.9%]" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-slate-405">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500" /> Medium Warnings</span>
                                <span className="text-amber-405 font-bold">7.0% (10,213)</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded text-[10px]">
                                <div className="h-full bg-amber-550 w-[7%]" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-slate-405">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /> Benign / Low</span>
                                <span className="text-emerald-455 font-bold">87.9% (128,248)</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded text-[10px]">
                                <div className="h-full bg-emerald-550 w-[87.9%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
