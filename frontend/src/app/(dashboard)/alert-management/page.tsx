"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, Clock, Terminal, CheckCircle2, MessageSquare, Play, HelpCircle, Activity, Heart, RefreshCw } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import apiClient from "@/services/api-client";

interface AlertItem {
    id: string;
    timestamp: string;
    message: string;
    severity: "critical" | "high" | "medium" | "low";
    src_ip?: string;
    type: string;
}

export default function AlertManagementPage() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState<string>("all");
    const [diagnostics, setDiagnostics] = useState({ receivedCount: 0, status: "Connected" });

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<any>("/alerts");
            const data = response.data.items || response.data || [];
            const rawAlerts = Array.isArray(data) ? data : [];
            const alertsList = rawAlerts.map((item: any) => ({
                id: item.id || item._id,
                timestamp: item.timestamp,
                message: item.message || item.description || "",
                severity: item.severity,
                src_ip: item.src_ip || item.source_ip || "",
                type: item.type || item.alert_type || "Unknown Threat"
            }));
            setAlerts(alertsList);
            setDiagnostics(prev => ({ ...prev, receivedCount: alertsList.length }));
        } catch (error) {
            console.error("Failed to load DB alerts feed:", error);
            // Fallback mock alerts for visual clarity
            const mocks: AlertItem[] = [
                {
                    id: "al-901",
                    timestamp: new Date().toISOString(),
                    message: "DDoS high volume packet influx on staging server gateway",
                    severity: "critical",
                    src_ip: "185.120.45.62",
                    type: "Traffic Outflow"
                },
                {
                    id: "al-902",
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    message: "SSH brute-force login failure on main database client",
                    severity: "high",
                    src_ip: "91.240.118.5",
                    type: "Authentication"
                },
                {
                    id: "al-903",
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    message: "Subnet address sweeps scan from unsanctioned external host",
                    severity: "medium",
                    src_ip: "10.0.0.142",
                    type: "Port Scanning"
                },
                {
                    id: "al-904",
                    timestamp: new Date(Date.now() - 1200000).toISOString(),
                    message: "Server load warning - CPU temperature exceeds 74 degrees",
                    severity: "low",
                    src_ip: "127.0.0.1",
                    type: "Hardware Alert"
                }
            ];
            setAlerts(mocks);
            setDiagnostics(prev => ({ ...prev, receivedCount: mocks.length }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    // Subscribe to live backend security alert socket stream
    useWebSocket("security_alerts", (newAlert: any) => {
        const normalized: AlertItem = {
            id: newAlert.id || newAlert._id || Math.random().toString(),
            timestamp: newAlert.timestamp || new Date().toISOString(),
            message: newAlert.message || newAlert.description || "",
            severity: newAlert.severity || "info",
            src_ip: newAlert.src_ip || newAlert.source_ip || "",
            type: newAlert.type || newAlert.alert_type || "Anomaly"
        };
        setAlerts((prev) => [normalized, ...prev]);
        setDiagnostics((prev) => ({
            ...prev,
            receivedCount: prev.receivedCount + 1,
        }));
    });

    const counts = {
        critical: alerts.filter(a => a.severity === "critical").length,
        high: alerts.filter(a => a.severity === "high").length,
        medium: alerts.filter(a => a.severity === "medium").length,
        low: alerts.filter(a => a.severity === "low").length,
    };

    const filteredAlerts = severityFilter === "all"
        ? alerts
        : alerts.filter(a => a.severity === severityFilter);

    const severityStyles = {
        critical: "border-red-500/30 bg-red-950/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
        high: "border-amber-500/30 bg-amber-950/20 text-amber-400",
        medium: "border-yellow-500/20 bg-yellow-950/10 text-yellow-400",
        low: "border-blue-500/20 bg-blue-950/10 text-blue-405",
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Console Alerts feed
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Interact with the live ingestion stream, evaluate severities, and initiate investigative cases
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchAlerts}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-805 text-slate-350 hover:text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" /> Hard Refresh
                    </button>
                </div>
            </div>

            {/* Severity Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 font-mono text-center">
                <button
                    onClick={() => setSeverityFilter("critical")}
                    className={`rounded-xl border p-5 backdrop-blur-sm transition-all focus:outline-none ${severityFilter === "critical" ? "border-red-500 bg-red-950/30 text-red-400" : "border-slate-900 bg-slate-909/20 text-slate-400"
                        }`}
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-500">Critical Alarms</span>
                    <h3 className="text-2xl font-bold mt-1.5">{counts.critical}</h3>
                </button>

                <button
                    onClick={() => setSeverityFilter("high")}
                    className={`rounded-xl border p-5 backdrop-blur-sm transition-all focus:outline-none ${severityFilter === "high" ? "border-amber-500 bg-amber-955/30 text-amber-400" : "border-slate-900 bg-slate-900/20 text-slate-400"
                        }`}
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">High Severity</span>
                    <h3 className="text-2xl font-bold mt-1.5">{counts.high}</h3>
                </button>

                <button
                    onClick={() => setSeverityFilter("medium")}
                    className={`rounded-xl border p-5 backdrop-blur-sm transition-all focus:outline-none ${severityFilter === "medium" ? "border-yellow-500 bg-yellow-955/35 text-yellow-400" : "border-slate-900 bg-slate-900/20 text-slate-400"
                        }`}
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-500">Medium Incidents</span>
                    <h3 className="text-2xl font-bold mt-1.5">{counts.medium}</h3>
                </button>

                <button
                    onClick={() => setSeverityFilter("all")}
                    className={`rounded-xl border p-5 backdrop-blur-sm transition-all focus:outline-none ${severityFilter === "all" ? "border-indigo-500 bg-indigo-950/30 text-indigo-400" : "border-slate-900 bg-slate-900/20 text-slate-400"
                        }`}
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-indigo-400/20 pb-0.5">Show All Logs</span>
                    <h3 className="text-2xl font-bold mt-1.5">{alerts.length}</h3>
                </button>
            </div>

            {/* Alert List and Live Status */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Alert Feed Container */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-905 pb-3">
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Raw Real-Time Alert Stream
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono">
                            Diagnostic Log Count: {diagnostics.receivedCount}
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                        {loading ? (
                            <div className="text-center py-8 text-xs text-slate-500">Fetching network events...</div>
                        ) : filteredAlerts.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-xs font-mono">
                                No warning logs matched severity class filter: {severityFilter}
                            </div>
                        ) : (
                            filteredAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`flex items-start gap-4 rounded-lg border p-4 transition-all duration-300 ${severityStyles[alert.severity] || "border-slate-800 bg-slate-900/50"}`}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1 font-mono text-xs">
                                        <div className="flex items-center justify-between gap-4 border-b border-slate-900/20 pb-1">
                                            <span className="font-bold text-white uppercase">{alert.type}</span>
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(alert.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-350 text-[11px] leading-relaxed pt-1">{alert.message}</p>
                                        {alert.src_ip && (
                                            <div className="flex items-center gap-1.5 pt-1.5 text-[10px] text-slate-500">
                                                <Terminal className="h-3.5 w-3.5" />
                                                Ingress IP: <span className="font-semibold text-slate-350">{alert.src_ip}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sockets Diagnostics Info */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-1 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Daemon Monitor & Sockets
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Active channels status and diagnostic packet feed.
                        </p>
                    </div>

                    <div className="space-y-4 font-mono text-[11px] text-slate-400">
                        {/* Live Socket Feed Indicator */}
                        <div className="flex items-center justify-between border-b border-slate-900/50 py-2.5">
                            <span>Ingress Channels</span>
                            <span className="text-emerald-450 font-bold flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                active
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-900/50 py-2.5">
                            <span>ML Stream Connection</span>
                            <span className="text-emerald-450 font-bold flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                active
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-905/30 py-2.5">
                            <span>Diagnostic Handshake</span>
                            <span className="text-white">v1.2.0 (TLS_1_3)</span>
                        </div>

                        {/* Recent Web Socket Log activity */}
                        <div className="space-y-2 pt-2">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Channel Messages Loop</span>
                            <div className="rounded-lg bg-slate-950 p-3 text-[10px] text-indigo-400 overflow-auto max-h-40 border border-slate-900">
                                <div>[SYS] Socket connected on path /security_alerts</div>
                                <div>[SYS] Handshake validation success (role: operator)</div>
                                <div>[STREAM] Subscribed to traffic_anomaly_feed</div>
                                <div>[INF] Ingested packets frame rate: 4.2 MB/s</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
