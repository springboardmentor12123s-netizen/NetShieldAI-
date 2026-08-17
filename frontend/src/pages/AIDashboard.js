import React, { useEffect, useState } from "react";
import axios from "axios";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

import "./AIDashboard.css";

function AIDashboard() {

    const [liveDashboard, setLiveDashboard] = useState(null);
    const [liveHistory, setLiveHistory] = useState([]);
    const [lastUpdated, setLastUpdated] = useState("");


    useEffect(() => {

        const fetchReport = async () => {

            try {

                const dashboard = await axios.get(
                    "http://127.0.0.1:8000/traffic/live/dashboard"
                );

                const history = await axios.get(
                    "http://127.0.0.1:8000/traffic/live/history"
                );

                setLiveDashboard(dashboard.data);

                setLiveHistory(history.data);

                setLastUpdated(
                    new Date().toLocaleTimeString()
                );

            } catch (err) {

                console.log(err);

            }

        };


        fetchReport();

        const interval = setInterval(
            fetchReport,
            5000
        );

        return () => clearInterval(interval);

    }, []);


    if (!liveDashboard) {

        return (
            <div className="ai-loading">
                🤖 Loading AI Dashboard...
            </div>
        );

    }


    const predictions =
        liveDashboard.predictions || {};

    const risks =
        liveDashboard.risks || {};


    const benign =
        predictions.Benign || 0;


    const totalPackets =
        liveDashboard.total_packets || 0;


    const attacks =
        totalPackets - benign;


    const detectionRate =
        totalPackets > 0
            ? ((attacks / totalPackets) * 100).toFixed(1)
            : 0;


    const riskData =
        Object.entries(risks).map(
            ([name, value]) => ({
                name,
                value
            })
        );


    const threatData =
        Object.entries(predictions).map(
            ([name, value]) => ({
                name,
                value
            })
        );


    const COLORS = [
        "#7c6ce8",
        "#f3b85b",
        "#ed8b8b",
        "#63c7a1"
    ];


    const formatPrediction = (prediction) => {

        if (!prediction) {
            return "Unknown";
        }

        return prediction.replace(
            /ï¿½|�/g,
            "–"
        );

    };


    return (

        <div className="ai-container">


            {/* =========================
                HEADER
            ========================= */}

            <div className="ai-header">

                <div>

                    <h1>
                        🤖 AI Intrusion Dashboard
                    </h1>

                    <p>
                        AI-powered network threat analysis
                        and security intelligence
                    </p>

                </div>


                <div className="ai-live-status">

                    <span></span>

                    LIVE AI ANALYSIS

                </div>

            </div>


            <div className="update-time">

                🔄 Last Updated:
                {" "}
                {lastUpdated}

            </div>


            {/* =========================
                SUMMARY CARDS
            ========================= */}

            <div className="card-container">


                {/* Records */}

                <div className="ai-card records-card">

                    <div className="ai-card-icon">
                        📦
                    </div>

                    <div>

                        <p>
                            Records Analyzed
                        </p>

                        <h2>
                            {totalPackets}
                        </h2>

                    </div>

                </div>


                {/* Normal */}

                <div className="ai-card normal-card">

                    <div className="ai-card-icon">
                        🛡️
                    </div>

                    <div>

                        <p>
                            Normal Traffic
                        </p>

                        <h2>
                            {benign}
                        </h2>

                    </div>

                </div>


                {/* Attacks */}

                <div className="ai-card attack-card">

                    <div className="ai-card-icon">
                        🚨
                    </div>

                    <div>

                        <p>
                            Attacks Detected
                        </p>

                        <h2>
                            {attacks}
                        </h2>

                    </div>

                </div>


                {/* Detection Rate */}

                <div className="ai-card detection-card">

                    <div className="ai-card-icon">
                        🎯
                    </div>

                    <div>

                        <p>
                            Detection Rate
                        </p>

                        <h2>
                            {detectionRate}%
                        </h2>

                    </div>

                </div>

            </div>


            {/* =========================
                CHARTS
            ========================= */}

            <div className="charts">


                {/* Risk Chart */}

                <div className="chart-card">

                    <div className="chart-heading">

                        <div className="chart-heading-icon">
                            ⚠️
                        </div>

                        <div>

                            <h2>
                                Risk Summary
                            </h2>

                            <p>
                                Distribution of detected risk levels
                            </p>

                        </div>

                    </div>


                    <ResponsiveContainer
                        width="100%"
                        height={330}
                    >

                        <PieChart>

                            <Pie
                                data={riskData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={105}
                                innerRadius={55}
                                paddingAngle={3}
                                label
                            >

                                {riskData.map(
                                    (entry, index) => (

                                        <Cell
                                            key={index}
                                            fill={
                                                COLORS[
                                                    index %
                                                    COLORS.length
                                                ]
                                            }
                                        />

                                    )
                                )}

                            </Pie>

                            <Tooltip />

                            <Legend />

                        </PieChart>

                    </ResponsiveContainer>

                </div>


                {/* Threat Chart */}

                <div className="chart-card">

                    <div className="chart-heading">

                        <div className="chart-heading-icon threat-icon">
                            🚨
                        </div>

                        <div>

                            <h2>
                                Threat Summary
                            </h2>

                            <p>
                                AI classification of network traffic
                            </p>

                        </div>

                    </div>


                    <ResponsiveContainer
                        width="100%"
                        height={330}
                    >

                        <BarChart
                            data={threatData}
                            margin={{
                                top: 10,
                                right: 20,
                                left: 0,
                                bottom: 55
                            }}
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#edf0f6"
                            />

                            <XAxis
                                dataKey="name"
                                tick={{
                                    fontSize: 10
                                }}
                                angle={-20}
                                textAnchor="end"
                            />

                            <YAxis />

                            <Tooltip />

                            <Bar
                                dataKey="value"
                                fill="#7c6ce8"
                                radius={[
                                    6,
                                    6,
                                    0,
                                    0
                                ]}
                            />

                        </BarChart>

                    </ResponsiveContainer>

                </div>

            </div>


            {/* =========================
                THREAT DETAILS
            ========================= */}

            <div className="threat-panel">


                <div className="threat-panel-header">

                    <div>

                        <h2>
                            🔎 Threat Details
                        </h2>

                        <p>
                            Recent traffic analyzed by the
                            AI detection system
                        </p>

                    </div>


                    <div className="threat-count">

                        {liveHistory.length}
                        {" "}
                        Records

                    </div>

                </div>


                <div className="ai-table-wrapper">

                    <table className="ai-table">

                        <thead>

                            <tr>

                                <th>Time</th>

                                <th>Source IP</th>

                                <th>Destination IP</th>

                                <th>Protocol</th>

                                <th>Prediction</th>

                                <th>Confidence</th>

                                <th>Risk</th>

                            </tr>

                        </thead>


                        <tbody>

                            {liveHistory
                                .slice(0, 10)
                                .map(
                                    (packet, index) => {

                                        const isBenign =
                                            packet.prediction ===
                                            "Benign";

                                        return (

                                            <tr
                                                key={index}
                                            >

                                                <td>

                                                    🕐{" "}
                                                    {packet.timestamp}

                                                </td>


                                                <td className="ip-value">

                                                    {packet.source}

                                                </td>


                                                <td className="ip-value">

                                                    {packet.destination}

                                                </td>


                                                <td>

                                                    <span className="protocol-pill">

                                                        {packet.protocol}

                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            isBenign
                                                                ? "ai-prediction benign"
                                                                : "ai-prediction attack"
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

                                                    <div className="confidence-value">

                                                        <div className="confidence-track">

                                                            <div
                                                                className="confidence-progress"
                                                                style={{
                                                                    width:
                                                                        `${Math.min(
                                                                            Number(
                                                                                packet.confidence ||
                                                                                0
                                                                            ),
                                                                            100
                                                                        )}%`
                                                                }}
                                                            />

                                                        </div>

                                                        <span>
                                                            {packet.confidence}%
                                                        </span>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`ai-risk ${String(
                                                            packet.risk ||
                                                            "Unknown"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {packet.risk}
                                                    </span>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                        </tbody>

                    </table>


                    {liveHistory.length === 0 && (

                        <div className="ai-empty">

                            <div>
                                🤖
                            </div>

                            <h3>
                                No Threat Data Yet
                            </h3>

                            <p>
                                AI analysis results will
                                appear here.
                            </p>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}

export default AIDashboard;