"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Activity, BarChart3, FileText, LayoutDashboard, LogOut, Server, ShieldAlert } from "lucide-react";

interface AppShellProps {
  role: string | null;
  title: string;
  activePath: string;
  onLogout: () => void;
  children: ReactNode;
}

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "User Management", icon: Server },
  { href: "/alerts", label: "Alerts", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
];

export default function AppShell({ role, title, activePath, onLogout, children }: AppShellProps) {
  const pathname = usePathname();
  const currentPath = pathname || activePath;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white">
      <aside className="hidden w-64 flex-col border-r border-gray-800 bg-gray-900 md:flex">
        <div className="border-b border-gray-800 p-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-blue-500">
            <ShieldAlert size={28} /> NetShield AI
          </h2>
          <p className="mt-1 text-xs uppercase tracking-wider text-gray-400">{role ?? "SOC"} Portal</p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950 p-6">
          <h1 className="text-2xl font-semibold text-gray-100">{title}</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300 transition-all duration-200 hover:border-red-500 hover:bg-red-600 hover:text-white"
          >
            <LogOut size={18} /> Log Out
          </button>
        </header>

        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
