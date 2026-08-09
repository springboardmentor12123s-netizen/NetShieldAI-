import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/workflow.css";

function Workflow() {

    const [collapsed, setCollapsed] = useState(false);
    const [live, setLive] = useState({
        packets: 0,
        connections: 0,
        interface: "Wi-Fi"
    });
    const navigate = useNavigate();

    const [criticalAlert, setCriticalAlert] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            icon: "📡",
            title: "Network Monitoring",
            description: "Collect live network traffic from the active interface.",
            status: "ACTIVE"
        },
        {
            icon: "🔍",
            title: "Traffic Analysis",
            description: "Analyse packets, connections and network behaviour.",
            status: "ACTIVE"
        },
        {
            icon: "🧠",
            title: "AI Detection",
            description: "Random Forest analyses extracted traffic features.",
            status: "ACTIVE"
        },
        {
            icon: "🔔",
            title: "Alert Notification",
            description: "Security alerts are generated when suspicious activity is detected.",
            status: "READY"
        },
        {
            icon: "🔎",
            title: "Investigation",
            description: "Analysts review the detected threat and its network details.",
            status: "READY"
        },
        {
            icon: "🛡️",
            title: "Response & Resolution",
            description: "Recommended action is taken and the incident is resolved.",
            status: "READY"
        }
    ];
    useEffect(() => {

    const checkThreat = () => {

        axios
            .get("http://127.0.0.1:5000/api/live")
            .then((res) => {

                const data = res.data;

                if (
                    data.risk &&
                    data.risk.toUpperCase() === "CRITICAL"
                ) {

                    setCriticalAlert({
                        attack: data.threat || "Critical Threat",
                        confidence: data.confidence || "Unknown"
                    });

                    setAlertVisible(true);
                }

            })
            .catch(() => {});

    };

    checkThreat();

    const interval = setInterval(checkThreat, 1000);

    return () => clearInterval(interval);

}, []);

    useEffect(() => {

    const fetchLive = () => {

        axios
            .get("http://127.0.0.1:5000/api/live")
            .then((res) => {

                const data = res.data;

                setLive(data);

                if (
                    data.risk &&
                    data.risk.toUpperCase() === "CRITICAL"
                ) {

                    setCriticalAlert((previous) => {

                        if (
                            previous &&
                            previous.attack === data.threat &&
                            previous.time === data.threatTime
                        ) {
                            return previous;
                        }

                        return {
                            attack: data.threat,
                            confidence: data.confidence,
                            time: data.threatTime
                        };

                    });

                }

            })
            .catch((err) => {

                console.log("Live monitoring error:", err);

            });

    };

    fetchLive();

    const interval = setInterval(fetchLive, 1000);

    return () => clearInterval(interval);

}, []);


    useEffect(() => {

        const interval = setInterval(() => {

            setActiveStep((previous) =>
                previous >= steps.length - 1
                    ? 0
                    : previous + 1
            );

        }, 4000);

        return () => clearInterval(interval);

    }, [steps.length]);


    return (

        <div className="dashboard">

            <Sidebar
                collapsed={collapsed}
                toggleSidebar={() =>
                    setCollapsed(!collapsed)
                }
            />

            <div className="main">
                {alertVisible && criticalAlert && (

    <div className="critical-popup">

        <div className="critical-popup-header">

            <span>🚨</span>

            <strong>
                CRITICAL THREAT DETECTED
            </strong>

            <button
                onClick={() => setAlertVisible(false)}
            >
                ×
            </button>

        </div>

        <div className="critical-popup-body">

            <h2>
                {criticalAlert.attack}
            </h2>

            <p>
                NetShield AI detected a critical
                security threat on the network.
            </p>

            <div className="critical-details">

                <div>
                    <span>Risk</span>
                    <strong>CRITICAL</strong>
                </div>

                <div>
                    <span>Confidence</span>
                    <strong>
                        {criticalAlert.confidence}%
                    </strong>
                </div>

            </div>

            <button
                className="view-alert-button"
                onClick={() => navigate("/alerts")}
            >
                🔎 View Alert
            </button>

        </div>

    </div>

)}

                <Navbar />

                <div className="workflow-page">


                    {/* HEADER */}

                    <div className="workflow-header">

                        <div>

                            <h1>
                                🤖 Security Monitoring Workflow
                            </h1>

                            <p>
                                End-to-end AI-powered network threat detection and incident response
                            </p>

                        </div>

                        <div className="workflow-live">

                            <span>●</span>

                            Monitoring Active

                        </div>

                    </div>


                    {/* LIVE NETWORK STATUS */}

                    <div className="workflow-stats">

                        <div className="workflow-stat">

                            <span>Network Interface</span>

                            <strong>
                                📡 {live.interface}
                            </strong>

                        </div>


                        <div className="workflow-stat">

                            <span>Packets / sec</span>

                            <strong>
                                {live.packets}
                            </strong>

                        </div>


                        <div className="workflow-stat">

                            <span>Active Connections</span>

                            <strong>
                                {live.connections}
                            </strong>

                        </div>


                        <div className="workflow-stat">

                            <span>AI Engine</span>

                            <strong className="green-text">
                                ● Online
                            </strong>

                        </div>

                    </div>


                    {/* WORKFLOW */}

                    <div className="workflow-card">

                        <div className="section-heading">

                            <div>

                                <h2>
                                    🔄 Detection & Response Pipeline
                                </h2>

                                <p>
                                    How NetShield AI processes network activity
                                </p>

                            </div>

                            <span className="pipeline-status">
                                LIVE PIPELINE
                            </span>

                        </div>


                        <div className="workflow-pipeline">

                            {steps.map((step, index) => (

                                <div
                                    key={step.title}
                                    className={`workflow-step ${
                                        index === activeStep
                                            ? "active-step"
                                            : ""
                                    } ${
                                        index < activeStep
                                            ? "completed-step"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setActiveStep(index)
                                    }
                                >

                                    <div className="step-number">

                                        {index < activeStep
                                            ? "✓"
                                            : index + 1}

                                    </div>

                                    <div className="step-icon">

                                        {step.icon}

                                    </div>

                                    <h3>
                                        {step.title}
                                    </h3>

                                    <p>
                                        {step.description}
                                    </p>

                                    <span
                                        className={
                                            step.status === "ACTIVE"
                                                ? "step-status active"
                                                : "step-status"
                                        }
                                    >
                                        {index === activeStep
                                            ? "● PROCESSING"
                                            : step.status}
                                    </span>

                                </div>

                            ))}

                        </div>

                    </div>


                    {/* CURRENT PROCESS */}

                    <div className="workflow-grid">


                        <div className="process-card">

                            <div className="section-heading">

                                <div>

                                    <h2>
                                        ⚡ Current Process
                                    </h2>

                                    <p>
                                        Live workflow activity
                                    </p>

                                </div>

                            </div>


                            <div className="current-process">

                                <div className="process-icon">
                                    {steps[activeStep].icon}
                                </div>

                                <div>

                                    <span>
                                        CURRENT STAGE
                                    </span>

                                    <h2>
                                        {steps[activeStep].title}
                                    </h2>

                                    <p>
                                        {steps[activeStep].description}
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* NOTIFICATION WORKFLOW */}

                        <div className="process-card">

                            <div className="section-heading">

                                <div>

                                    <h2>
                                        🔔 Notification Workflow
                                    </h2>

                                    <p>
                                        Security event notification status
                                    </p>

                                </div>

                            </div>


                            <div className="notification-list">

                                <div className="notification-item">

                                    <span className="notification-icon">
                                        📡
                                    </span>

                                    <div>

                                        <strong>
                                            Traffic Monitoring
                                        </strong>

                                        <small>
                                            Live network activity monitored
                                        </small>

                                    </div>

                                    <b className="green-text">
                                        ACTIVE
                                    </b>

                                </div>


                                <div className="notification-item">

                                    <span className="notification-icon">
                                        🧠
                                    </span>

                                    <div>

                                        <strong>
                                            AI Threat Detection
                                        </strong>

                                        <small>
                                            Random Forest classification enabled
                                        </small>

                                    </div>

                                    <b className="green-text">
                                        ACTIVE
                                    </b>

                                </div>


                                <div className="notification-item">

                                    <span className="notification-icon">
                                        🚨
                                    </span>

                                    <div>

                                        <strong>
                                            Alert Generation
                                        </strong>

                                        <small>
                                            Critical and high-risk events create alerts
                                        </small>

                                    </div>

                                    <b className="green-text">
                                        READY
                                    </b>

                                </div>


                                <div className="notification-item">

                                    <span className="notification-icon">
                                        🔔
                                    </span>

                                    <div>

                                        <strong>
                                            Notification
                                        </strong>

                                        <small>
                                            Security event notification workflow
                                        </small>

                                    </div>

                                    <b className="green-text">
                                        READY
                                    </b>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* INCIDENT LIFECYCLE */}

                    <div className="lifecycle-card">

                        <div className="section-heading">

                            <div>

                                <h2>
                                    🛡️ Incident Lifecycle
                                </h2>

                                <p>
                                    Standard response workflow for detected threats
                                </p>

                            </div>

                        </div>


                        <div className="lifecycle">

                            <div className="life-step">
                                <span>1</span>
                                <strong>Detect</strong>
                                <small>AI identifies suspicious traffic</small>
                            </div>

                            <div className="life-arrow">
                                →
                            </div>

                            <div className="life-step">
                                <span>2</span>
                                <strong>Notify</strong>
                                <small>Alert is generated</small>
                            </div>

                            <div className="life-arrow">
                                →
                            </div>

                            <div className="life-step">
                                <span>3</span>
                                <strong>Investigate</strong>
                                <small>Analyst examines the incident</small>
                            </div>

                            <div className="life-arrow">
                                →
                            </div>

                            <div className="life-step">
                                <span>4</span>
                                <strong>Respond</strong>
                                <small>Recommended security action</small>
                            </div>

                            <div className="life-arrow">
                                →
                            </div>

                            <div className="life-step">
                                <span>5</span>
                                <strong>Resolve</strong>
                                <small>Incident is closed</small>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Workflow;