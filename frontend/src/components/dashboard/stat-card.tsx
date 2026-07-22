"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: "increase" | "decrease" | "neutral";
    icon: LucideIcon;
    color?: "indigo" | "emerald" | "amber" | "red" | "cyan";
}

export function StatCard({
    title,
    value,
    change,
    changeType = "neutral",
    icon: Icon,
    color = "indigo",
}: StatCardProps) {
    const colorMap = {
        indigo: {
            bg: "bg-indigo-950/20 border-indigo-500/20 text-indigo-400",
            glow: "group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] group-hover:border-indigo-500/40",
        },
        emerald: {
            bg: "bg-emerald-950/20 border-emerald-500/20 text-emerald-400",
            glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/40",
        },
        amber: {
            bg: "bg-amber-950/20 border-amber-500/20 text-amber-400",
            glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:border-amber-500/40",
        },
        red: {
            bg: "bg-red-950/20 border-red-500/20 text-red-400",
            glow: "group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] group-hover:border-red-500/40",
        },
        cyan: {
            bg: "bg-cyan-950/20 border-cyan-500/20 text-cyan-400",
            glow: "group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:border-cyan-500/40",
        },
    }[color];

    return (
        <div
            className={`group relative rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm transition-all duration-300 ${colorMap.glow}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {title}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${colorMap.bg}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
                {change && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <span
                            className={`font-semibold ${changeType === "increase"
                                    ? "text-emerald-400"
                                    : changeType === "decrease"
                                        ? "text-red-400"
                                        : "text-slate-400"
                                }`}
                        >
                            {change}
                        </span>
                        since last scan
                    </p>
                )}
            </div>
        </div>
    );
}
export default StatCard;
