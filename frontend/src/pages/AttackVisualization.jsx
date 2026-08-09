import { useEffect, useState } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

import { Bar, Doughnut } from "react-chartjs-2";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/attackvisualization.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
);

function AttackVisualization() {

    const [collapsed, setCollapsed] = useState(false);
    const [summary, setSummary] = useState(null);

    useEffect(() => {

        axios
            .get("http://127.0.0.1:5000/api/dataset/summary")
            .then((res) => {
                setSummary(res.data);
            })
            .catch((err) => {
                console.log(err);
            });

    }, []);

    if (!summary) {
        return (
            <div className="dashboard">
                <Sidebar
                    collapsed={collapsed}
                    toggleSidebar={() => setCollapsed(!collapsed)}
                />

                <div className="main">
                    <Navbar />

                    <div className="loading-attack">
                        Loading Attack Analytics...
                    </div>
                </div>
            </div>
        );
    }

    const attackTypes = summary.attackTypes || {};

    const labels = Object.keys(attackTypes);

    

    const attackLabels = labels.filter(
        (label) => label.toUpperCase() !== "BENIGN" &&
                   label.toUpperCase() !== "NORMAL"
    );

    const attackValues = attackLabels.map(
        (label) => attackTypes[label]
    );

    const totalAttacks = attackValues.reduce(
        (sum, value) => sum + value,
        0
    );

    const topAttackIndex =
        attackValues.length > 0
            ? attackValues.indexOf(Math.max(...attackValues))
            : -1;

    const topAttack =
        topAttackIndex >= 0
            ? attackLabels[topAttackIndex]
            : "None";

    const barData = {

        labels: attackLabels,

        datasets: [
            {
                label: "Detected Records",
                data: attackValues,
                backgroundColor: "#00d4ff",
                borderRadius: 6
            }
        ]
    };

    const barOptions = {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {
                labels: {
                    color: "#ffffff"
                }
            },

            tooltip: {
                callbacks: {
                    label: function(context) {
                        return ` ${context.raw.toLocaleString()} records`;
                    }
                }
            }
        },

        scales: {

            x: {
                ticks: {
                    color: "#aab6cf"
                },

                grid: {
                    color: "rgba(255,255,255,0.05)"
                }
            },

            y: {
                ticks: {
                    color: "#aab6cf"
                },

                grid: {
                    color: "rgba(255,255,255,0.05)"
                }
            }
        }
    };

    const doughnutData = {

        labels: attackLabels,

        datasets: [
            {
                data: attackValues,
                backgroundColor: [
                    "#ff3b3b",
                    "#ff7a00",
                    "#facc15",
                    "#a855f7",
                    "#00d4ff",
                    "#22c55e",
                    "#ec4899",
                    "#6366f1",
                    "#14b8a6",
                    "#f97316"
                ],

                borderWidth: 0
            }
        ]
    };

    const doughnutOptions = {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {
                position: "right",

                labels: {
                    color: "#ffffff",
                    padding: 15
                }
            }
        }
    };

    return (

        <div className="dashboard">

            <Sidebar
                collapsed={collapsed}
                toggleSidebar={() => setCollapsed(!collapsed)}
            />

            <div className="main">

                <Navbar />

                <div className="attack-page">

                    <div className="attack-header">

                        <div>

                            <h1>
                                📊 Attack Visualization
                            </h1>

                            <p>
                                AI-powered analysis of detected network threats
                            </p>

                        </div>

                        <div className="analysis-status">
                            <span>●</span>
                            Analysis Active
                        </div>

                    </div>


                    <div className="attack-summary">

                        <div className="attack-stat">

                            <span>Total Attacks</span>

                            <strong>
                                {summary.attacks.toLocaleString()}
                            </strong>

                        </div>


                        <div className="attack-stat">

                            <span>Attack Types</span>

                            <strong>
                                {attackLabels.length}
                            </strong>

                        </div>


                        <div className="attack-stat">

                            <span>Top Threat</span>

                            <strong>
                                {topAttack}
                            </strong>

                        </div>


                        <div className="attack-stat">

                            <span>Benign Traffic</span>

                            <strong className="safe-number">
                                {summary.benign.toLocaleString()}
                            </strong>

                        </div>

                    </div>


                    <div className="visualization-grid">


                        <div className="visual-card large">

                            <div className="visual-title">

                                <div>

                                    <h2>
                                        Attack Distribution
                                    </h2>

                                    <p>
                                        Number of records detected for each attack category
                                    </p>

                                </div>

                                <span className="live-badge">
                                    LIVE DATA
                                </span>

                            </div>

                            <div className="bar-container">

                                <Bar
                                    data={barData}
                                    options={barOptions}
                                />

                            </div>

                        </div>


                        <div className="visual-card">

                            <div className="visual-title">

                                <div>

                                    <h2>
                                        Attack Composition
                                    </h2>

                                    <p>
                                        Threat distribution by category
                                    </p>

                                </div>

                            </div>

                            <div className="doughnut-container">

                                <Doughnut
                                    data={doughnutData}
                                    options={doughnutOptions}
                                />

                            </div>

                        </div>


                    </div>


                    <div className="attack-table-card">

                        <div className="visual-title">

                            <div>

                                <h2>
                                    🔎 Attack Intelligence
                                </h2>

                                <p>
                                    Detailed breakdown of detected threats
                                </p>

                            </div>

                        </div>


                        <div className="attack-table">

                            <div className="table-head">

                                <span>Attack Type</span>
                                <span>Records</span>
                                <span>Percentage</span>
                                <span>Severity</span>

                            </div>


                            {attackLabels
                                .sort(
                                    (a, b) =>
                                        attackTypes[b] -
                                        attackTypes[a]
                                )
                                .map((attack) => {

                                    const count =
                                        attackTypes[attack];

                                    const percentage =
                                        totalAttacks > 0
                                            ? (
                                                count /
                                                totalAttacks
                                            ) * 100
                                            : 0;

                                    let severity = "MEDIUM";

                                    if (percentage >= 20) {
                                        severity = "CRITICAL";
                                    } else if (percentage >= 10) {
                                        severity = "HIGH";
                                    } else if (percentage < 5) {
                                        severity = "LOW";
                                    }

                                    return (

                                        <div
                                            className="table-row"
                                            key={attack}
                                        >

                                            <span className="attack-name">
                                                🚨 {attack}
                                            </span>

                                            <span>
                                                {count.toLocaleString()}
                                            </span>

                                            <span>
                                                {percentage.toFixed(2)}%
                                            </span>

                                            <span>

                                                <b
                                                    className={`severity ${severity.toLowerCase()}`}
                                                >
                                                    {severity}
                                                </b>

                                            </span>

                                        </div>

                                    );

                                })}

                        </div>

                    </div>


                    <div className="analysis-footer">

                        <div>

                            <strong>
                                🧠 AI Analysis
                            </strong>

                            <span>
                                {topAttack !== "None"
                                    ? `${topAttack} is currently the most frequently detected attack category.`
                                    : "No attacks detected."}
                            </span>

                        </div>


                        <div>

                            <strong>
                                🛡 Network Status
                            </strong>

                            <span className="network-good">
                                ● Monitoring Active
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default AttackVisualization;