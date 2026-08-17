import React, { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/Dashboard.css";
import "../styles/Monitoring.css";

const API_BASE = "http://127.0.0.1:8000";

function Monitoring() {

    const [packets, setPackets] = useState([]);

    useEffect(() => {

        const fetchPackets = async () => {

            try {

                const response = await axios.get(
                    `${API_BASE}/traffic/live/history`
                );

                setPackets(response.data);

            } catch (error) {

                console.error(
                    "Live monitoring error:",
                    error
                );

            }

        };

        fetchPackets();

        const interval = setInterval(
            fetchPackets,
            2000
        );

        return () => clearInterval(interval);

    }, []);


    const formatPrediction = (prediction) => {

        if (!prediction) {
            return "Unknown";
        }

        return prediction.replace(
            /ï¿½|�/g,
            "–"
        );

    };


    // -----------------------------
    // Statistics
    // -----------------------------

    const totalPackets = packets.length;

    const benignPackets = packets.filter(
        packet => packet.prediction === "Benign"
    ).length;

    const attackPackets =
        totalPackets - benignPackets;

    const highRiskPackets = packets.filter(
        packet =>
            packet.risk === "High" ||
            packet.risk === "Critical"
    ).length;


    // -----------------------------
    // Protocol counts
    // -----------------------------

    const tcpPackets = packets.filter(
        packet => packet.protocol === "TCP"
    ).length;

    const udpPackets = packets.filter(
        packet => packet.protocol === "UDP"
    ).length;

    const tlsPackets = packets.filter(
        packet => packet.protocol === "TLS"
    ).length;

    const dnsPackets = packets.filter(
        packet => packet.protocol === "DNS"
    ).length;


    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar />


                {/* =========================
                    PAGE HEADER
                ========================= */}

                <div className="monitoring-header">

                    <div>

                        <h1>
                            <span>📡</span>
                            Live Network Monitoring
                        </h1>

                        <p>
                            Real-time network traffic collection
                            and AI-powered threat analysis
                        </p>

                    </div>

                    <div className="live-status">

                        <span></span>

                        LIVE

                    </div>

                </div>


                {/* =========================
                    STATISTICS
                ========================= */}

                <div className="monitoring-stats">

                    <div className="monitor-stat total-stat">

                        <div className="monitor-icon">
                            📦
                        </div>

                        <div>

                            <p>Total Packets</p>

                            <h3>{totalPackets}</h3>

                        </div>

                    </div>


                    <div className="monitor-stat benign-stat">

                        <div className="monitor-icon">
                            🛡️
                        </div>

                        <div>

                            <p>Benign Traffic</p>

                            <h3>{benignPackets}</h3>

                        </div>

                    </div>


                    <div className="monitor-stat attack-stat">

                        <div className="monitor-icon">
                            🚨
                        </div>

                        <div>

                            <p>Attacks Detected</p>

                            <h3>{attackPackets}</h3>

                        </div>

                    </div>


                    <div className="monitor-stat risk-stat">

                        <div className="monitor-icon">
                            ⚠️
                        </div>

                        <div>

                            <p>High Risk</p>

                            <h3>{highRiskPackets}</h3>

                        </div>

                    </div>

                </div>


                {/* =========================
                    PROTOCOL CARDS
                ========================= */}

                <div className="protocol-section">

                    <div className="section-heading">

                        <div>

                            <h2>🌐 Protocol Overview</h2>

                            <p>
                                Live traffic distribution by protocol
                            </p>

                        </div>

                    </div>


                    <div className="protocol-grid">

                        <div className="protocol-card tcp">

                            <div className="protocol-icon">
                                🔵
                            </div>

                            <div>

                                <span>TCP</span>

                                <strong>
                                    {tcpPackets}
                                </strong>

                            </div>

                        </div>


                        <div className="protocol-card udp">

                            <div className="protocol-icon">
                                🟢
                            </div>

                            <div>

                                <span>UDP</span>

                                <strong>
                                    {udpPackets}
                                </strong>

                            </div>

                        </div>


                        <div className="protocol-card tls">

                            <div className="protocol-icon">
                                🔐
                            </div>

                            <div>

                                <span>TLS</span>

                                <strong>
                                    {tlsPackets}
                                </strong>

                            </div>

                        </div>


                        <div className="protocol-card dns">

                            <div className="protocol-icon">
                                🟣
                            </div>

                            <div>

                                <span>DNS</span>

                                <strong>
                                    {dnsPackets}
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =========================
                    LIVE PACKET TABLE
                ========================= */}

                <div className="monitoring-panel">

                    <div className="monitoring-panel-header">

                        <div>

                            <h2>
                                📊 Live Packet Collection
                            </h2>

                            <p>
                                Packets captured and analyzed
                                automatically from live network traffic.
                            </p>

                        </div>

                        <div className="packet-count">
                            {packets.length} Packets
                        </div>

                    </div>


                    <div className="table-wrapper">

                        <table className="monitoring-table">

                            <thead>

                                <tr>

                                    <th>Time</th>

                                    <th>Source IP</th>

                                    <th>Destination IP</th>

                                    <th>Protocol</th>

                                    <th>Prediction</th>

                                    <th>Risk</th>

                                    <th>Confidence</th>

                                </tr>

                            </thead>


                            <tbody>

                                {packets
                                    .slice(0, 50)
                                    .map((packet, index) => {

                                        const isBenign =
                                            packet.prediction ===
                                            "Benign";

                                        return (

                                            <tr key={index}>

                                                <td>
                                                    <span className="time-cell">
                                                        🕐{" "}
                                                        {packet.timestamp}
                                                    </span>
                                                </td>


                                                <td>
                                                    <span className="ip-cell">
                                                        {packet.source}
                                                    </span>
                                                </td>


                                                <td>
                                                    <span className="ip-cell">
                                                        {packet.destination}
                                                    </span>
                                                </td>


                                                <td>

                                                    <span className="protocol-badge">
                                                        {packet.protocol}
                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            isBenign
                                                                ? "prediction-badge benign"
                                                                : "prediction-badge attack"
                                                        }
                                                    >

                                                        {isBenign
                                                            ? "🛡️"
                                                            : "🚨"}

                                                        {" "}

                                                        {formatPrediction(
                                                            packet.prediction
                                                        )}

                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`risk-badge ${String(
                                                            packet.risk || "Unknown"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {packet.risk}
                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="confidence">

                                                        <div className="confidence-bar">

                                                            <div
                                                                className="confidence-fill"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        Number(
                                                                            packet.confidence || 0
                                                                        ),
                                                                        100
                                                                    )}%`
                                                                }}
                                                            ></div>

                                                        </div>

                                                        <span>
                                                            {packet.confidence}%
                                                        </span>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    })}

                            </tbody>

                        </table>


                        {packets.length === 0 && (

                            <div className="monitoring-empty">

                                <div>
                                    📡
                                </div>

                                <h3>
                                    Waiting for Network Traffic
                                </h3>

                                <p>
                                    Live packets will appear here
                                    automatically.
                                </p>

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Monitoring;