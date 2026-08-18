import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/traffic.css";

function Traffic() {

    const [traffic, setTraffic] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchTraffic = async () => {

            try {

                const res = await api.get("/live");

                setTraffic(res.data);
                setError("");

            } catch (err) {

                console.error(err);
                setError("Unable to connect to monitoring server.");

            }

        };

        fetchTraffic();

        const interval = setInterval(fetchTraffic, 3000);

        return () => clearInterval(interval);

    }, []);

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="main">

                <Navbar />

                <div className="traffic-page">

                    <div className="traffic-header">

                        <div>
                            <h1>📡 Live Traffic Monitoring</h1>

                            <p>
                                Real-time network activity and threat monitoring
                            </p>
                        </div>

                        <div className="live-status">
                            <span></span>
                            LIVE MONITORING
                        </div>

                    </div>

                    {error && (
                        <div className="traffic-error">
                            ⚠ {error}
                        </div>
                    )}

                    {!traffic && !error && (
                        <div className="traffic-loading">
                            Loading network data...
                        </div>
                    )}

                    {traffic && (

                        <>

                            <div className="traffic-cards">

                                <div className="traffic-card">
                                    <div className="traffic-card-title">
                                        📡 Network Interface
                                    </div>

                                    <div className="traffic-card-value">
                                        {traffic.interface}
                                    </div>

                                    <div className="traffic-card-label">
                                        Active monitoring interface
                                    </div>
                                </div>


                                <div className="traffic-card">
                                    <div className="traffic-card-title">
                                        📦 Packets / sec
                                    </div>

                                    <div className="traffic-card-value">
                                        {traffic.packets}
                                    </div>

                                    <div className="traffic-card-label">
                                        Network packets detected
                                    </div>
                                </div>


                                <div className="traffic-card">
                                    <div className="traffic-card-title">
                                        🔗 Active Connections
                                    </div>

                                    <div className="traffic-card-value">
                                        {traffic.connections}
                                    </div>

                                    <div className="traffic-card-label">
                                        Current network connections
                                    </div>
                                </div>


                                <div className="traffic-card">
                                    <div className="traffic-card-title">
                                        ⬇ Download
                                    </div>

                                    <div className="traffic-card-value">
                                        {traffic.download}
                                        <span> MB/s</span>
                                    </div>

                                    <div className="traffic-card-label">
                                        Incoming network traffic
                                    </div>
                                </div>


                                <div className="traffic-card">
                                    <div className="traffic-card-title">
                                        ⬆ Upload
                                    </div>

                                    <div className="traffic-card-value">
                                        {traffic.upload}
                                        <span> MB/s</span>
                                    </div>

                                    <div className="traffic-card-label">
                                        Outgoing network traffic
                                    </div>
                                </div>

                            </div>


                            <div className="threat-panel">

                                <div className="threat-heading">
                                    <div>
                                        <h2>🛡 Current Threat Analysis</h2>

                                        <p>
                                            AI-powered real-time network threat assessment
                                        </p>
                                    </div>

                                    <div className="monitoring-badge">
                                        ● {traffic.status}
                                    </div>
                                </div>


                                <div className="threat-content">

                                    <div className="threat-item">

                                        <span className="threat-label">
                                            Current Threat
                                        </span>

                                        <strong className="threat-value">
                                            {traffic.threat}
                                        </strong>

                                    </div>


                                    <div className="threat-item">

                                        <span className="threat-label">
                                            Risk Level
                                        </span>

                                        <strong className="risk-value">
                                            {traffic.risk}
                                        </strong>

                                    </div>


                                    <div className="threat-item">

                                        <span className="threat-label">
                                            AI Confidence
                                        </span>

                                        <strong className="confidence-value">
                                            {traffic.confidence}%
                                        </strong>

                                    </div>


                                    <div className="threat-item">

                                        <span className="threat-label">
                                            Last Analysis
                                        </span>

                                        <strong className="time-value">
                                            {traffic.threatTime}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                        </>

                    )}

                </div>

            </div>

        </div>

    );

}

export default Traffic;