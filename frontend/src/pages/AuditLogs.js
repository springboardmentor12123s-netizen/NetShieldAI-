import React, { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/Dashboard.css";
import "../styles/AuditLogs.css";

function AuditLogs() {

    const [logs, setLogs] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const token = localStorage.getItem("token");

        // -----------------------------
        // Get audit logs
        // -----------------------------

        axios.get(
            "http://127.0.0.1:8000/audit/",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
        .then((res) => {

            setLogs(res.data);

            setLoading(false);

        })
        .catch((err) => {

            console.log("Audit Log Error:", err);

            setLoading(false);

        });


        // -----------------------------
        // Get current user
        // -----------------------------

        axios.get(
            "http://127.0.0.1:8000/auth/me",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
        .then((res) => {

            setCurrentUser(res.data.user);

        })
        .catch((err) => {

            console.log("User Error:", err);

        });

    }, []);


    // -----------------------------
    // Statistics
    // -----------------------------

    const totalLogs = logs.length;

    const loginLogs = logs.filter(
        log =>
            String(log.action || "")
                .toLowerCase()
                .includes("login")
    ).length;

    const userLogs = logs.filter(
        log =>
            String(log.action || "")
                .toLowerCase()
                .includes("user")
    ).length;

    const securityLogs = logs.filter(
        log => {

            const action =
                String(log.action || "").toLowerCase();

            return (
                action.includes("alert") ||
                action.includes("security") ||
                action.includes("attack")
            );

        }
    ).length;


    // -----------------------------
    // Action badge
    // -----------------------------

    const getActionClass = (action) => {

        const value =
            String(action || "").toLowerCase();

        if (value.includes("login")) {
            return "audit-action login";
        }

        if (
            value.includes("delete") ||
            value.includes("remove")
        ) {
            return "audit-action danger";
        }

        if (
            value.includes("alert") ||
            value.includes("attack") ||
            value.includes("security")
        ) {
            return "audit-action security";
        }

        if (
            value.includes("create") ||
            value.includes("register")
        ) {
            return "audit-action create";
        }

        return "audit-action default";
    };


    // -----------------------------
    // Loading
    // -----------------------------

    if (loading) {

        return (
            <div className="audit-loading">
                🔐 Loading Audit Logs...
            </div>
        );

    }


    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={currentUser} />


                {/* =========================
                    HEADER
                ========================= */}

                <div className="audit-header">

                    <div>

                        <h1>
                            📋 Audit Logs
                        </h1>

                        <p>
                            Monitor user activities and
                            security-related events
                        </p>

                    </div>


                    <div className="admin-badge">

                        🛡️ Admin Access

                    </div>

                </div>


                {/* =========================
                    STATISTICS
                ========================= */}

                <div className="audit-stats">


                    <div className="audit-stat total">

                        <div className="audit-icon">
                            📋
                        </div>

                        <div>

                            <p>Total Activities</p>

                            <h3>
                                {totalLogs}
                            </h3>

                        </div>

                    </div>


                    <div className="audit-stat login">

                        <div className="audit-icon">
                            🔐
                        </div>

                        <div>

                            <p>Login Activities</p>

                            <h3>
                                {loginLogs}
                            </h3>

                        </div>

                    </div>


                    <div className="audit-stat users">

                        <div className="audit-icon">
                            👥
                        </div>

                        <div>

                            <p>User Activities</p>

                            <h3>
                                {userLogs}
                            </h3>

                        </div>

                    </div>


                    <div className="audit-stat security">

                        <div className="audit-icon">
                            🛡️
                        </div>

                        <div>

                            <p>Security Events</p>

                            <h3>
                                {securityLogs}
                            </h3>

                        </div>

                    </div>

                </div>


                {/* =========================
                    LOG PANEL
                ========================= */}

                <div className="audit-panel">


                    <div className="audit-panel-header">

                        <div>

                            <h2>
                                📝 Activity History
                            </h2>

                            <p>
                                Recorded system and user activities
                            </p>

                        </div>


                        <div className="audit-count">

                            {totalLogs} Logs

                        </div>

                    </div>


                    {logs.length === 0 ? (

                        <div className="audit-empty">

                            <div className="audit-empty-icon">
                                📋
                            </div>

                            <h3>
                                No Audit Logs
                            </h3>

                            <p>
                                No recorded activities are
                                available yet.
                            </p>

                        </div>

                    ) : (

                        <div className="audit-table-wrapper">

                            <table className="audit-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Time
                                        </th>

                                        <th>
                                            User
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                        <th>
                                            Details
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {logs.map(
                                        (log, index) => (

                                            <tr
                                                key={
                                                    log.id ||
                                                    index
                                                }
                                            >

                                                <td>

                                                    <span className="audit-time">

                                                        🕐{" "}

                                                        {log.created_at ||
                                                         log.timestamp ||
                                                         "—"}

                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="audit-user">

                                                        <div className="audit-avatar">

                                                            {(
                                                                log.user_name ||
                                                                log.username ||
                                                                "U"
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}

                                                        </div>

                                                        <div>

                                                            <strong>

                                                                {log.user_name ||
                                                                 log.username ||
                                                                 log.user_id ||
                                                                 "User"}

                                                            </strong>

                                                            {log.email && (

                                                                <small>
                                                                    {log.email}
                                                                </small>

                                                            )}

                                                        </div>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            getActionClass(
                                                                log.action
                                                            )
                                                        }
                                                    >

                                                        {String(
                                                            log.action ||
                                                            "Activity"
                                                        )}

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="audit-details">

                                                        {log.details ||
                                                         log.description ||
                                                         log.message ||
                                                         "—"}

                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}

export default AuditLogs;