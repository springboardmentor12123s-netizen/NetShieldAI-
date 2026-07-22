"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/theme-provider";
import {
    Sun,
    Moon,
    Menu,
    Bell,
    CheckCircle,
    ShieldAlert
} from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

export function Navbar({
    sidebarCollapsed,
    setSidebarCollapsed
}: {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (value: boolean) => void;
}) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [alertsCount, setAlertsCount] = React.useState(0);

    // Monitor live alerts to display count badge
    useWebSocket("security_alerts", (alert: any) => {
        if (alert.severity === "high" || alert.severity === "critical") {
            setAlertsCount((prev) => prev + 1);
        }
    });

    const getBreadcrumbs = () => {
        const paths = pathname.split("/").filter(Boolean);
        if (paths.length === 0) return "Dashboard Overview";
        return paths
            .map((path) => path.charAt(0).toUpperCase() + path.slice(1).replace("-", " "))
            .join(" / ");
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-900 bg-slate-950/70 px-6 backdrop-blur-md">
            {/* Top Left Breadcrumbs & Toggle */}
            <div className="flex items-center gap-4">
                {sidebarCollapsed && (
                    <button
                        onClick={() => setSidebarCollapsed(false)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                )}
                <h1 className="text-sm font-semibold tracking-wide text-white">
                    {getBreadcrumbs()}
                </h1>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-4">
                {/* Live Socket Status */}
                <div className="hidden items-center gap-2 rounded-full bg-emerald-950/40 px-3 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-900/30 sm:flex">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    Live Feed Active
                </div>

                {/* Notifications and Alerts */}
                <button className="relative rounded-md p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
                    <Bell className="h-5 w-5" />
                    {alertsCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white">
                            {alertsCount}
                        </span>
                    )}
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-905 hover:text-white transition-colors"
                >
                    {theme === "dark" ? (
                        <Sun className="h-5 w-5 text-amber-400" />
                    ) : (
                        <Moon className="h-5 w-5 text-indigo-400" />
                    )}
                </button>
            </div>
        </header>
    );
}
export default Navbar;
