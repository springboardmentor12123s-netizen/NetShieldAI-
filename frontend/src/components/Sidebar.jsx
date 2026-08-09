import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar({ collapsed, toggleSidebar }) {

  return (

    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>

      <div
    className="logo-section"
    onClick={toggleSidebar}
>

    <div className="logo-icon">
        🛡
    </div>

    {!collapsed && (

        <div className="logo-text">

            <h3>NetShield AI</h3>

            <p>AI Threat Intelligence</p>

        </div>

    )}

</div>

      <nav className="menu">

        <NavLink to="/dashboard" className="menu-item">
          <span>📊</span>
          {!collapsed && "Dashboard"}
        </NavLink>

        <NavLink to="/traffic" className="menu-item">
          <span>📡</span>
          {!collapsed && "Traffic"}
        </NavLink>

        <NavLink to="/datasets" className="menu-item">
          <span>📂</span>
          {!collapsed && "Datasets"}
        </NavLink>

        <NavLink to="/workflow" className="menu-item">
          <span>🤖</span>
          {!collapsed && "Workflow"}
        </NavLink>

        <NavLink to="/attack-visualization" className="menu-item">
          <span>📊</span>
          {!collapsed && "Attack Analytics"}
        </NavLink>

        <NavLink to="/alerts" className="menu-item">
          <span>🚨</span>
          {!collapsed && "Alerts"}
        </NavLink>

        <NavLink to="/settings" className="menu-item">
          <span>⚙</span>
          {!collapsed && "Settings"}
        </NavLink>

      </nav>

      <div className="logout-section">

        <NavLink to="/" className="logout-btn">

          🚪 {!collapsed && "Logout"}

        </NavLink>

      </div>

    </aside>

  );

}

export default Sidebar;