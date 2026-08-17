import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/Teams.css";

function Teams() {
    const [teams, setTeams] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        // Get teams
        axios
            .get("http://127.0.0.1:8000/teams", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                setTeams(res.data);
            })
            .catch((err) => {
                console.log("Error fetching teams:", err);
            });

        // Get current user
        axios
            .get("http://127.0.0.1:8000/auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                setCurrentUser(res.data.user);
            })
            .catch((err) => {
                console.log("Error fetching user:", err);
            });
    }, []);

    return (
        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={currentUser} />

                <div className="teams-page">

                    {/* =========================
                        PAGE HEADER
                    ========================= */}

                    <div className="teams-header">

                        <div>
                            <h1>
                                <span className="teams-title-icon">👥</span>
                                Security Teams
                            </h1>

                            <p>
                                Manage and monitor your security operations teams.
                            </p>
                        </div>

                        <div className="team-count-badge">
                            👥 {teams.length} Teams
                        </div>

                    </div>


                    {/* =========================
                        SUMMARY CARDS
                    ========================= */}

                    <div className="team-summary-grid">

                        <div className="team-summary-card blue-card">

                            <div className="summary-icon blue-icon">
                                👥
                            </div>

                            <div>
                                <span>Total Teams</span>
                                <strong>{teams.length}</strong>
                            </div>

                        </div>


                        <div className="team-summary-card green-card">

                            <div className="summary-icon green-icon">
                                🟢
                            </div>

                            <div>
                                <span>Active Teams</span>
                                <strong>{teams.length}</strong>
                            </div>

                        </div>


                        <div className="team-summary-card purple-card">

                            <div className="summary-icon purple-icon">
                                🛡️
                            </div>

                            <div>
                                <span>Security Operations</span>
                                <strong>Active</strong>
                            </div>

                        </div>

                    </div>


                    {/* =========================
                        TEAM SECTION
                    ========================= */}

                    <div className="teams-container">

                        <div className="teams-container-header">

                            <div>
                                <h2>Our Security Teams</h2>

                                <p>
                                    Security teams responsible for monitoring,
                                    detection and incident response.
                                </p>
                            </div>

                            <div className="teams-status">
                                <span></span>
                                All Systems Active
                            </div>

                        </div>


                        {/* =========================
                            TEAM CARDS
                        ========================= */}

                        {teams.length === 0 ? (

                            <div className="no-teams">
                                <div className="no-teams-icon">
                                    👥
                                </div>

                                <h3>No Teams Found</h3>

                                <p>
                                    No security teams are currently available.
                                </p>
                            </div>

                        ) : (

                            <div className="teams-grid">

                                {teams.map((team, index) => {

                                    const teamIcons = ["🛡️", "🔐", "👥", "🚨"];

                                    const teamIcon =
                                        teamIcons[index % teamIcons.length];

                                    const colorClasses = [
                                        "team-blue",
                                        "team-purple",
                                        "team-green",
                                        "team-orange"
                                    ];

                                    const colorClass =
                                        colorClasses[index % colorClasses.length];

                                    return (

                                        <div
                                            className={`team-card ${colorClass}`}
                                            key={team.id}
                                        >

                                            {/* Card top */}
                                            <div className="team-card-top">

                                                <div className="team-icon">
                                                    {teamIcon}
                                                </div>

                                                <span className="active-badge">
                                                    <span></span>
                                                    Active
                                                </span>

                                            </div>


                                            {/* Team information */}
                                            <div className="team-card-content">

                                                <div className="team-id">
                                                    TEAM #{team.id}
                                                </div>

                                                <h3>
                                                    {team.team_name}
                                                </h3>

                                                <p>
                                                    {team.description ||
                                                        "Security operations and monitoring team."}
                                                </p>

                                            </div>


                                            {/* Card footer */}
                                            <div className="team-card-footer">

                                                <span>
                                                    🛡️ Security Operations
                                                </span>

                                                <span className="team-arrow">
                                                    →
                                                </span>

                                            </div>

                                        </div>

                                    );
                                })}

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Teams;