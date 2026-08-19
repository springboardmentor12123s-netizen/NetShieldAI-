import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Bell,
  FileText,
  Settings as SettingsIcon,
  Users,
  Shield,
  Cpu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/packets",
    label: "Packet Monitoring",
    icon: Activity,
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: Bell,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: FileText,
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  console.log("SIDEBAR USER:", user);

  return (
    <div className="sidebar">

      {/* Brand */}
      <div
        className="brand"
        style={{
          marginBottom: 24,
          paddingLeft: 8,
        }}
      >
        <span className="brand-mark" />
        NETSHIELD AI
      </div>

      {/* Common links */}
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}

      {/* Admin-only links */}
      {user?.role === "admin" && (
        <>
          {/* Model Training */}
          <NavLink
            to="/training"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <Cpu size={16} />
            Model Training
          </NavLink>

          {/* Settings */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <SettingsIcon size={16} />
            Settings
          </NavLink>

          {/* User Management */}
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <Users size={16} />
            User Management
          </NavLink>
        </>
      )}

      {/* Current Role */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px solid var(--panel-border)",
        }}
      >
        <div
          className="sidebar-link"
          style={{
            color: "var(--text-dim)",
            fontSize: "0.72rem",
            cursor: "default",
          }}
        >
          <Shield size={14} />

          {user?.role === "admin"
            ? "Administrator"
            : "Security Analyst"}
        </div>
      </div>

    </div>
  );
}