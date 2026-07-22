import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  Brain,
  ShieldAlert,
  Radar,
  Bell,
  ClipboardList,
  BarChart3,
  FileText,
  Users,
  Settings,
  Shield,
  Search,
  LogOut,
  CircleDot,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; ready?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, ready: true },

  {
    to: "/network",
    label: "Network Monitoring",
    icon: Activity,
    ready: true,
  },

  {
    to: "/teams",
    label: "Team Management",
    icon: Users,
    ready: true,
  },

  {
    to: "/audit",
    label: "Audit Logs",
    icon: ClipboardList,
    ready: true,
  },

  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    ready: true,
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">NetShield AI</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SOC Platform</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = path === n.to;
            const disabled = !n.ready;
            const cls = cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border"
                : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
              disabled && "opacity-50 cursor-not-allowed",
            );
            const inner = (
              <>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{n.label}</span>
                {disabled && (
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1 py-0.5">
                    Soon
                  </span>
                )}
                {active && <CircleDot className="h-3 w-3 text-primary pulse-dot" />}
              </>
            );
            return disabled ? (
              <div key={n.to} className={cls}>{inner}</div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link key={n.to} to={n.to as any} className={cls}>{inner}</Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="glass-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-safe pulse-dot" />
              All systems operational
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground/80 font-mono">
              v1.0.0 · edge-us-east-1
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-border/60 backdrop-blur-md bg-background/60 flex items-center gap-4 px-6">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search IPs, alerts, incidents, CVEs…"
                className="w-full h-9 rounded-lg bg-muted/40 border border-border/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-safe pulse-dot" />
            Live
            <span className="mx-2 text-border">|</span>
            <span className="font-mono">{now.toISOString().slice(11, 19)} UTC</span>
          </div>
          <button
            className="relative h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center hover:bg-accent/60"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-critical text-critical-foreground text-[10px] font-semibold flex items-center justify-center">
              7
            </span>
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-border/60">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{user?.name ?? "Analyst"}</div>
              <div className="text-[11px] text-muted-foreground">{user?.role}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
              {user?.initials ?? "NS"}
            </div>
            <button
              onClick={logout}
              className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center hover:bg-accent/60"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
