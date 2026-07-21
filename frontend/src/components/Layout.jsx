import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";
import { initials } from "../lib/format";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", group: "Monitor", icon: "grid" },
  { to: "/traffic", label: "Traffic Monitoring", group: "Monitor", icon: "activity" },
  { to: "/anomaly-detection", label: "Anomaly Detection", group: "Detect", icon: "radar" },
  { to: "/alerts", label: "Alerts", group: "Detect", icon: "bell" },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = [...new Set(NAV_ITEMS.map((i) => i.group))];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">NetShield AI</div>
          <div className="brand-sub">Threat Monitoring</div>
        </div>
      </div>

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

      <div className="sidebar-footer">
        <div className="avatar">{initials(user?.full_name)}</div>
        <div>
          <div className="sidebar-user-name">{user?.full_name || "Unknown"}</div>
          <div className="sidebar-user-role">{(user?.role || "").replace("_", " ")}</div>
        </div>
        <button className="logout-btn" title="Log out" onClick={handleLogout}>
          {Icon.logout}
        </button>
      </div>
    </aside>
  );
}

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
