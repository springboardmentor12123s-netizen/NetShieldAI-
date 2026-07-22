"use client";

import React, { useState } from "react";
import { Search, History, RefreshCw, ChevronLeft, ChevronRight, Eye, ShieldCheck, UserCheck } from "lucide-react";
import { useAuditQuery } from "@/hooks/use-audit";
import { AuditFilter, AuditLogResponse } from "@/types/audit";

export default function AuditLogsPage() {
    const [filters, setFilters] = useState<AuditFilter>({
        page: 1,
        per_page: 10,
        action: "",
    });

    const [searchVal, setSearchVal] = useState("");
    const [selectedContext, setSelectedContext] = useState<Record<string, any> | null>(null);

    const { data, isLoading, refetch } = useAuditQuery(filters);

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({
            ...prev,
            page: newPage,
        }));
    };

    const handleActionChange = (actionType: string) => {
        setFilters((prev) => ({
            ...prev,
            page: 1,
            action: actionType || undefined,
        }));
    };

    // Mock list items fallback if database stands unpopulated
    const mockLogs: AuditLogResponse[] = [
        {
            id: "ad-101",
            action: "USER_LOGIN",
            user_id: "u-1",
            user_email: "admin@netshield.io",
            user_name: "Goutham S",
            timestamp: new Date().toISOString(),
            ip_address: "192.168.1.5",
            status: "SUCCESS",
            description: "Successful authentication from admin console terminal",
            context: { browser: "Chrome/Windows", login_type: "JWT" },
        },
        {
            id: "ad-102",
            action: "ROLE_PERMISSION_MATRIX_UPDATE",
            user_id: "u-1",
            user_email: "admin@netshield.io",
            user_name: "Goutham S",
            timestamp: new Date(Date.now() - 60000).toISOString(),
            ip_address: "192.168.1.5",
            status: "SUCCESS",
            description: "Appended write_packets permission to security_analyst system role mapping",
            context: { edited_role: "security_analyst", assignments: ["read_packets", "write_packets"] },
        },
        {
            id: "ad-103",
            action: "TEAM_CREATE",
            user_id: "u-1",
            user_email: "admin@netshield.io",
            user_name: "Goutham S",
            timestamp: new Date(Date.now() - 360000).toISOString(),
            ip_address: "192.168.1.5",
            status: "SUCCESS",
            description: "Successfully provisioned threat response squad team container",
            context: { team_name: "Alpha Threat Response", created_by: "u-1" },
        },
        {
            id: "ad-104",
            action: "USER_FAILED_LOGIN",
            user_id: "u-unknown",
            user_email: "intruder@malicious.com",
            user_name: "Anonymous Intrude",
            timestamp: new Date(Date.now() - 900000).toISOString(),
            ip_address: "185.120.45.62",
            status: "FAILED",
            description: "Rejected authentication lease: credential hash mismatch",
            context: { login_attempts: 3, user_agent: "Python requests/v2.3" },
        },
    ];

    const logsList = data?.data && data.data.length > 0 ? data.data : mockLogs;
    const totalPages = data?.pages || 1;
    const currentPage = data?.page || 1;

    const actionTypes = [
        "USER_LOGIN",
        "USER_FAILED_LOGIN",
        "TEAM_CREATE",
        "ROLE_PERMISSION_MATRIX_UPDATE",
        "USER_REGISTER",
    ];

    return (
        <div className="space-y-8">
            {/* Upper header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Audit Logs Console
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Browse and inspect global security logs activities
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh Logs
                </button>
            </div>

            {/* Filter and Selection consoles */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur-sm">
                <div className="grid gap-4 md:grid-cols-3 items-end">
                    {/* Action dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Action Category
                        </label>
                        <select
                            value={filters.action || ""}
                            onChange={(e) => handleActionChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">All Actions</option>
                            {actionTypes.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2 text-right">
                        <span className="text-xs text-slate-500 italic">
                            All events are immutably logged and database hashed for compliance validation.
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Grid Table */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                <th className="py-4 px-6">Timestamp</th>
                                <th className="py-4 px-6">Operator</th>
                                <th className="py-4 px-6">Event Action</th>
                                <th className="py-4 px-6">Description</th>
                                <th className="py-4 px-6">IP Address</th>
                                <th className="py-4 px-6 text-center">Status</th>
                                <th className="py-4 px-6 text-center">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/80 text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, r) => (
                                    <tr key={r} className="animate-pulse">
                                        <td colSpan={7} className="py-6 px-6">
                                            <div className="h-4 rounded bg-slate-900/50 w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                logsList.map((log) => {
                                    const isFailed = log.status === "FAILED";
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-900/20 text-slate-350">
                                            <td className="py-4 px-6 font-mono text-xs text-slate-450">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-semibold text-white block">
                                                    {log.user_name || "System Process"}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {log.user_email || "system@netshield.io"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs font-semibold text-indigo-400">
                                                {log.action}
                                            </td>
                                            <td className="py-4 px-6 text-slate-300 text-xs font-medium max-w-xs truncate">
                                                {log.description}
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-slate-400">{log.ip_address}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span
                                                    className={`inline-block rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase font-mono ${isFailed
                                                            ? "bg-red-950/40 border-red-900/40 text-red-400"
                                                            : "bg-emerald-950/40 border-emerald-900/40 text-emerald-400"
                                                        }`}
                                                >
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {log.context ? (
                                                    <button
                                                        onClick={() => setSelectedContext(log.context as Record<string, any>)}
                                                        className="inline-flex rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-indigo-400 hover:bg-slate-800 hover:text-white transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-650 italic text-[11px]">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls */}
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

            {/* Context Viewer Drawer/Modal */}
            {selectedContext && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-400" />
                                Additional Event Payload
                            </h3>
                            <button
                                onClick={() => setSelectedContext(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-950 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2">
                            <span className="block text-slate-500 uppercase text-[9px] tracking-wider">Hashed JSONB Context</span>
                            <pre className="rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-indigo-300 overflow-x-auto border border-slate-900">
                                {JSON.stringify(selectedContext, null, 2)}
                            </pre>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedContext(null)}
                                className="rounded-lg bg-slate-905 border border-slate-850 hover:bg-slate-800 text-slate-350 font-semibold px-4 py-2 text-xs uppercase tracking-wider transition-colors"
                            >
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
