"use client";

import Link from "next/link";
import { ShieldAlert, Terminal, CornerDownRight } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#030712] text-slate-350 p-4">
            {/* Glow border ring ambient card container */}
            <div className="relative w-full max-w-md rounded-xl border border-slate-900 bg-slate-950/40 p-8 text-center backdrop-blur-md shadow-2xl">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex h-20 w-20 items-center justify-center rounded-full bg-red-950/30 border-2 border-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <ShieldAlert className="h-10 w-10 animate-pulse" />
                </div>

                <div className="mt-8 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl font-mono uppercase">
                        Node Disconnect (404)
                    </h2>
                    <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
                        The requested server route module or console identifier is unreachable or has been restricted by system policy.
                    </p>

                    <div className="rounded-lg bg-slate-900 border border-slate-850 p-4 text-left font-mono text-[11px] leading-relaxed text-indigo-300">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Terminal className="h-3.5 w-3.5" />
                            <span>console-trace</span>
                        </div>
                        <div className="mt-2 flex items-start gap-1">
                            <CornerDownRight className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-red-400">ERR_ROUTE_NOT_FOUND</span>
                                <span className="block text-slate-500 mt-0.5">Reference lease validation failure on gateway interface.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2.5 px-4 text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    >
                        Terminal Home Page
                    </Link>
                </div>
            </div>
        </div>
    );
}
