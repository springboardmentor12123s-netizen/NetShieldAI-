"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-105 flex">
            {/* Sidebar Navigation */}
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "pl-16" : "pl-64"
                    }`}
            >
                {/* Top Navbar */}
                <Navbar sidebarCollapsed={collapsed} setSidebarCollapsed={setCollapsed} />

                {/* Dynamic Route Content */}
                <main className="flex-1 p-6 md:p-8 bg-slate-950 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
