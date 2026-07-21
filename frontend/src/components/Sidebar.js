import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserFriends,
  FaNetworkWired,
  FaChartBar,
  FaRobot,
  FaSignOutAlt
} from "react-icons/fa";

import "./Sidebar.css";

function Sidebar() {

  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (

    <div className="sidebar">

      <h2 className="logo">NetShield AI</h2>

      <ul>

        <li
          className={location.pathname === "/dashboard" ? "active" : ""}
          onClick={() => navigate("/dashboard")}
        >
          <FaTachometerAlt />
          <span>Dashboard</span>
        </li>

        <li
          className={location.pathname === "/users" ? "active" : ""}
          onClick={() => navigate("/users")}
        >
          <FaUsers />
          <span>Users</span>
        </li>

        <li
          className={location.pathname === "/teams" ? "active" : ""}
          onClick={() => navigate("/teams")}
        >
          <FaUserFriends />
          <span>Teams</span>
        </li>

        <li
          className={location.pathname === "/monitoring" ? "active" : ""}
          onClick={() => navigate("/monitoring")}
        >
          <FaNetworkWired />
          <span>Monitoring</span>
        </li>

        <li
          className={location.pathname === "/analytics" ? "active" : ""}
          onClick={() => navigate("/analytics")}
        >
          <FaChartBar />
          <span>Analytics</span>
        </li>

        <li
          className={location.pathname === "/ai" ? "active" : ""}
          onClick={() => navigate("/ai")}
        >
          <FaRobot />
          <span>AI Dashboard</span>
        </li>

      </ul>

      <button className="logout-btn" onClick={logout}>
        <FaSignOutAlt />
        Logout
      </button>

    </div>

  );

}

export default Sidebar;