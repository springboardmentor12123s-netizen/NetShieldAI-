"use client";

import React, { useState, useEffect } from "react";
import { Compass, Activity, ShieldAlert, Cpu, AlertCircle, BarChart3, TrendingUp, RefreshCw, Layers } from "lucide-react";

export default function ThreatPredictionPage() {
    const [riskScore, setRiskScore] = useState(38);
    const [confidence, setConfidence] = useState(88);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleSimulationRun = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setRiskScore(Math.floor(Math.random() * 40) + 20); // 20 - 60 range
            setConfidence(Math.floor(Math.random() * 15) + 80); // 80 - 95 range
            setIsRefreshing(false);
        }, 1500);
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        AI Threat Prediction & Risk Projection
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Utilize recurrent neural connections and predictive classifiers to isolate incoming threat campaigns
                    </p>
                </div>
                <button
                    onClick={handleSimulationRun}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Calculating Projections..." : "Run Predictive Inferences"}
                </button>
            </div>

            {/* Risk Gauges & Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Risk Score Gauge */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">Proactive Threat index</span>
                        <h3 className="text-sm font-semibold text-white mt-1">Impending Risk Level</h3>
                    </div>

                    <div className="flex flex-col items-center py-4">
                        <div className="relative flex items-center justify-center">
                            {/* Radial background grid */}
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    className="stroke-slate-900"
                                    strokeWidth="8"
                                    fill="transparent"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    className="stroke-indigo-500 transition-all duration-500"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={326.7}
                                    strokeDashoffset={326.7 - (326.7 * riskScore) / 100}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-extrabold text-white font-mono">{riskScore}%</span>
                                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">INDEX</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 text-center border-t border-slate-900 pt-3">
                        Risk Class: <span className="text-emerald-400 font-bold uppercase">MINOR / WATCH</span>
                    </div>
                </div>

                {/* Prediction confidence */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">Core Model stats</span>
                        <h3 className="text-sm font-semibold text-white mt-1">Inference Confidence Score</h3>
                    </div>

                    <div className="flex flex-col items-center py-4">
                        <div className="relative flex items-center justify-center">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    className="stroke-slate-900"
                                    strokeWidth="8"
                                    fill="transparent"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    className="stroke-cyan-400 transition-all duration-500"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={326.7}
                                    strokeDashoffset={326.7 - (326.7 * confidence) / 100}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-extrabold text-white font-mono">{confidence}%</span>
                                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">CONFIDENCE</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 text-center border-t border-slate-900 pt-3">
                        Classification Calibration: <span className="text-cyan-400 font-semibold uppercase">OPTIMAL</span>
                    </div>
                </div>

                {/* Prediction Parameters */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">Campaign Analytics</span>
                        <h3 className="text-sm font-semibold text-white mt-1">Attack Prediction Index</h3>
                    </div>

                    <div className="space-y-3 font-mono text-xs text-slate-405">
                        <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                            <span>Ingress Rate Gradient</span>
                            <span className="text-white">+1.2 Kpps/min</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                            <span>Impending Vector</span>
                            <span className="text-indigo-400">Port Sweep scan</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                            <span>Expected Attack Time</span>
                            <span className="text-amber-450">&lt; 15 min</span>
                        </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 text-center border-t border-slate-900 pt-3">
                        Model Version: <span className="text-white">v3.4.1 (RNN-LSTM)</span>
                    </div>
                </div>
            </div>

            {/* Impending Vectors Projection Table */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                <div>
                    <h3 className="text-sm font-semibold tracking-wide text-white">
                        AI Impending Attack Vector Projections
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Proactively generated threat campaigns based on recursive patterns in ingress packets.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                        <thead>
                            <tr className="border-b border-slate-900 text-slate-500 uppercase font-semibold text-[10px] tracking-wider bg-slate-950/40">
                                <th className="py-3 px-4">Predicted Target</th>
                                <th className="py-3 px-4">Threat Type</th>
                                <th className="py-3 px-4 text-center">Probability</th>
                                <th className="py-3 px-4 text-center">Impending Window</th>
                                <th className="py-3 px-4 text-right">Model Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50">
                            {[
                                { node: "10.0.0.4 (Database Server)", type: "SSH Brute-Force", probability: 78, window: "5-10 min", confidence: 91, color: "red" },
                                { node: "10.0.0.15 (Web Gateway)", type: "DDoS Syn Flood", probability: 42, window: "15-20 min", confidence: 84, color: "amber" },
                                { node: "10.0.0.8 (Operator Panel)", type: "RDP Tunneling Scan", probability: 18, window: "1-2 hours", confidence: 76, color: "indigo" },
                            ].map((proj) => (
                                <tr key={proj.node} className="hover:bg-slate-900/10 text-slate-300">
                                    <td className="py-3.5 px-4 font-semibold text-white">{proj.node}</td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-flex rounded border border-${proj.color}-550/20 bg-${proj.color}-950/20 px-2 py-0.5 text-[10px] text-${proj.color}-400 font-bold uppercase`}>
                                            {proj.type}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                                <div style={{ width: `${proj.probability}%` }} className={`h-full bg-${proj.color}-500`} />
                                            </div>
                                            <span>{proj.probability}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{proj.window}</td>
                                    <td className="py-3.5 px-4 text-right text-cyan-400 font-semibold">{proj.confidence}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
