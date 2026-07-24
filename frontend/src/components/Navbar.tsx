import { Link, useRouter } from "@tanstack/react-router";
import { Shield, LogOut, Activity } from "lucide-react";
import { AuthAPI } from "@/lib/api";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/network", label: "Network Monitoring" },
  { to: "/alerts", label: "Alerts" },
  { to: "/ai", label: "AI Detection" },
  { to: "/analytics", label: "Analytics" },
] as const;

export function Navbar() {
  const router = useRouter();

  const onLogout = () => {
    AuthAPI.logout();
    router.navigate({ to: "/login" });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__brand-mark">
          <Shield size={13} strokeWidth={2.4} />
        </span>

        <span>Dashboard</span>
      </div>

      <nav className="navbar__nav">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="navbar__link"
            activeProps={{ className: "navbar__link is-active" }}
            activeOptions={{ exact: item.to === "/" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="navbar__spacer" />

      <div className="navbar__meta">
        <span className="navbar__pill">
          <span className="dot" /> Live
        </span>

        <span className="navbar__pill">
          <Activity size={12} /> Sensors 4/4
        </span>
      </div>

      <button
        className="navbar__logout"
        onClick={onLogout}
        aria-label="Logout"
      >
        <LogOut size={13} /> Logout
      </button>
    </header>
  );
}