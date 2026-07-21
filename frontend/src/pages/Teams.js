import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

function Teams() {

    const [teams, setTeams] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem("token");

        axios.get("http://127.0.0.1:8000/teams", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((res) => {
            setTeams(res.data);
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
        });

    }, []);

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={currentUser} />

                <h2>Security Teams</h2>

                <table
                    style={{
                        width: "100%",
                        background: "#fff",
                        borderCollapse: "collapse",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background: "#4F46E5",
                                color: "white"
                            }}
                        >

                            <th style={{ padding: "15px", textAlign: "center" }}>ID</th>

                            <th style={{ padding: "15px", textAlign: "left" }}>Team Name</th>

                            <th style={{ padding: "15px", textAlign: "left" }}>Description</th>

                        </tr>

                    </thead>

                    <tbody>

                        {teams.map((team) => (

                            <tr
                                key={team.id}
                                style={{
                                    borderBottom: "1px solid #ddd"
                                }}
                            >

                                <td
                                    style={{
                                        padding: "15px",
                                        textAlign: "center"
                                    }}
                                >
                                    {team.id}
                                </td>

                                <td style={{ padding: "15px" }}>
                                    {team.team_name}
                                </td>

                                <td style={{ padding: "15px" }}>
                                    {team.description}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default Teams;