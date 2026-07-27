import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Activity, BarChart3, Bell, FileText, Settings as SettingsIcon, Users, Shield, Cpu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/packets", label: "Packet Monitoring", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/training", label: "Model Training", icon: Cpu },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <div className="sidebar">
      <div className="brand" style={{ marginBottom: 24, paddingLeft: 8 }}>
        <span className="brand-mark" />
        NETSHIELD AI
      </div>
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
      {user?.role === "admin" && (
        <NavLink to="/users" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
          <Users size={16} />
          User Management
        </NavLink>
      )}
      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--panel-border)" }}>
        <div className="sidebar-link" style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>
          <Shield size={14} />
          {user?.role === "admin" ? "Administrator" : "Security Analyst"}
        </div>
      </div>
    </div>
  );
}
