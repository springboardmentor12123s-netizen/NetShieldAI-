"use client";

import React, { useState } from "react";
import { BarChart3, Activity, PieChart, ShieldAlert, Cpu, Heart, CheckCircle, RefreshCw } from "lucide-react";
import ProtocolDistribution from "@/components/charts/protocol-distribution";

export default function AnalyticsPage() {
    const [duration, setDuration] = useState("24h");
    const [loading, setLoading] = useState(false);

    const handleReload = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        SOC Analytics Center
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        System telemetry, protocol metrics distribution mapping, and active flow charts
                    </p>
                </div>
                <div className="flex gap-2 text-xs font-semibold font-mono">
                    <button
                        onClick={handleReload}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-805 text-slate-350 hover:text-white px-4 py-2.5 uppercase tracking-wider text-[10px]"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Metrics
                    </button>
                    {["1h", "24h", "7d"].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={`rounded-lg border px-3 py-2.5 uppercase text-[10px] tracking-wider transition-all ${duration === d
                                    ? "border-indigo-500 bg-indigo-950/20 text-indigo-400 font-bold"
                                    : "border-slate-850 bg-slate-950 text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* Protocol Distribution & Traffic Volume metrics */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Protocol Distribution Component Wrapper */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Raw Protocol Volume Distribution
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ingested socket counts partitioned by transport level protocols.
                        </p>
                    </div>

                    <div className="min-h-[250px] flex items-center justify-center border border-slate-900 bg-slate-950/30 rounded-lg p-6">
                        {/* We load the codebase protocol visualization if active, else render an inline glowing bar set */}
                        <div className="w-full space-y-4 font-mono text-xs">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-slate-400">
                                    <span>TCP Protocol (Control Ingress)</span>
                                    <span className="text-indigo-400 font-bold">68.4% (854,012 pkts)</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[68.4%]" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-slate-400">
                                    <span>UDP Protocol (Inbound Media)</span>
                                    <span className="text-cyan-405 font-bold">22.8% (284,910 pkts)</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 w-[22.8%]" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-slate-400">
                                    <span>ICMP Control Queries</span>
                                    <span className="text-amber-400 font-bold">6.1% (76,120 pkts)</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 w-[6.1%]" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-slate-400">
                                    <span>Other Encapsulations (GRE/IPsec)</span>
                                    <span className="text-slate-500 font-bold">2.7% (33,461 pkts)</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-700 w-[2.7%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Telemetry charts */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Time-Series Telemetry & Bandwidth
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real-time average network loading throughput (Megabits per second).
                        </p>
                    </div>

                    <div className="h-[250px] border border-slate-900 bg-slate-950/20 rounded-lg p-4 flex flex-col justify-between font-mono text-[10px] text-slate-500">
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                            <span>Ingress Peak</span>
                            <span>12.4 Mbps</span>
                        </div>

                        {/* Simulation lines */}
                        <div className="flex-1 flex items-end gap-1.5 px-2 py-4">
                            {[15, 24, 35, 12, 8, 42, 60, 52, 38, 20, 18, 48, 72, 85, 40, 30, 22, 50, 64, 92, 45, 18, 25, 40].map((val, idx) => (
                                <div
                                    key={idx}
                                    style={{ height: `${val}%` }}
                                    className="flex-1 bg-gradient-to-t from-indigo-500/20 to-indigo-550/80 rounded-t"
                                />
                            ))}
                        </div>

                        <div className="flex justify-between border-t border-slate-900/60 pt-1.5 text-[9px]">
                            <span>T-24h</span>
                            <span>T-12h</span>
                            <span>Now</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance System Metrics */}
            <div className="grid gap-6 md:grid-cols-3 font-mono text-xs">
                <div className="rounded-xl border border-slate-900 bg-slate-905/30 p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 flex items-center justify-center shrink-0">
                        <Activity className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Average CPU Load</span>
                        <span className="text-white font-bold text-sm">34.2%</span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-900 bg-slate-905/30 p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-cyan-950/50 border border-cyan-900/40 text-cyan-400 flex items-center justify-center shrink-0">
                        <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Memory Allocation</span>
                        <span className="text-white font-bold text-sm">3.9 GB / 8.0 GB</span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-900 bg-slate-905/30 p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Controller Health</span>
                        <span className="text-emerald-400 font-bold text-sm">Optimal Status</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
