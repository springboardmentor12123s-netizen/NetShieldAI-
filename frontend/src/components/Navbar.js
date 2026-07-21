import React from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import "./Navbar.css";

function Navbar({ user }) {
    return (

        <div className="navbar">

            <div>

                <h2>NetShield AI</h2>

                <p>Security Monitoring Dashboard</p>

            </div>

            <div className="navbar-right">

                <FaBell className="nav-icon"/>

                <div className="user-info">

                    <FaUserCircle size={40}/>

                    <div>

                        <strong>{user?.full_name}</strong>

                        <p>{user?.role}</p>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default Navbar;