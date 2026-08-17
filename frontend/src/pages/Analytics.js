import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LiveCharts from "../components/LiveCharts";

import "../styles/Dashboard.css";
import "../styles/Analytics.css";

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

            // Live dashboard
            axios.get(
                "http://127.0.0.1:8000/traffic/live/dashboard"
            )
            .then((res) => {
                setLiveDashboard(res.data);
            })
            .catch((err) => {
                console.log("Dashboard Error:", err);
            });


            // Attack trends
            axios.get(
                "http://127.0.0.1:8000/traffic/attack-trends"
            )
            .then((res) => {
                setAttackTrend(res.data);
            })
            .catch((err) => {
                console.log("Attack Trend Error:", err);
            });


            // Current user
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

        };


        fetchAnalytics();


        const interval = setInterval(
            fetchAnalytics,
            5000
        );


        return () => clearInterval(interval);

    }, []);


    if (!liveDashboard) {

        return (
            <div className="analytics-loading">
                📊 Loading Analytics...
            </div>
        );

    }


    const protocols =
        liveDashboard.protocols || {};

    const totalPackets =
        liveDashboard.total_packets || 0;

    const protocolEntries =
        Object.entries(protocols);


    return (

        <div className="dashboard">

            <Sidebar />


            <div className="content">

                <Navbar user={currentUser} />


                {/* =========================
                    PAGE HEADER
                ========================= */}

                <div className="analytics-header">

                    <div>

                        <h1>
                            📊 Live Network Analytics
                        </h1>

                        <p>
                            Real-time traffic analysis,
                            protocol monitoring and attack trends
                        </p>

                    </div>


                    <div className="analytics-live">

                        <span></span>

                        LIVE ANALYTICS

                    </div>

                </div>


                {/* =========================
                    SUMMARY CARDS
                ========================= */}

                <div className="analytics-stats">

                    <div className="analytics-stat total">

                        <div className="analytics-icon">
                            📦
                        </div>

                        <div>

                            <p>Total Packets</p>

                            <h3>
                                {totalPackets}
                            </h3>

                        </div>

                    </div>


                    <div className="analytics-stat protocol">

                        <div className="analytics-icon">
                            🌐
                        </div>

                        <div>

                            <p>Protocols Detected</p>

                            <h3>
                                {protocolEntries.length}
                            </h3>

                        </div>

                    </div>


                    <div className="analytics-stat attacks">

                        <div className="analytics-icon">
                            🚨
                        </div>

                        <div>

                            <p>Attack Events</p>

                            <h3>
                                {attackTrend.reduce(
                                    (sum, item) =>
                                        sum +
                                        (item.attacks || 0),
                                    0
                                )}
                            </h3>

                        </div>

                    </div>


                    <div className="analytics-stat monitoring">

                        <div className="analytics-icon">
                            📡
                        </div>

                        <div>

                            <p>Monitoring Status</p>

                            <h3>
                                Active
                            </h3>

                        </div>

                    </div>

                </div>


                {/* =========================
                    LIVE CHARTS
                ========================= */}

                <div className="analytics-chart-section">

                    <div className="section-title">

                        <div>

                            <h2>
                                📈 Traffic Analytics
                            </h2>

                            <p>
                                Current network traffic distribution
                            </p>

                        </div>

                    </div>


                    <div className="live-charts-container">

                        <LiveCharts
                            liveDashboard={liveDashboard}
                        />

                    </div>

                </div>


                {/* =========================
                    PROTOCOL SUMMARY
                ========================= */}

                <div className="analytics-panel">

                    <div className="analytics-panel-header">

                        <div>

                            <h2>
                                🌐 Live Protocol Summary
                            </h2>

                            <p>
                                Network packets grouped by protocol
                            </p>

                        </div>


                        <div className="record-badge">

                            {totalPackets}
                            {" "}
                            Packets

                        </div>

                    </div>


                    <div className="protocol-table-wrapper">

                        <table className="protocol-table">

                            <thead>

                                <tr>

                                    <th>
                                        Protocol
                                    </th>

                                    <th>
                                        Packets
                                    </th>

                                    <th>
                                        Traffic Share
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {protocolEntries.map(
                                    ([protocol, count]) => {

                                        const percentage =
                                            totalPackets > 0
                                                ? (
                                                    (count /
                                                        totalPackets) *
                                                    100
                                                ).toFixed(1)
                                                : 0;

                                        return (

                                            <tr
                                                key={protocol}
                                            >

                                                <td>

                                                    <span className="protocol-name">

                                                        <span className="protocol-dot">
                                                        </span>

                                                        {protocol}

                                                    </span>

                                                </td>


                                                <td>

                                                    <strong className="packet-number">
                                                        {count}
                                                    </strong>

                                                </td>


                                                <td>

                                                    <div className="share-container">

                                                        <div className="share-bar">

                                                            <div
                                                                className="share-fill"
                                                                style={{
                                                                    width:
                                                                        `${percentage}%`
                                                                }}
                                                            />

                                                        </div>

                                                        <span>
                                                            {percentage}%
                                                        </span>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>


                        {protocolEntries.length === 0 && (

                            <div className="analytics-empty">

                                🌐

                                <h3>
                                    No Protocol Data
                                </h3>

                                <p>
                                    Protocol information will
                                    appear when traffic is detected.
                                </p>

                            </div>

                        )}

                    </div>

                </div>


                {/* =========================
                    ATTACK TREND
                ========================= */}

                <div className="analytics-panel attack-panel">

                    <div className="analytics-panel-header">

                        <div>

                            <h2>
                                📈 Attack Trend Monitoring
                            </h2>

                            <p>
                                Number of detected attack events
                                over time
                            </p>

                        </div>


                        <div className="attack-status">

                            🔴 Monitoring

                        </div>

                    </div>


                    <div className="attack-chart">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >

                            <LineChart
                                data={attackTrend}
                                margin={{
                                    top: 15,
                                    right: 25,
                                    left: 10,
                                    bottom: 10
                                }}
                            >

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#edf0f6"
                                />

                                <XAxis
                                    dataKey="time"
                                    tick={{
                                        fontSize: 11,
                                        fill: "#7f8ba0"
                                    }}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{
                                        fontSize: 11,
                                        fill: "#7f8ba0"
                                    }}
                                />

                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "10px",
                                        border: "1px solid #e8ebf3",
                                        boxShadow:
                                            "0 5px 15px rgba(50,60,100,.08)"
                                    }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="attacks"
                                    stroke="#e27b88"
                                    strokeWidth={3}
                                    dot={{
                                        r: 4,
                                        fill: "#e27b88"
                                    }}
                                    activeDot={{
                                        r: 6
                                    }}
                                />

                            </LineChart>

                        </ResponsiveContainer>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default Analytics;