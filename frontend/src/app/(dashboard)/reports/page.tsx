"use client";

import React, { useState } from "react";
import { FileText, Download, Play, RefreshCw, BarChart2, Radio, CheckCircle, Clock } from "lucide-react";

interface ReportTask {
    id: string;
    type: string;
    range: string;
    format: string;
    status: "ready" | "compiling" | "failed";
    timestamp: string;
}

export default function ReportsCompilerPage() {
    const [reportType, setReportType] = useState("traffic_summary");
    const [range, setRange] = useState("7d");
    const [format, setFormat] = useState("pdf");
    const [compiling, setCompiling] = useState(false);
    const [tasks, setTasks] = useState<ReportTask[]>([
        { id: "REP-901", type: "Traffic Volume & Packets Stats", range: "Last 24 Hours", format: "CSV", status: "ready", timestamp: new Date(Date.now() - 3600000 * 4).toLocaleDateString() },
        { id: "REP-902", type: "Security Incident Ledger", range: "Last 30 Days", format: "PDF", status: "ready", timestamp: new Date(Date.now() - 3600000 * 20).toLocaleDateString() },
        { id: "REP-903", type: "AI Detection Engine Evaluation", range: "Last 7 Days", format: "PDF", status: "ready", timestamp: new Date(Date.now() - 3600000 * 48).toLocaleDateString() },
    ]);

    const handleCompileReport = (e: React.FormEvent) => {
        e.preventDefault();
        setCompiling(true);

        const typeLabel = {
            traffic_summary: "Traffic Volume & Packets Stats",
            threat_summary: "Threat Signature Reports",
            detection_summary: "AI Detection Engine Evaluation",
            incident_summary: "Security Incident Ledger",
            general_summary: "Overall Executive Summary Reports"
        }[reportType] || "Overall Executive Summary Reports";

        const newTask: ReportTask = {
            id: `REP-${Math.floor(Math.random() * 900) + 100}`,
            type: typeLabel,
            range: range === "24h" ? "Last 24 Hours" : range === "7d" ? "Last 7 Days" : "Last 30 Days",
            format: format.toUpperCase(),
            status: "compiling",
            timestamp: new Date().toLocaleDateString(),
        };

        setTasks([newTask, ...tasks]);

        setTimeout(() => {
            setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, status: "ready" } : t));
            setCompiling(false);
            alert("Report compilation successful. File is cached and ready for download.");
        }, 1500);
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        AI Reports compiler Center
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Configure, compile, and download system summaries, incident profiles, and traffic history data.
                    </p>
                </div>
            </div>

            {/* Configurator & Queue grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Reports Form Configurator */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-1 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Compile New Report
                        </h3>
                        <p className="text-xs text-slate-550 mt-0.5 font-mono">
                            Request system states aggregation.
                        </p>
                    </div>

                    <form onSubmit={handleCompileReport} className="space-y-4 font-mono text-xs">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-550 uppercase tracking-wider">Report Category</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="traffic_summary">Traffic Reports</option>
                                <option value="threat_summary">Threat Reports</option>
                                <option value="detection_summary">Detection Reports</option>
                                <option value="incident_summary">Incident Reports</option>
                                <option value="general_summary">Summary Reports</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-550 uppercase tracking-wider">Date Filters</label>
                            <select
                                value={range}
                                onChange={(e) => setRange(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-550 uppercase tracking-wider">Export Format</label>
                            <div className="flex gap-2">
                                {["pdf", "csv", "json"].map((form) => (
                                    <button
                                        type="button"
                                        key={form}
                                        onClick={() => setFormat(form)}
                                        className={`flex-1 rounded py-2 text-center uppercase text-[10px] tracking-wider transition-all border ${format === form
                                            ? "border-indigo-500 bg-indigo-950/20 text-indigo-400 font-bold"
                                            : "border-slate-850 bg-slate-950 text-slate-405"
                                            }`}
                                    >
                                        {form}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={compiling}
                            className="w-full mt-2 rounded bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <Play className={`h-4 w-4 ${compiling ? "animate-pulse" : ""}`} />
                            {compiling ? "Compiling..." : "Generate report"}
                        </button>
                    </form>
                </div>

                {/* Reports Compilation Queue */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-2 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Report History
                        </h3>
                        <p className="text-xs text-slate-550 mt-0.5">
                            Previously requested logs spreadsheets. All compiled files are cached for 30 days.
                        </p>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                        {tasks.map((task) => (
                            <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-slate-950/40 border border-slate-909/60 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{task.type}</span>
                                        <span className="text-[10px] rounded bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 uppercase">
                                            {task.format}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex gap-2">
                                        <span>File ID: {task.id}</span>
                                        <span>•</span>
                                        <span>Range: {task.range}</span>
                                        <span>•</span>
                                        <span>Created: {task.timestamp}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {task.status === "compiling" ? (
                                        <span className="text-yellow-450 font-bold flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 animate-spin" /> Compiling...
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-emerald-450 font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3.5 h-3.5" /> Ready
                                            </span>
                                            <button
                                                onClick={() => alert(`Downloading ${task.id}.${task.format.toLowerCase()}`)}
                                                className="flex items-center gap-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors"
                                            >
                                                <Download className="h-3.5 w-3.5" /> Download
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
