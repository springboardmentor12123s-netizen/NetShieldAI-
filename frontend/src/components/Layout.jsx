import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";
import { initials } from "../lib/format";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", group: "Monitor", icon: "grid" },
  { to: "/traffic", label: "Traffic Monitoring", group: "Monitor", icon: "activity" },
  { to: "/anomaly-detection", label: "Anomaly Detection", group: "Detect", icon: "radar" },
  { to: "/alerts", label: "Alerts", group: "Detect", icon: "bell" },
  { to: "/reports", label: "Reports", group: "Detect", icon: "score" },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = [...new Set(NAV_ITEMS.map((i) => i.group))];

  function handleLogout() {
    logout();
    navigate("/login?loggedout=true");
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">NetShield AI</div>
          <div className="brand-sub">Threat Monitoring</div>
        </div>
      </div>

      {/* Navigation */}
      <nav>
        {groups.map((group) => (
          <div className="nav-group" key={group}>
            <div className="nav-label">{group}</div>
            {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                {Icon[item.icon]}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer — user info + logout */}
      <div className="sidebar-footer">
        <div className="avatar">{initials(user?.full_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">
            {user?.full_name || "Unknown"}
          </div>
          <div className="sidebar-user-role">
            {(user?.role || "").replace("_", " ")}
          </div>
        </div>

        <button
          className="logout-btn"
          title="Sign out"
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.08)",
            color: "rgba(252,165,165,1)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.20)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)";
            e.currentTarget.style.color = "rgba(254,202,202,1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
            e.currentTarget.style.color = "rgba(252,165,165,1)";
          }}
        >
          {Icon.logout}
        </button>
      </div>
    </aside>
  );
}

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}