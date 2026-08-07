import React, { useEffect, useState } from "react";
import axios from "axios";
import LiveCharts from "../components/LiveCharts";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";


import "../styles/Dashboard.css";

function Dashboard() {

    
    const [user, setUser] = useState(null);
    const [livePrediction, setLivePrediction] = useState({
    prediction: "Waiting...",
    confidence: 0,
    risk: "Unknown",
    threat_type: "",
    recommendation: "",
    source: "",
    destination: ""
});
const [liveHistory, setLiveHistory] = useState([]);
const [liveDashboard, setLiveDashboard] = useState(null);
    useEffect(() => {

        const fetchDashboard = async () => {

            try {

                
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
        const fetchLivePrediction = async () => {

    try {

        const response = await axios.get(
            "http://127.0.0.1:8000/traffic/live"
        );

        setLivePrediction(response.data);
        const historyResponse = await axios.get(
    "http://127.0.0.1:8000/traffic/live/history"
);

setLiveHistory(historyResponse.data);
const liveDashboardResponse = await axios.get(
    "http://127.0.0.1:8000/traffic/live/dashboard"
);

setLiveDashboard(liveDashboardResponse.data);
console.log(liveDashboardResponse.data);

    } catch (error) {

        console.error("Live Prediction Error:", error);

    }

};

fetchLivePrediction();

const interval = setInterval(fetchLivePrediction, 2000);

return () => clearInterval(interval);

    }, []);

    

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

                
                
                
                <h2 style={{ marginTop: "40px" }}>
    Live Threat Detection
</h2>

<div
    style={{
        background: "#fff",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        marginTop: "20px"
    }}
>

    <p><strong>Prediction:</strong> {livePrediction.prediction}</p>

    <p><strong>Confidence:</strong> {livePrediction.confidence}%</p>

    <p><strong>Risk Level:</strong> {livePrediction.risk}</p>

    <p><strong>Threat Type:</strong> {livePrediction.threat_type}</p>

    <p><strong>Source IP:</strong> {livePrediction.source}</p>

    <p><strong>Destination IP:</strong> {livePrediction.destination}</p>

    <p><strong>Recommendation:</strong> {livePrediction.recommendation}</p>

</div>
<h2 style={{ marginTop: "40px" }}>
    Live Traffic History
</h2>

<table
    style={{
        width: "100%",
        background: "#fff",
        borderCollapse: "collapse",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        marginTop: "20px"
    }}
>

    <thead>
    <tr style={{ background: "#4F46E5", color: "white" }}>

        <th style={{ padding: "15px" }}>Time</th>

        <th style={{ padding: "15px" }}>Source IP</th>

        <th style={{ padding: "15px" }}>Destination IP</th>

        <th style={{ padding: "15px" }}>Prediction</th>

        <th style={{ padding: "15px" }}>Confidence</th>

    </tr>
</thead>
    <tbody>

        {liveHistory.map((packet, index) => (

            <tr key={index}>

    <td style={{ padding: "15px" }}>
        {packet.timestamp}
    </td>

    <td style={{ padding: "15px" }}>
        {packet.source}
    </td>

    <td style={{ padding: "15px" }}>
        {packet.destination}
    </td>

    <td
        style={{
            padding: "15px",
            color: packet.prediction === "Benign" ? "green" : "red",
            fontWeight: "bold"
        }}
    >
        {packet.prediction}
    </td>

    <td style={{ padding: "15px" }}>
        {packet.confidence}%
    </td>

</tr>

        ))}

    </tbody>

</table>


{liveDashboard && (
    
<>
<h2 style={{ marginTop: "40px" }}>
    📡 Live Network Analytics Dashboard
</h2>

<div className="cards">

    <StatCard
        title="Total Live Packets"
        value={liveDashboard.total_packets}
    />

    <StatCard
        title="Benign Packets"
        value={liveDashboard.predictions.Benign || 0}
    />

    <StatCard
        title="Attack Packets"
        value={
            liveDashboard.total_packets -
            (liveDashboard.predictions.Benign || 0)
        }
    />

    <StatCard
    title="TCP Packets"
    value={liveDashboard.protocols["TCP"]}
 />

<StatCard
    title="TLS Packets"
    value={liveDashboard.protocols["TLS"]}
 />

<StatCard
    title="DNS Packets"
    value={liveDashboard.protocols["DNS"]}
 />

<StatCard
    title="UDP Packets"
    value={liveDashboard.protocols["UDP"] || 0}
 />
</div>
<LiveCharts liveDashboard={liveDashboard} />
</>
)}

            </div>

        </div>

    );

}

            
export default Dashboard;
