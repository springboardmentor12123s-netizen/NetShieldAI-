"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, ShieldAlert as WarningIcon, Terminal, Clock } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

interface AlertItem {
    id: string;
    timestamp: string;
    message: string;
    severity: "critical" | "high" | "medium" | "low";
    src_ip?: string;
    type: string;
}

const MOCK_INITIAL_ALERTS: AlertItem[] = [
    {
        id: "1",
        timestamp: new Date().toISOString(),
        message: "Brute-force entry attempt detected on Admin console",
        severity: "high",
        src_ip: "185.120.45.62",
        type: "Authentication Anomalies",
    },
    {
        id: "2",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        message: "Syn Flood DoS port scan activity flag triggered",
        severity: "critical",
        src_ip: "91.240.118.5",
        type: "DDoS Activity",
    },
    {
        id: "3",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        message: "External DB configuration packet requests rejected",
        severity: "medium",
        src_ip: "10.0.0.145",
        type: "Database Scanning",
    },
];

export function LiveAlerts() {
    const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_INITIAL_ALERTS);

    // Subscribe to live backend security alert socket stream
    useWebSocket("security_alerts", (newAlert: AlertItem) => {
        setAlerts((prev) => [
            {
                ...newAlert,
                id: newAlert.id || Math.random().toString(),
                timestamp: newAlert.timestamp || new Date().toISOString(),
            },
            ...prev.slice(0, 9), // limit to 10 alerts
        ]);
    });

    const severityStyles = {
        critical: "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
        high: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        medium: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
        low: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    };

    return (
        <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-indigo-400 animate-pulse" />
                    Interactive Threat Feed
                </h3>
                <span className="rounded bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 text-[10px] font-medium text-indigo-400 uppercase tracking-wider font-mono">
                    Socket Connected
                </span>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                        <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                        <p className="text-sm">Grid secured. No external threats detected.</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`flex items-start gap-4 rounded-lg border p-4 transition-all duration-300 ${severityStyles[alert.severity]
                                }`}
                        >
                            <div className="mt-0.5 shrink-0">
                                {alert.severity === "critical" || alert.severity === "high" ? (
                                    <ShieldAlert className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs font-semibold tracking-wide uppercase font-mono">
                                        {alert.type}
                                    </span>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                        <Clock className="h-3 w-3" />
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-200 font-medium">{alert.message}</p>
                                {alert.src_ip && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 font-mono">
                                        <Terminal className="h-3.5 w-3.5" />
                                        Source node: <span className="text-slate-300 font-semibold">{alert.src_ip}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}
export default LiveAlerts;
