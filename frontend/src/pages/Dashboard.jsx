import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DashboardCards from "../components/DashboardCards";
import TrafficChart from "../components/TrafficChart";

import "../styles/dashboard.css";

function Dashboard() {

    const [collapsed, setCollapsed] = useState(false);

    const navigate = useNavigate();

    const [live, setLive] = useState({

        status: "Monitoring",

        packets: 0,

        upload: 0,

        download: 0,

        connections: 0,

        interface: "Wi-Fi",

        time: ""

    });

    useEffect(() => {

        const fetchLive = () => {

            axios
                .get("http://127.0.0.1:5000/api/live")
                .then((res) => {

                    setLive(res.data);

                })
                .catch((err) => {

                    console.log(err);

                });

        };

        fetchLive();

        const interval = setInterval(fetchLive, 1000);

        return () => clearInterval(interval);

    }, []);

    return (

        <div className="dashboard">

            <Sidebar
                collapsed={collapsed}
                toggleSidebar={() => setCollapsed(!collapsed)}
            />

            <div className="main">

                <Navbar />

                <DashboardCards />

                <div className="graph-row">

                    <div className="graph-card large-card">

                        <h2>📡 Live Network Traffic</h2>

                        <TrafficChart />

                    </div>

                    <div className="graph-card ai-card">

                        <h2>🧠 AI Threat Analysis</h2>

                        <div className="ai-status">

                            <div className="ai-item">

                                <span>Current Threat</span>

                                <strong className="safe">

                                    🟢 BENIGN

                                </strong>

                            </div>

                            <div className="ai-item">

                                <span>Confidence</span>

                                <strong>

                                    98.67%

                                </strong>

                            </div>

                            <div className="ai-item">

                                <span>Risk Level</span>

                                <strong className="safe">

                                    LOW

                                </strong>

                            </div>

                            <div className="ai-item">

                                <span>Model</span>

                                <strong>

                                    Random Forest

                                </strong>

                            </div>

                            <div className="ai-item">

                                <span>Last Scan</span>

                                <strong>

                                    {live.time || new Date().toLocaleTimeString()}

                                </strong>

                            </div>

                            <div className="ai-item">

                                <span>Recommendation</span>

                                <strong className="recommend">

                                    Continue Monitoring

                                </strong>

                            </div>

                            <button
                                className="investigate-btn"
                                onClick={() => navigate("/alerts")}
                            >
                                🚨 View Alerts
                            </button>

                        </div>

                    </div>

                </div>

                <div className="bottom-row">

                    <div className="status-card">

                        <h2>🛰 Live Monitoring</h2>

                        <div className="status-grid">

                            <div>

                                <span>Status</span>

                                <strong className="green">

                                    ● {live.status}

                                </strong>

                            </div>

                            <div>

                                <span>Interface</span>

                                <strong>

                                    {live.interface}

                                </strong>

                            </div>

                            <div>

                                <span>Packets/sec</span>

                                <strong>

                                    {live.packets}

                                </strong>

                            </div>

                            <div>

                                <span>Connections</span>

                                <strong>

                                    {live.connections}

                                </strong>

                            </div>

                            <div>

                                <span>Download</span>

                                <strong>

                                    {live.download} MB/s

                                </strong>

                            </div>

                            <div>

                                <span>Upload</span>

                                <strong>

                                    {live.upload} MB/s

                                </strong>

                            </div>

                            <div>

                                <span>AI Engine</span>

                                <strong className="green">

                                    Active

                                </strong>

                            </div>

                            <div>

                                <span>Detection Model</span>

                                <strong>

                                    Random Forest

                                </strong>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Dashboard;