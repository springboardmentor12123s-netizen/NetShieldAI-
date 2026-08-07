import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LiveCharts from "../components/LiveCharts";
import "../styles/Dashboard.css";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

function Analytics() {

    const [liveDashboard, setLiveDashboard] = useState(null);
    const [attackTrend, setAttackTrend] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {

    const token = localStorage.getItem("token");

    const fetchAnalytics = () => {

        axios.get("http://127.0.0.1:8000/traffic/live/dashboard")
        .then((res) => {
            setLiveDashboard(res.data);
        });

        axios.get("http://127.0.0.1:8000/traffic/attack-trends")
        .then((res) => {
            setAttackTrend(res.data);
        });

        axios.get("http://127.0.0.1:8000/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((res) => {
            setCurrentUser(res.data.user);
        });

    };

    // Load immediately
    fetchAnalytics();

    // Refresh every 5 seconds
    const interval = setInterval(fetchAnalytics, 5000);

    return () => clearInterval(interval);

}, []);
    if (!liveDashboard) {
    return <h2>Loading...</h2>;
}
    

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={currentUser} />

              <h2>Live Network Analytics</h2>

<LiveCharts liveDashboard={liveDashboard} />

<h2
    style={{
        marginTop: "60px",
        marginBottom: "20px",
    }}
>
    Live Protocol Summary
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
            <th
  style={{
    padding: "15px",
    textAlign: "center",
  }}
>
  Protocol
</th>

<th
  style={{
    padding: "15px",
    textAlign: "center",
  }}
>
  Packets
</th>
        </tr>
    </thead>

    <tbody>
  {Object.entries(liveDashboard.protocols).map(([protocol, count]) => (
    <tr key={protocol}>
      <td
        style={{
          padding: "15px",
          textAlign: "center",
          borderBottom: "1px solid #ddd",
        }}
      >
        {protocol}
      </td>

      <td
        style={{
          padding: "15px",
          textAlign: "center",
          borderBottom: "1px solid #ddd",
        }}
      >
        {count}
      </td>
    </tr>
  ))}
</tbody>
</table>  
 <h2
    style={{
        marginTop: "40px",
        marginBottom: "20px",
    }}
>
    Attack Trend Monitoring
</h2>

<div
    style={{
        width: "100%",
        height: "350px",
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,.1)"
    }}
>
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={attackTrend}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="time" />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Line
                type="monotone"
                dataKey="attacks"
                stroke="#dc3545"
                strokeWidth={3}
            />
        </LineChart>
    </ResponsiveContainer>
</div>           </div>

        </div>
          
    );

}

export default Analytics;