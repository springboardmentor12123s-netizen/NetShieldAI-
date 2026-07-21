import React, { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import Charts from "../components/Charts";

import "../styles/Dashboard.css";

function Dashboard() {

    const [dashboardData, setDashboardData] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {

        const fetchDashboard = async () => {

            try {

                const dashboardResponse = await axios.get(
                    "http://127.0.0.1:8000/traffic/dashboard"
                );

                setDashboardData(dashboardResponse.data);

                const token = localStorage.getItem("token");

                if (token) {

                    const userResponse = await axios.get(
                        "http://127.0.0.1:8000/auth/me",
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    setUser(userResponse.data.user);

                }

            } catch (error) {

                console.error(error);

            }

        };

        fetchDashboard();

    }, []);

    if (!dashboardData) {

        return (
            <div style={{ padding: "40px" }}>
                <h2>Loading Dashboard...</h2>
            </div>
        );

    }

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={user} />

                <div className="profile-card">

                    <h2>
                        Welcome, {user ? user.full_name : "User"} 👋
                    </h2>

                    <p>
                        <strong>Email:</strong>{" "}
                        {user ? user.email : "Loading..."}
                    </p>

                    <p>
                        <strong>Role:</strong>{" "}
                        {user ? user.role : "Loading..."}
                    </p>

                </div>

                <h2>Traffic Analytics Dashboard</h2>

                <div className="cards">

                    <StatCard
                        title="Total Records"
                        value={dashboardData.total_records}
                    />

                    <StatCard
                        title="TCP Packets"
                        value={dashboardData.protocols.TCP}
                    />

                    <StatCard
                        title="UDP Packets"
                        value={dashboardData.protocols.UDP}
                    />

                    <StatCard
                        title="Other Protocols"
                        value={dashboardData.protocols.Other}
                    />

                    <StatCard
                        title="Attack Types"
                        value={Object.keys(dashboardData.attacks).length}
                    />

                </div>

                <Charts dashboardData={dashboardData} />

                <h2 style={{ marginTop: "40px" }}>
                    Recent Attack Summary
                </h2>

                <table
                    style={{
                        width: "100%",
                        background: "#fff",
                        borderCollapse: "collapse",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 2px 10px rgba(0,0,0,.1)"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background: "#4F46E5",
                                color: "white"
                            }}
                        >

                            <th style={{ padding: "15px" }}>
                                Attack Type
                            </th>

                            <th style={{ padding: "15px" }}>
                                Count
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {Object.entries(dashboardData.attacks).map(
                            ([attack, count]) => (

                                <tr
                                    key={attack}
                                    style={{
                                        borderBottom: "1px solid #ddd"
                                    }}
                                >

                                    <td style={{ padding: "15px" }}>
                                        {attack}
                                    </td>

                                    <td style={{ padding: "15px" }}>
                                        {count}
                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>

                </table>

                <h2 style={{ marginTop: "40px" }}>
                    Network Statistics
                </h2>

                <div className="cards">

                    <StatCard
                        title="Avg Flow Duration"
                        value={dashboardData.statistics.average_flow_duration.toFixed(2)}
                    />

                    <StatCard
                        title="Avg Packet Length"
                        value={dashboardData.statistics.average_packet_length.toFixed(2)}
                    />

                    <StatCard
                        title="Flow Bytes/sec"
                        value={dashboardData.statistics.average_flow_bytes_per_sec.toFixed(2)}
                    />

                    <StatCard
                        title="Flow Packets/sec"
                        value={dashboardData.statistics.average_flow_packets_per_sec.toFixed(2)}
                    />

                </div>

            </div>

        </div>

    );

}

export default Dashboard;