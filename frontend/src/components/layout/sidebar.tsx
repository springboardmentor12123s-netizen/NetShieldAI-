"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
    LayoutDashboard,
    Activity,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Brain,
    TrendingUp,
    Bell,
    Globe,
    User,
    Layers,
    ClipboardList,
    ShieldAlert,
    FileText
} from "lucide-react";

interface SidebarItem {
    name: string;
    href: string;
    icon: React.ElementType;
    roles?: string[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Network Monitoring", href: "/network-monitoring", icon: Activity, roles: ["admin", "security_analyst"] },
    { name: "AI Detection", href: "/ai-detection", icon: Brain, roles: ["admin", "security_analyst"] },
    { name: "Threat Prediction", href: "/threat-prediction", icon: TrendingUp, roles: ["admin", "security_analyst"] },
    { name: "Threat Classification", href: "/threat-classification", icon: Layers, roles: ["admin", "security_analyst"] },
    { name: "Detection Reports", href: "/detection-reports", icon: ClipboardList, roles: ["admin", "security_analyst"] },
    { name: "Alert Management", href: "/alert-management", icon: Bell, roles: ["admin", "security_analyst", "analyst"] },
    { name: "Incident Management", href: "/incident-management", icon: ShieldAlert, roles: ["admin", "security_analyst", "analyst"] },
    { name: "Threat Intelligence", href: "/threat-intelligence", icon: Globe, roles: ["admin", "security_analyst"] },
    { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin", "security_analyst"] },
    { name: "Reports", href: "/reports", icon: FileText, roles: ["admin", "security_analyst"] },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings }
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const filteredItems = SIDEBAR_ITEMS.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <aside
            className={`fixed top-0 bottom-0 left-0 z-20 flex flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 ${collapsed ? "w-16" : "w-64"
                }`}
        >
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-900">
                <NextLink href="/dashboard" className="flex items-center gap-2.5 font-bold text-white overflow-hidden">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/40 bg-indigo-950/30 text-indigo-400">
                        <Brain className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                    {!collapsed && (
                        <span className="text-sm font-semibold tracking-wide">
                            NetShield <span className="text-indigo-400">AI</span>
                        </span>
                    )}
                </NextLink>
                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
                {collapsed && (
                    <div className="flex justify-center pb-4">
                        <button
                            onClick={() => setCollapsed(false)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {filteredItems.map((item) => {
                    const isParentActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <NextLink
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isParentActive
                                ? "bg-indigo-650/10 text-indigo-400 border-l border-indigo-500 font-semibold"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            <Icon className={`h-4.5 w-4.5 shrink-0 ${isParentActive ? "text-indigo-405" : "text-slate-450"}`} />
                            {!collapsed && <span>{item.name}</span>}
                        </NextLink>
                    );
                })}
            </nav>

            {/* Sidebar Footer User Section */}
            <div className="border-t border-slate-900 p-4">
                {user && !collapsed && (
                    <div className="mb-4 rounded-lg bg-slate-900/40 p-3 border border-slate-800/20">
                        <p className="truncate text-xs font-semibold text-white">{user.full_name}</p>
                        <p className="truncate text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-0.5">
                            {user.role}
                        </p>
                    </div>
                )}

                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
                >
                    <LogOut className="h-4.5 w-4.5 shrink-0" />
                    {!collapsed && <span>System Logout</span>}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
