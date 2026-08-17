import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";
import "../styles/Users.css";

function Users() {

    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem("token");

        axios.get("http://127.0.0.1:8000/users", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((res) => {
            setUsers(res.data.users);
        })
        .catch((err) => {
            console.log(err);
        });

        axios.get("http://127.0.0.1:8000/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((res) => {
            setCurrentUser(res.data.user);
        })
        .catch((err) => {
            console.log(err);
        });

    }, []);

    // -----------------------------
    // Statistics
    // -----------------------------

    const totalUsers = users.length;

    const adminUsers = users.filter(
        user => user.role === "Admin"
    ).length;

    const analystUsers = users.filter(
        user => user.role === "Security Analyst"
    ).length;

    const assignedUsers = users.filter(
        user => user.team_id
    ).length;

    // -----------------------------
    // Role Badge
    // -----------------------------

    const getRoleClass = (role) => {

        if (role === "Admin") {
            return "user-role admin-role";
        }

        if (role === "Security Analyst") {
            return "user-role analyst-role";
        }

        return "user-role default-role";
    };

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={currentUser} />

                {/* =========================
                    PAGE HEADER
                ========================= */}

                <div className="users-header">

                    <div>

                        <h2>👥 User Management</h2>

                        <p>
                            Manage registered security team members
                        </p>

                    </div>

                </div>


                {/* =========================
                    STATISTICS
                ========================= */}

                <div className="users-stats">

                    {/* Total Users */}

                    <div className="user-stat-card total-users">

                        <div className="stat-icon">
                            👥
                        </div>

                        <div>

                            <p>Total Users</p>

                            <h3>{totalUsers}</h3>

                        </div>

                    </div>


                    {/* Admins */}

                    <div className="user-stat-card admin-users">

                        <div className="stat-icon">
                            👑
                        </div>

                        <div>

                            <p>Administrators</p>

                            <h3>{adminUsers}</h3>

                        </div>

                    </div>


                    {/* Security Analysts */}

                    <div className="user-stat-card analyst-users">

                        <div className="stat-icon">
                            🛡️
                        </div>

                        <div>

                            <p>Security Analysts</p>

                            <h3>{analystUsers}</h3>

                        </div>

                    </div>


                    {/* Assigned Users */}

                    <div className="user-stat-card assigned-users">

                        <div className="stat-icon">
                            👥
                        </div>

                        <div>

                            <p>Team Assigned</p>

                            <h3>{assignedUsers}</h3>

                        </div>

                    </div>

                </div>


                {/* =========================
                    USERS TABLE
                ========================= */}

                <div className="users-panel">

                    <div className="users-panel-header">

                        <div>

                            <h3>Registered Users</h3>

                            <p>
                                Users currently registered in NetShield AI
                            </p>

                        </div>

                        <div className="users-count">
                            {totalUsers} Users
                        </div>

                    </div>


                    {users.length === 0 ? (

                        <div className="no-users">

                            <div className="no-users-icon">
                                👥
                            </div>

                            <h3>No Users Found</h3>

                            <p>
                                No registered users are available.
                            </p>

                        </div>

                    ) : (

                        <div className="users-table-wrapper">

                            <table className="users-table">

                                <thead>

                                    <tr>

                                        <th>User</th>

                                        <th>Email</th>

                                        <th>Role</th>

                                        <th>Team</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {users.map((user) => (

                                        <tr key={user.id}>

                                            {/* User */}

                                            <td>

                                                <div className="user-info">

                                                    <div className="user-avatar">
                                                        {user.full_name
                                                            ? user.full_name
                                                                .charAt(0)
                                                                .toUpperCase()
                                                            : "U"}
                                                    </div>

                                                    <div>

                                                        <div className="user-name">
                                                            {user.full_name}
                                                        </div>

                                                        <div className="user-id">
                                                            User ID: {user.id}
                                                        </div>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* Email */}

                                            <td>

                                                <span className="user-email">
                                                    ✉️ {user.email}
                                                </span>

                                            </td>


                                            {/* Role */}

                                            <td>

                                                <span
                                                    className={getRoleClass(
                                                        user.role
                                                    )}
                                                >

                                                    {user.role === "Admin"
                                                        ? "👑"
                                                        : "🛡️"}

                                                    {" "}

                                                    {user.role}

                                                </span>

                                            </td>


                                            {/* Team */}

                                            <td>

                                                {user.team_id ? (

                                                    <span className="team-badge">
                                                        👥 Team {user.team_id}
                                                    </span>

                                                ) : (

                                                    <span className="no-team">
                                                        Not Assigned
                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}

export default Users;