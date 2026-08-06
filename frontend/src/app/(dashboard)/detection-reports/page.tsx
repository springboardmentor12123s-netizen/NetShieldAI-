"use client";

import React, { useState } from "react";
import { ClipboardList, Download, BarChart3, ShieldCheck, RefreshCw, Layers } from "lucide-react";

interface ReportItem {
    id: string;
    modelName: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    timestamp: string;
    status: string;
}

export default function DetectionReportsPage() {
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState<ReportItem[]>([
        { id: "RPT-A01", modelName: "Anomaly Isolation Forest Classifier v2.1", accuracy: 0.985, precision: 0.978, recall: 0.981, f1: 0.979, timestamp: "2026-08-05 21:00", status: "compiled" },
        { id: "RPT-A02", modelName: "Random Forest Threat Grader v1.9", accuracy: 0.962, precision: 0.954, recall: 0.963, f1: 0.958, timestamp: "2026-08-05 18:30", status: "compiled" },
        { id: "RPT-A03", modelName: "LSTM Sequence Predictor v1.4", accuracy: 0.941, precision: 0.932, recall: 0.948, f1: 0.940, timestamp: "2026-08-04 12:00", status: "compiled" }
    ]);

    const handleReload = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 800);
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        AI Detection Reports
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Review ML classification statistics, accuracy grids, and compiled model performance records
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReload}
                        className="flex items-center gap-2 rounded-lg bg-slate-905 border border-slate-805 hover:bg-slate-800 text-slate-350 hover:text-white px-4 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reload metrics
                    </button>
                </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 font-mono text-center">
                {[
                    { label: "Accuracy Index", val: "98.50%", color: "indigo", desc: "Correct labels predicted" },
                    { label: "Precision Rate", val: "97.80%", color: "cyan", desc: "Low false warnings" },
                    { label: "Recall Rate", val: "98.10%", color: "emerald", desc: "Fraction of threats captured" },
                    { label: "F1 Matrix Balance", val: "97.90%", color: "amber", desc: "Weighted harmonic mean" }
                ].map((ind) => (
                    <div key={ind.label} className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{ind.label}</span>
                        <h3 className="text-2xl font-bold text-indigo-400 tracking-tight">{ind.val}</h3>
                        <p className="text-[9px] text-slate-550 lowercase">{ind.desc}</p>
                    </div>
                ))}
            </div>

            {/* In-depth details */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                <div>
                    <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
                        <ClipboardList className="h-4.5 w-4.5 text-indigo-405" />
                        Detection History & Model Evaluation Log
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Previously compiled test accuracy benchmarks from standard datasets.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
                                <th className="py-3 px-4">Model Report ID</th>
                                <th className="py-3 px-4">Classifier Description</th>
                                <th className="py-3 px-4">Accuracy</th>
                                <th className="py-3 px-4">Precision</th>
                                <th className="py-3 px-4">Recall</th>
                                <th className="py-3 px-4">F1 Score</th>
                                <th className="py-3 px-4">Generated Timestamp</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-909">
                            {reports.map((rpt) => (
                                <tr key={rpt.id} className="text-slate-350 hover:bg-slate-900/10 transition-colors">
                                    <td className="py-3 px-4 text-white font-semibold">{rpt.id}</td>
                                    <td className="py-3 px-4">{rpt.modelName}</td>
                                    <td className="py-3 px-4 text-indigo-400">{(rpt.accuracy * 100).toFixed(1)}%</td>
                                    <td className="py-3 px-4">{(rpt.precision * 100).toFixed(1)}%</td>
                                    <td className="py-3 px-4 select-none">{(rpt.recall * 100).toFixed(1)}%</td>
                                    <td className="py-3 px-4">{(rpt.f1 * 100).toFixed(1)}%</td>
                                    <td className="py-3 px-4 text-slate-500">{rpt.timestamp}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => alert(`Downloading report spreadsheet for ${rpt.id}`)}
                                            className="inline-flex items-center gap-1 rounded bg-slate-900 hover:bg-indigo-900/30 border border-slate-800 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 px-3.5 py-1.5 transition-all text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
