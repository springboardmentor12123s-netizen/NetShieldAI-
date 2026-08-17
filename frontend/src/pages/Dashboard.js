import React, { useEffect, useState } from "react";
import axios from "axios";

import LiveCharts from "../components/LiveCharts";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

import "../styles/Dashboard.css";

const API_BASE = "http://127.0.0.1:8000";

function Dashboard() {

    const [user, setUser] = useState(null);

    const [livePrediction, setLivePrediction] = useState({
        prediction: "Waiting...",
        confidence: 0,
        risk: "Unknown",
        threat_type: "",
        recommendation: "",
        source: "",
        destination: "",
        protocol: ""
    });

    const [liveHistory, setLiveHistory] = useState([]);

    const [liveDashboard, setLiveDashboard] = useState(null);

    const [latestAlert, setLatestAlert] = useState(null);


    // ============================================================
    // FETCH USER
    // ============================================================

    useEffect(() => {

        const fetchUser = async () => {

            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    return;
                }

                const response = await axios.get(
                    `${API_BASE}/auth/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setUser(response.data.user);

            } catch (error) {

                console.error(
                    "User fetch error:",
                    error
                );

            }

        };

        fetchUser();

    }, []);


    // ============================================================
    // FETCH LIVE DATA
    // ============================================================

    useEffect(() => {

        const fetchLiveData = async () => {

            try {

                // ------------------------------------------------
                // CURRENT LIVE TRAFFIC
                // ------------------------------------------------

                const liveResponse = await axios.get(
                    `${API_BASE}/traffic/live`
                );

                setLivePrediction(
                    liveResponse.data
                );


                // ------------------------------------------------
                // LIVE HISTORY
                // ------------------------------------------------

                const historyResponse = await axios.get(
                    `${API_BASE}/traffic/live/history`
                );

                setLiveHistory(
                    historyResponse.data
                );


                // ------------------------------------------------
                // LIVE DASHBOARD
                // ------------------------------------------------

                const dashboardResponse = await axios.get(
                    `${API_BASE}/traffic/live/dashboard`
                );

                setLiveDashboard(
                    dashboardResponse.data
                );


                // ------------------------------------------------
                // LATEST ALERT
                // ------------------------------------------------

                try {

                    const alertResponse = await axios.get(
                        `${API_BASE}/traffic/alerts/latest`
                    );

                    setLatestAlert(
                        alertResponse.data
                    );

                } catch (alertError) {

                    console.log(
                        "No active alert."
                    );

                    setLatestAlert(null);

                }

            } catch (error) {

                console.error(
                    "Live data error:",
                    error
                );

            }

        };


        fetchLiveData();


        // Refresh every 2 seconds

        const interval = setInterval(
            fetchLiveData,
            2000
        );


        return () => {
            clearInterval(interval);
        };

    }, []);


    // ============================================================
    // ATTACK COUNTS
    // ============================================================

    const getPredictionCount = (
        prediction
    ) => {

        return liveHistory.filter(
            item =>
                item.prediction === prediction
        ).length;

    };


    const benignCount =
        getPredictionCount("Benign");


    const xssCount =
        getPredictionCount(
            "Web Attack – XSS"
        );


    const sqlCount =
        getPredictionCount(
            "Web Attack – Sql Injection"
        );


    const bruteCount =
        getPredictionCount(
            "Web Attack – Brute Force"
        );


    const attackCount =
        Math.max(
            liveHistory.length -
            benignCount,
            0
        );


    // ============================================================
    // DISPLAY HELPERS
    // ============================================================

    const formatPrediction = (
        prediction
    ) => {

        if (!prediction) {
            return "Unknown";
        }

        // Fix incorrectly encoded dash

        return prediction
            .replace(
                /ï¿½|�/g,
                "–"
            );

    };


    const getRiskClass = (
        risk
    ) => {

        if (risk === "High") {
            return "high-risk";
        }

        if (risk === "Medium") {
            return "medium-risk";
        }

        if (risk === "Low") {
            return "low-risk";
        }

        return "";

    };


    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={user} />


                {/* =====================================================
                    USER PROFILE
                ===================================================== */}

                <div className="profile-card">

                    <h2>
                        Welcome,{" "}
                        {user
                            ? user.full_name
                            : "User"}{" "}
                        👋
                    </h2>

                    <p>
                        <strong>Email:</strong>{" "}
                        {user
                            ? user.email
                            : "Loading..."}
                    </p>

                    <p>
                        <strong>Role:</strong>{" "}
                        {user
                            ? user.role
                            : "Loading..."}
                    </p>

                </div>


                {/* =====================================================
                    CURRENT LIVE THREAT
                ===================================================== */}

                <h2
                    style={{
                        marginTop: "40px"
                    }}
                >
                    🔴 Live Threat Detection
                </h2>


                <div
                    style={{
                        background: "#fff",
                        padding: "25px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,.1)",
                        marginTop: "20px"
                    }}
                >

                    <p>
                        <strong>
                            Prediction:
                        </strong>{" "}

                        {formatPrediction(
                            livePrediction.prediction
                        )}
                    </p>


                    <p>
                        <strong>
                            Confidence:
                        </strong>{" "}

                        {livePrediction.confidence}%
                    </p>


                    <p
                        className={
                            getRiskClass(
                                livePrediction.risk
                            )
                        }
                    >
                        <strong>
                            Risk Level:
                        </strong>{" "}

                        {livePrediction.risk}
                    </p>


                    <p>
                        <strong>
                            Threat Type:
                        </strong>{" "}

                        {livePrediction.threat_type}
                    </p>


                    <p>
                        <strong>
                            Source IP:
                        </strong>{" "}

                        {livePrediction.source}
                    </p>


                    <p>
                        <strong>
                            Destination IP:
                        </strong>{" "}

                        {livePrediction.destination}
                    </p>


                    <p>
                        <strong>
                            Protocol:
                        </strong>{" "}

                        {livePrediction.protocol}
                    </p>


                    <p>
                        <strong>
                            Recommendation:
                        </strong>{" "}

                        {livePrediction.recommendation}
                    </p>

                </div>


                {/* =====================================================
                    LATEST ALERT
                ===================================================== */}

                {latestAlert && (

                    <div
                        style={{
                            marginTop: "25px",
                            background: "#fff3f3",
                            border:
                                "1px solid #ff4d4d",
                            padding: "20px",
                            borderRadius: "12px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,.08)"
                        }}
                    >

                        <h3>
                            🚨 Latest Security Alert
                        </h3>


                        <p>
                            <strong>
                                Attack:
                            </strong>{" "}

                            {formatPrediction(
                                latestAlert.prediction
                            )}
                        </p>


                        <p>
                            <strong>
                                Risk:
                            </strong>{" "}

                            {latestAlert.risk}
                        </p>


                        <p>
                            <strong>
                                Threat:
                            </strong>{" "}

                            {latestAlert.threat}
                        </p>


                        <p>
                            <strong>
                                Source:
                            </strong>{" "}

                            {latestAlert.source}
                        </p>


                        <p>
                            <strong>
                                Recommendation:
                            </strong>{" "}

                            {latestAlert.recommendation}
                        </p>


                        <p>
                            <strong>
                                Status:
                            </strong>{" "}

                            {latestAlert.status}
                        </p>

                    </div>

                )}


                {/* =====================================================
                    4-CLASS LIVE COUNTS
                ===================================================== */}

                <h2
                    style={{
                        marginTop: "40px"
                    }}
                >
                    📊 Live Attack Classification
                </h2>


                <div className="cards">

                    <StatCard
                        title="Benign"
                        value={benignCount}
                    />

                    <StatCard
                        title="XSS"
                        value={xssCount}
                    />

                    <StatCard
                        title="SQL Injection"
                        value={sqlCount}
                    />

                    <StatCard
                        title="Brute Force"
                        value={bruteCount}
                    />

                </div>


                {/* =====================================================
                    LIVE TRAFFIC HISTORY
                ===================================================== */}

                <h2
                    style={{
                        marginTop: "40px"
                    }}
                >
                    📡 Live Traffic History
                </h2>


                <table
                    style={{
                        width: "100%",
                        background: "#fff",
                        borderCollapse:
                            "collapse",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,.1)",
                        marginTop: "20px"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background:
                                    "#4F46E5",
                                color: "white"
                            }}
                        >

                            <th
                                style={{
                                    padding: "15px"
                                }}
                            >
                                Time
                            </th>

                            <th
                                style={{
                                    padding: "15px"
                                }}
                            >
                                Source IP
                            </th>

                            <th
                                style={{
                                    padding: "15px"
                                }}
                            >
                                Destination IP
                            </th>

                            <th
                                style={{
                                    padding: "15px"
                                }}
                            >
                                Protocol
                            </th>

                            <th
                                style={{
                                    padding: "15px"
                                }}
                            >
                                Prediction
                            </th>

                            <th
                                style={{
                                    padding: "15px"
                                }}
                            >
                                Risk
                            </th>

                            <th
                                style={{
                                    padding: "15px"
                                }}
                            >
                                Confidence
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {liveHistory
                            .slice(0, 20)
                            .map(
                                (
                                    packet,
                                    index
                                ) => (

                                    <tr
                                        key={index}
                                        style={{
                                            textAlign:
                                                "center",
                                            borderBottom:
                                                "1px solid #ddd"
                                        }}
                                    >

                                        <td
                                            style={{
                                                padding:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                packet.timestamp
                                            }
                                        </td>


                                        <td
                                            style={{
                                                padding:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                packet.source
                                            }
                                        </td>


                                        <td
                                            style={{
                                                padding:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                packet.destination
                                            }
                                        </td>


                                        <td
                                            style={{
                                                padding:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                packet.protocol
                                            }
                                        </td>


                                        <td
                                            style={{
                                                padding:
                                                    "12px",
                                                fontWeight:
                                                    "bold",
                                                color:
                                                    packet.prediction ===
                                                    "Benign"
                                                        ? "green"
                                                        : "red"
                                            }}
                                        >
                                            {formatPrediction(
                                                packet.prediction
                                            )}
                                        </td>


                                        <td
                                            style={{
                                                padding:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                packet.risk
                                            }
                                        </td>


                                        <td
                                            style={{
                                                padding:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                packet.confidence
                                            }%
                                        </td>

                                    </tr>

                                )
                            )}

                    </tbody>

                </table>


                {/* =====================================================
                    LIVE NETWORK ANALYTICS
                ===================================================== */}

                {liveDashboard && (

                    <>

                        <h2
                            style={{
                                marginTop:
                                    "40px"
                            }}
                        >
                            📈 Live Network Analytics
                        </h2>


                        <div className="cards">

                            <StatCard
                                title="Total Live Packets"
                                value={
                                    liveDashboard.total_packets ||
                                    0
                                }
                            />


                            <StatCard
                                title="Benign Packets"
                                value={
                                    liveDashboard
                                        .predictions
                                        ?.Benign ||
                                    0
                                }
                            />


                            <StatCard
                                title="Attack Packets"
                                value={
                                    Math.max(
                                        (
                                            liveDashboard.total_packets ||
                                            0
                                        ) -
                                        (
                                            liveDashboard
                                                .predictions
                                                ?.Benign ||
                                            0
                                        ),
                                        0
                                    )
                                }
                            />


                            <StatCard
                                title="TCP Packets"
                                value={
                                    liveDashboard
                                        .protocols
                                        ?.TCP ||
                                    0
                                }
                            />


                            <StatCard
                                title="TLS Packets"
                                value={
                                    liveDashboard
                                        .protocols
                                        ?.TLS ||
                                    0
                                }
                            />


                            <StatCard
                                title="DNS Packets"
                                value={
                                    liveDashboard
                                        .protocols
                                        ?.DNS ||
                                    0
                                }
                            />


                            <StatCard
                                title="UDP Packets"
                                value={
                                    liveDashboard
                                        .protocols
                                        ?.UDP ||
                                    0
                                }
                            />

                        </div>


                        <LiveCharts
                            liveDashboard={
                                liveDashboard
                            }
                        />

                    </>

                )}

            </div>

        </div>

    );

}


export default Dashboard;