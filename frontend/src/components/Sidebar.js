import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  FaTachometerAlt,
  FaUsers,
  FaUserFriends,
  FaNetworkWired,
  FaChartBar,
  FaRobot,
  FaHeartbeat,
  FaBell,
  FaFileAlt,
  FaClipboardList,
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

      <h2 className="logo">
        NetShield AI
      </h2>


      <ul>


        {/* Dashboard */}

        <li
          className={
            location.pathname === "/dashboard"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/dashboard")
          }
        >

          <FaTachometerAlt />

          <span>
            Dashboard
          </span>

        </li>


        {/* Users */}

        <li
          className={
            location.pathname === "/users"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/users")
          }
        >

          <FaUsers />

          <span>
            Users
          </span>

        </li>


        {/* Teams */}

        <li
          className={
            location.pathname === "/teams"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/teams")
          }
        >

          <FaUserFriends />

          <span>
            Teams
          </span>

        </li>


        {/* Monitoring */}

        <li
          className={
            location.pathname === "/monitoring"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/monitoring")
          }
        >

          <FaNetworkWired />

          <span>
            Monitoring
          </span>

        </li>


        {/* Analytics */}

        <li
          className={
            location.pathname === "/analytics"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/analytics")
          }
        >

          <FaChartBar />

          <span>
            Analytics
          </span>

        </li>


        {/* AI Dashboard */}

        <li
          className={
            location.pathname === "/ai"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/ai")
          }
        >

          <FaRobot />

          <span>
            AI Dashboard
          </span>

        </li>


        {/* Health Validation */}

        <li
          className={
            location.pathname === "/health-validation"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/health-validation")
          }
        >

          <FaHeartbeat />

          <span>
            Health Validation
          </span>

        </li>


        {/* Alerts */}

        <li
          className={
            location.pathname === "/alerts"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/alerts")
          }
        >

          <FaBell />

          <span>
            Alerts
          </span>

        </li>


        {/* Threat Report */}

        <li
          className={
            location.pathname === "/report"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/report")
          }
        >

          <FaFileAlt />

          <span>
            Threat Report
          </span>

        </li>


        {/* Audit Logs */}

        <li
          className={
            location.pathname === "/audit"
              ? "active"
              : ""
          }

          onClick={() =>
            navigate("/audit")
          }
        >

          <FaClipboardList />

          <span>
            Audit Logs
          </span>

        </li>


      </ul>


      {/* Logout */}

      <button
        className="logout-btn"
        onClick={logout}
      >

        <FaSignOutAlt />

        Logout

      </button>

    </div>

  );

}

export default Sidebar;