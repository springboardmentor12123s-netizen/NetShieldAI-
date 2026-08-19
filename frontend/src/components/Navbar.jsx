import React from "react";
import { Link } from "react-router-dom";
import { LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="navbar" style={{ marginBottom: 24 }}>
      <div className="display" style={{ fontSize: "0.95rem", color: "var(--text-dim)" }}>
        {user?.full_name ? `Welcome back, ${user.full_name}` : user?.username ? `Welcome back, ${user.username}` : ""}
      </div>
      <div className="nav-links" style={{ alignItems: "center" }}>
        <Link to="/profile" className="icon-btn" title="Profile">
          <UserCircle size={16} />
        </Link>
        <button className="logout-btn" onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
