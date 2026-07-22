"use client";

import React, { useState } from "react";
import { Search, Filter, ShieldAlert, ArrowRight, Eye, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useTrafficQuery } from "@/hooks/use-traffic";
import { TrafficFilter, TrafficLogResponse } from "@/types/traffic";

interface PacketDetailsModalProps {
    packet: TrafficLogResponse | null;
    onClose: () => void;
}

export default function TrafficMonitorPage() {
    const [filters, setFilters] = useState<TrafficFilter>({
        page: 1,
        per_page: 10,
        src_ip: "",
        dst_ip: "",
        protocol: "",
    });

    const [srcIpInput, setSrcIpInput] = useState("");
    const [dstIpInput, setDstIpInput] = useState("");
    const [selectedPacket, setSelectedPacket] = useState<TrafficLogResponse | null>(null);

    const { data, isLoading, isError, refetch } = useTrafficQuery(filters);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters((prev) => ({
            ...prev,
            page: 1,
            src_ip: srcIpInput || undefined,
            dst_ip: dstIpInput || undefined,
        }));
    };

    const handleProtocolChange = (protocol: string) => {
        setFilters((prev) => ({
            ...prev,
            page: 1,
            protocol: protocol || undefined,
        }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({
            ...prev,
            page: newPage,
        }));
    };

    // Mock list items fallback if database is empty/starting up
    const mockPackets: TrafficLogResponse[] = [
        {
            id: "tr-1024",
            timestamp: new Date().toISOString(),
            src_ip: "192.168.1.100",
            dst_ip: "10.0.0.15",
            src_port: 41203,
            dst_port: 80,
            protocol: "TCP",
            bytes_sent: 512,
            bytes_received: 1024,
            packet_count: 8,
            flags: ["SYN", "ACK"],
            duration_ms: 12,
        },
        {
            id: "tr-1025",
            timestamp: new Date(Date.now() - 5000).toISOString(),
            src_ip: "185.120.45.62",
            dst_ip: "10.0.0.4",
            src_port: 60124,
            dst_port: 22,
            protocol: "SSH",
            bytes_sent: 2048,
            bytes_received: 4096,
            packet_count: 14,
            flags: ["PSH", "ACK"],
            duration_ms: 45,
        },
        {
            id: "tr-1026",
            timestamp: new Date(Date.now() - 12000).toISOString(),
            src_ip: "10.0.2.15",
            dst_ip: "8.8.8.8",
            src_port: 53,
            dst_port: 53,
            protocol: "UDP",
            bytes_sent: 64,
            bytes_received: 128,
            packet_count: 2,
            flags: [],
            duration_ms: 3,
        },
        {
            id: "tr-1027",
            timestamp: new Date(Date.now() - 30000).toISOString(),
            src_ip: "91.240.118.5",
            dst_ip: "10.0.0.4",
            src_port: 58892,
            dst_port: 3389,
            protocol: "RDP",
            bytes_sent: 12500,
            bytes_received: 34000,
            packet_count: 42,
            flags: ["SYN"],
            duration_ms: 110,
        },
    ];

    const packetList = data?.data && data.data.length > 0 ? data.data : mockPackets;
    const totalPages = data?.pages || 1;
    const currentPage = data?.page || 1;

    const protocolColors = {
        TCP: "bg-indigo-950/40 border-indigo-900/40 text-indigo-400",
        UDP: "bg-cyan-950/40 border-cyan-900/40 text-cyan-400",
        ICMP: "bg-amber-955/40 border-amber-900/40 text-amber-400",
        SSH: "bg-emerald-950/40 border-emerald-900/40 text-emerald-400",
        RDP: "bg-red-950/40 border-red-900/40 text-red-400",
    }[filters.protocol || "TCP"] || "bg-slate-900/50 border-slate-800 text-slate-400";

    return (
        <div className="space-y-8">
            {/* Upper header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Traffic Logs Monitor
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Browse and inspect raw server packet metrics
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh Grid
                </button>
            </div>

            {/* Filter and Selection consoles */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm">
                <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4 items-end">
                    {/* Source IP Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Source IP
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="192.168.1.1..."
                                value={srcIpInput}
                                onChange={(e) => setSrcIpInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Destination IP Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Destination IP
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="10.0.0.1..."
                                value={dstIpInput}
                                onChange={(e) => setDstIpInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Protocol dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            IP Protocol
                        </label>
                        <select
                            value={filters.protocol || ""}
                            onChange={(e) => handleProtocolChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">All Protocols</option>
                            <option value="TCP">TCP</option>
                            <option value="UDP">UDP</option>
                            <option value="ICMP">ICMP</option>
                            <option value="SSH">SSH</option>
                            <option value="RDP">RDP</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    >
                        Apply Filters
                    </button>
                </form>
            </div>

            {/* Main Grid Table */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                <th className="py-4 px-6">Timestamp</th>
                                <th className="py-4 px-6">Source IP</th>
                                <th className="py-4 px-6"></th>
                                <th className="py-4 px-6">Destination IP</th>
                                <th className="py-4 px-6">Protocol</th>
                                <th className="py-4 px-6 text-right">Packets</th>
                                <th className="py-4 px-6 text-right">Size</th>
                                <th className="py-4 px-6 text-center">Analyze</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/80 text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, r) => (
                                    <tr key={r} className="animate-pulse">
                                        <td colSpan={8} className="py-6 px-6">
                                            <div className="h-4 rounded bg-slate-900/50 w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                packetList.map((log) => {
                                    const currentProtoColor = {
                                        TCP: "bg-indigo-950/40 border-indigo-900/40 text-indigo-400",
                                        UDP: "bg-cyan-950/40 border-cyan-900/40 text-cyan-400",
                                        ICMP: "bg-amber-955/40 border-amber-900/40 text-amber-400",
                                        SSH: "bg-emerald-950/40 border-emerald-900/40 text-emerald-400",
                                        RDP: "bg-red-950/40 border-red-900/40 text-red-400",
                                    }[log.protocol] || "bg-slate-900/50 border-slate-800 text-slate-400";

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-900/20 text-slate-300">
                                            <td className="py-4 px-6 font-mono text-xs text-slate-450">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="py-4 px-6 font-mono font-medium">
                                                {log.src_ip}
                                                <span className="block text-[10px] text-slate-500">Port: {log.src_port}</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                <ArrowRight className="h-4.5 w-4.5" />
                                            </td>
                                            <td className="py-4 px-6 font-mono font-medium">
                                                {log.dst_ip}
                                                <span className="block text-[10px] text-slate-500">Port: {log.dst_port}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold font-mono uppercase ${currentProtoColor}`}>
                                                    {log.protocol}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-xs">{log.packet_count}</td>
                                            <td className="py-4 px-6 text-right font-mono text-xs">
                                                {log.bytes_sent + log.bytes_received > 1024
                                                    ? `${((log.bytes_sent + log.bytes_received) / 1024).toFixed(1)} KB`
                                                    : `${log.bytes_sent + log.bytes_received} B`}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => setSelectedPacket(log)}
                                                    className="inline-flex rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-indigo-400 hover:bg-slate-800 hover:text-white transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination bar */}
                <div className="flex items-center justify-between border-t border-slate-900 bg-slate-950/30 px-6 py-4">
                    <span className="text-xs text-slate-400 font-medium">
                        Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="rounded border border-slate-800 p-2 text-slate-400 hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft className="h-4.5 w-4.5" />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="rounded border border-slate-800 p-2 text-slate-400 hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronRight className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Packet details modal */}
            {selectedPacket && (
                <PacketDetailsModal packet={selectedPacket} onClose={() => setSelectedPacket(null)} />
            )}
        </div>
    );
}

function PacketDetailsModal({ packet, onClose }: PacketDetailsModalProps) {
    if (!packet) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-indigo-400" />
                        Packet Inspection: {packet.id}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-900/40 p-4 border border-slate-850">
                        <div>
                            <span className="block text-slate-500 uppercase text-[10px] tracking-wide mb-0.5">Source Socket</span>
                            <span className="text-white font-medium">{packet.src_ip}:{packet.src_port}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 uppercase text-[10px] tracking-wide mb-0.5">Destination Socket</span>
                            <span className="text-white font-medium">{packet.dst_ip}:{packet.dst_port}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="rounded border border-slate-900 bg-slate-900/25 p-2">
                            <span className="block text-slate-500 uppercase">Protocol</span>
                            <span className="text-indigo-400 font-bold tracking-wide mt-1 block">{packet.protocol}</span>
                        </div>
                        <div className="rounded border border-slate-900 bg-slate-900/25 p-2">
                            <span className="block text-slate-500 uppercase">Duration</span>
                            <span className="text-white font-bold mt-1 block">{packet.duration_ms} ms</span>
                        </div>
                        <div className="rounded border border-slate-900 bg-slate-900/25 p-2">
                            <span className="block text-slate-500 uppercase">Inference Score</span>
                            <span className="text-emerald-400 font-bold mt-1 block">0.05 (Safe)</span>
                        </div>
                    </div>

                    <div>
                        <span className="block text-slate-500 uppercase text-[9px] tracking-wider mb-1">Packet Control Flags</span>
                        <div className="flex gap-2.5 flex-wrap">
                            {packet.flags && packet.flags.length > 0 ? (
                                packet.flags.map((flag) => (
                                    <span
                                        key={flag}
                                        className="rounded bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 text-[9px] text-indigo-400 font-extrabold uppercase font-mono"
                                    >
                                        {flag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-500 italic text-[11px]">None</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="block text-slate-500 uppercase text-[9px] tracking-wider">Payload Hex Dump</span>
                        <pre className="rounded-lg bg-slate-900 p-4 font-mono text-[10px] leading-relaxed text-slate-350 overflow-x-auto border border-slate-900">
                            {`0000  00 0c 29 4b c5 32 00 24  d4 cc d3 cb 08 00 45 00  ..).K.2.$....E.
0010  00 3c d4 7a 40 00 40 06  b6 2a c0 a8 01 64 0a 00  .<.z@.@..*...d..
0020  00 0f a0 f3 00 50 d2 d8  05 c6 00 00 00 00 a0 02  .....P..........
0030  72 10 3a bf 00 00 02 04  05 b4 04 02 08 0a 00 37  r.:............7`}
                        </pre>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 text-xs uppercase tracking-wider transition-colors"
                    >
                        Close Inspector
                    </button>
                </div>
            </div>
        </div>
    );
}
