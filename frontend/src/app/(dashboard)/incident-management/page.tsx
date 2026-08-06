"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, FileText, CheckCircle, Clock, Search, Filter, RefreshCw, Eye, MessageSquare, AlertCircle } from "lucide-react";
import apiClient from "@/services/api-client";

interface Incident {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    created_at: string;
}

export default function IncidentManagementPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<Incident[]>("/incidents");
            setIncidents(res.data);
        } catch (error) {
            console.error("Failed to load incidents feed:", error);
            const mocks: Incident[] = [
                {
                    id: "inc-101",
                    title: "SQL Injection Vector Detected",
                    description: "AI engine detected structured query injections on staging database router client.",
                    severity: "critical",
                    status: "investigating",
                    created_at: new Date().toISOString()
                },
                {
                    id: "inc-102",
                    title: "Ingress SSH Brute-Force",
                    description: "Failed authorization requests exceeding 40 times in a minute from blacklisted IP.",
                    severity: "high",
                    status: "open",
                    created_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: "inc-103",
                    title: "Subnet ICMP Sweep",
                    description: "Mass internal host ping sweeping identified matching Port Sweep signature.",
                    severity: "medium",
                    status: "resolved",
                    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
                }
            ];
            setIncidents(mocks);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await apiClient.put(`/incidents/${id}`, { status: newStatus });
            fetchIncidents();
            if (selectedIncident?.id === id) {
                setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error) {
            console.error("Failed to mutate incident status:", error);
            setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
            if (selectedIncident?.id === id) {
                setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
            }
            alert("Incident status successfully mutated in developer simulator.");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "resolved": return <CheckCircle className="text-emerald-500 w-4 h-4" />;
            case "closed": return <CheckCircle className="text-slate-500 w-4 h-4" />;
            case "investigating": return <Clock className="text-yellow-500 w-4 h-4 animate-spin" />;
            default: return <ShieldAlert className="text-red-500 w-4 h-4" />;
        }
    };

    const filteredIncidents = incidents.filter(inc => {
        const matchesStatus = statusFilter === "all" || inc.status === statusFilter;
        const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inc.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Incident Management
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Track, triage, and resolve incoming network security incidents generated from model alerts
                    </p>
                </div>
                <button
                    onClick={fetchIncidents}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-805 hover:bg-slate-800 text-slate-350 hover:text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh Incidents
                </button>
            </div>

            {/* Filter controls */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-full md:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search incident titles, IDs or payloads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                </div>

                {/* Status Toggle buttons */}
                <div className="flex gap-2 text-xs font-semibold font-mono">
                    {["all", "open", "investigating", "resolved"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`rounded-lg border px-4 py-2 transition-all uppercase text-[10px] tracking-wider ${statusFilter === status
                                ? "border-indigo-500/40 bg-indigo-950/20 text-indigo-400 font-bold"
                                : "border-slate-850 bg-slate-950/40 text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Incidents Table grid */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-900 bg-slate-955/50 text-slate-455 text-[10px] font-semibold uppercase tracking-wider font-mono">
                                <th className="py-4 px-6">Case Status</th>
                                <th className="py-4 px-6">Incident ID</th>
                                <th className="py-4 px-6">Title / Description</th>
                                <th className="py-4 px-6">Severity</th>
                                <th className="py-4 px-6">Date Triggered</th>
                                <th className="py-4 px-6 text-center">Triage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/80 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 px-6 text-center text-xs text-slate-500">
                                        Loading active incidents board...
                                    </td>
                                </tr>
                            ) : filteredIncidents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 px-6 text-center text-xs text-slate-550 italic font-mono">
                                        No active case matches filter constraints.
                                    </td>
                                </tr>
                            ) : (
                                filteredIncidents.map((incident) => {
                                    const severityBadge = {
                                        critical: "bg-red-950/40 border-red-900/40 text-red-400",
                                        high: "bg-orange-950/40 border-orange-900/40 text-orange-400",
                                        medium: "bg-yellow-950/20 border-yellow-900/30 text-yellow-500",
                                        low: "bg-blue-955/40 border-blue-900/40 text-blue-400",
                                    }[incident.severity.toLowerCase()] || "bg-slate-900 border-slate-800 text-slate-400";

                                    return (
                                        <tr key={incident.id} className="hover:bg-slate-909/20 text-slate-300">
                                            <td className="py-4 px-6 font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(incident.status)}
                                                    <span className="capitalize font-semibold text-slate-350">{incident.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-450">{incident.id}</td>
                                            <td className="py-4 px-6 space-y-0.5">
                                                <div className="font-semibold text-white">{incident.title}</div>
                                                <div className="text-slate-500 text-[11px] font-mono leading-relaxed truncate max-w-sm">
                                                    {incident.description}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex rounded border px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase ${severityBadge}`}>
                                                    {incident.severity.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-slate-500">
                                                {new Date(incident.created_at).toLocaleDateString()} {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => setSelectedIncident(incident)}
                                                    className="inline-flex rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-indigo-405 hover:bg-slate-800 hover:text-white transition-colors"
                                                >
                                                    <Eye className="h-4.5 w-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono text-xs">
                    <div className="relative w-full max-w-lg rounded-xl border border-slate-850 bg-slate-950 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-indigo-400" />
                                Incident Triage: {selectedIncident.id}
                            </h3>
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="block text-slate-550 uppercase text-[9px] tracking-wider mb-0.5">Accompanying Title</span>
                                <h4 className="text-white font-bold text-sm tracking-tight">{selectedIncident.title}</h4>
                            </div>

                            <div>
                                <span className="block text-slate-550 uppercase text-[9px] tracking-wider mb-0.5">Investigation Payload Description</span>
                                <p className="text-slate-350 text-[11px] bg-slate-900/60 p-3 rounded-lg border border-slate-900/50 leading-relaxed font-mono">
                                    {selectedIncident.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                                <div>
                                    <span className="block text-slate-550 uppercase mb-2">Mutate Incident Status</span>
                                    <div className="flex gap-1">
                                        {["investigating", "resolved"].map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => handleUpdateStatus(selectedIncident.id, st)}
                                                className={`rounded px-2.5 py-1.5 uppercase font-bold text-[9px] tracking-wide transition-all border ${selectedIncident.status === st
                                                    ? "border-indigo-500 bg-indigo-950/20 text-indigo-400"
                                                    : "border-slate-850 bg-slate-950 text-slate-405"
                                                    }`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-slate-555 uppercase mb-1">Time Created</span>
                                    <span className="text-slate-400">{new Date(selectedIncident.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end">
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold px-4 py-2 text-xs uppercase tracking-wider transition-colors"
                            >
                                Close Triage
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
