import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Charts from "../components/Charts";
import "../styles/Dashboard.css";

function Analytics() {

    const [dashboardData, setDashboardData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem("token");

        axios.get("http://127.0.0.1:8000/traffic/dashboard")
        .then((res) => {
            setDashboardData(res.data);
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

    if (!dashboardData) {
        return <h2>Loading...</h2>;
    }

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={currentUser} />

                <h2>Network Analytics</h2>

                <Charts dashboardData={dashboardData} />

                <h2 style={{ marginTop: "40px" }}>
                    Attack Summary
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
                            <th style={{ padding: "15px" }}>Attack Type</th>
                            <th style={{ padding: "15px" }}>Count</th>
                        </tr>

                    </thead>

                    <tbody>

                        {Object.entries(dashboardData.attacks).map(
                            ([attack, count]) => (

                                <tr key={attack}>

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

            </div>

        </div>

    );

}

export default Analytics;