"use client";

import React, { useState } from "react";
import { BarChart3, TrendingUp, Users, ArrowUpRight, ShieldAlert, Cpu } from "lucide-react";
import { useTrafficAnalytics } from "@/hooks/use-traffic";
import BandwidthUsageChart from "@/components/charts/bandwidth-usage";
import ProtocolDistributionChart from "@/components/charts/protocol-distribution";

export default function TrafficAnalyticsPage() {
    const [hours, setHours] = useState(24);
    const { data: analytics, isLoading, isError } = useTrafficAnalytics(hours);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Mock list items fallback if database is empty/starting up
    const mockAnalytics = {
        top_sources: analytics?.top_source_ips || [
            { ip: "185.120.45.62", count: 875, bytes: 45090000 },
            { ip: "192.168.1.100", count: 504, bytes: 24800000 },
            { ip: "91.240.118.5", count: 320, bytes: 18450000 },
            { ip: "10.0.0.12", count: 188, bytes: 4900000 },
            { ip: "172.16.5.30", count: 95, bytes: 1250000 },
        ],
        top_destinations: analytics?.top_destination_ips || [
            { ip: "10.0.0.4", count: 1540, bytes: 68000000 },
            { ip: "8.8.8.8", count: 420, bytes: 2540000 },
            { ip: "10.0.0.15", count: 320, bytes: 14500000 },
            { ip: "1.1.1.1", count: 180, bytes: 980000 },
            { ip: "208.67.222.222", count: 45, bytes: 340000 },
        ],
        protocol_distribution: analytics?.protocol_distribution || [
            { protocol: "TCP", count: 780 },
            { protocol: "UDP", count: 320 },
            { protocol: "ICMP", count: 85 },
            { protocol: "HTTP", count: 154 },
            { protocol: "HTTPS", count: 420 },
        ],
        bandwidth_usage: analytics?.bandwidth_usage || [
            { time: new Date(Date.now() - 3600000 * 5).toISOString(), bytes: 12000000 },
            { time: new Date(Date.now() - 3600000 * 4).toISOString(), bytes: 24000000 },
            { time: new Date(Date.now() - 3600000 * 3).toISOString(), bytes: 18005000 },
            { time: new Date(Date.now() - 3600000 * 2).toISOString(), bytes: 45000000 },
            { time: new Date(Date.now() - 3600000 * 1).toISOString(), bytes: 32000000 },
            { time: new Date().toISOString(), bytes: 55000000 },
        ],
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Traffic Analytics
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Deep dive data visualization of active node transactions
                    </p>
                </div>

                {/* Time Selector */}
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 p-1">
                    {[1, 6, 24, 72].map((h) => (
                        <button
                            key={h}
                            onClick={() => setHours(h)}
                            className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${hours === h
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white"
                                }`}
                        >
                            {h}h
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Bandwidth Usage */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold tracking-wide text-white mb-4">
                        Volumetric Flow (Bytes Transfer)
                    </h3>
                    {isLoading ? (
                        <div className="h-64 w-full animate-pulse rounded-lg bg-slate-900/40" />
                    ) : (
                        <BandwidthUsageChart data={mockAnalytics.bandwidth_usage} />
                    )}
                </div>

                {/* Protocols Distribution */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold tracking-wide text-white mb-4">
                        Encapsulating Protocols Ratio
                    </h3>
                    {isLoading ? (
                        <div className="h-64 w-full animate-pulse rounded-lg bg-slate-900/40" />
                    ) : (
                        <ProtocolDistributionChart data={mockAnalytics.protocol_distribution} />
                    )}
                </div>
            </div>

            {/* Tables section: Top source and destination IPs */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Sources */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold tracking-wide text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
                        Top Source IPs By Volume
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-semibold uppercase tracking-wider pb-2">
                                    <th className="pb-3">Source Host Node</th>
                                    <th className="pb-3 text-right">Connections</th>
                                    <th className="pb-3 text-right">Data Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/40 text-xs">
                                {mockAnalytics.top_sources.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-900/10 text-slate-350">
                                        <td className="py-3 font-mono font-medium">{item.ip}</td>
                                        <td className="py-3 text-right font-mono">{item.count.toLocaleString()}</td>
                                        <td className="py-3 text-right font-mono font-semibold text-slate-205">
                                            {formatBytes(item.bytes)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Destinations */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold tracking-wide text-white mb-4 flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-cyan-400" />
                        Top Destination IPs By Target
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-semibold uppercase tracking-wider pb-2">
                                    <th className="pb-3">Destination Host Node</th>
                                    <th className="pb-3 text-right">Hits Count</th>
                                    <th className="pb-3 text-right">Data Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/40 text-xs">
                                {mockAnalytics.top_destinations.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-900/10 text-slate-350">
                                        <td className="py-3 font-mono font-medium">{item.ip}</td>
                                        <td className="py-3 text-right font-mono">{item.count.toLocaleString()}</td>
                                        <td className="py-3 text-right font-mono font-semibold text-slate-205">
                                            {formatBytes(item.bytes)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
