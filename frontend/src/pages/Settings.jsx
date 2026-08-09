import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/settings.css";

function Settings() {

    const [collapsed, setCollapsed] = useState(false);

    const [notifications, setNotifications] = useState(true);
    const [criticalAlerts, setCriticalAlerts] = useState(true);
    const [highAlerts, setHighAlerts] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const [saved, setSaved] = useState(false);

    const saveSettings = () => {

        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 2500);
    };

    return (

        <div className="dashboard">

            <Sidebar
                collapsed={collapsed}
                toggleSidebar={() =>
                    setCollapsed(!collapsed)
                }
            />

            <div className="main">

                <Navbar />

                <div className="settings-page">

                    <div className="settings-header">

                        <div>

                            <h1>
                                ⚙ Settings
                            </h1>

                            <p>
                                Configure NetShield AI monitoring,
                                security and notification preferences.
                            </p>

                        </div>

                        <div className="system-online">
                            <span>●</span>
                            System Online
                        </div>

                    </div>


                    {saved && (

                        <div className="settings-saved">
                            ✓ Settings saved successfully
                        </div>

                    )}


                    <div className="settings-grid">


                        {/* MONITORING */}

                        <div className="settings-card">

                            <div className="settings-title">

                                <div className="settings-icon">
                                    📡
                                </div>

                                <div>

                                    <h2>
                                        Network Monitoring
                                    </h2>

                                    <p>
                                        Configure live traffic monitoring
                                    </p>

                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Monitoring Status
                                    </strong>

                                    <span>
                                        Continuously monitor network activity
                                    </span>

                                </div>

                                <div className="status-active">
                                    ● ACTIVE
                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Network Interface
                                    </strong>

                                    <span>
                                        Interface used for monitoring
                                    </span>

                                </div>

                                <select defaultValue="Wi-Fi">

                                    <option>
                                        Wi-Fi
                                    </option>

                                    <option>
                                        Ethernet
                                    </option>

                                    <option>
                                        Auto Detect
                                    </option>

                                </select>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Auto Refresh
                                    </strong>

                                    <span>
                                        Update monitoring data automatically
                                    </span>

                                </div>

                                <label className="switch">

                                    <input
                                        type="checkbox"
                                        checked={autoRefresh}
                                        onChange={() =>
                                            setAutoRefresh(!autoRefresh)
                                        }
                                    />

                                    <span className="slider"></span>

                                </label>

                            </div>

                        </div>


                        {/* AI DETECTION */}

                        <div className="settings-card">

                            <div className="settings-title">

                                <div className="settings-icon">
                                    🧠
                                </div>

                                <div>

                                    <h2>
                                        AI Threat Detection
                                    </h2>

                                    <p>
                                        Configure the security detection engine
                                    </p>

                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Detection Model
                                    </strong>

                                    <span>
                                        Machine learning model used for classification
                                    </span>

                                </div>

                                <strong className="model-name">
                                    Random Forest
                                </strong>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Detection Engine
                                    </strong>

                                    <span>
                                        Real-time threat classification
                                    </span>

                                </div>

                                <div className="status-active">
                                    ● ONLINE
                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Confidence Threshold
                                    </strong>

                                    <span>
                                        Minimum confidence for threat classification
                                    </span>

                                </div>

                                <select defaultValue="90%">

                                    <option>70%</option>
                                    <option>80%</option>
                                    <option>90%</option>
                                    <option>95%</option>

                                </select>

                            </div>

                        </div>


                        {/* NOTIFICATIONS */}

                        <div className="settings-card">

                            <div className="settings-title">

                                <div className="settings-icon">
                                    🔔
                                </div>

                                <div>

                                    <h2>
                                        Notifications
                                    </h2>

                                    <p>
                                        Configure security alert notifications
                                    </p>

                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Security Notifications
                                    </strong>

                                    <span>
                                        Receive notifications for detected threats
                                    </span>

                                </div>

                                <label className="switch">

                                    <input
                                        type="checkbox"
                                        checked={notifications}
                                        onChange={() =>
                                            setNotifications(!notifications)
                                        }
                                    />

                                    <span className="slider"></span>

                                </label>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Critical Alerts
                                    </strong>

                                    <span>
                                        Immediately notify for critical threats
                                    </span>

                                </div>

                                <label className="switch">

                                    <input
                                        type="checkbox"
                                        checked={criticalAlerts}
                                        onChange={() =>
                                            setCriticalAlerts(!criticalAlerts)
                                        }
                                    />

                                    <span className="slider"></span>

                                </label>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        High Risk Alerts
                                    </strong>

                                    <span>
                                        Notify when high-risk activity is detected
                                    </span>

                                </div>

                                <label className="switch">

                                    <input
                                        type="checkbox"
                                        checked={highAlerts}
                                        onChange={() =>
                                            setHighAlerts(!highAlerts)
                                        }
                                    />

                                    <span className="slider"></span>

                                </label>

                            </div>

                        </div>


                        {/* SECURITY */}

                        <div className="settings-card">

                            <div className="settings-title">

                                <div className="settings-icon">
                                    🛡️
                                </div>

                                <div>

                                    <h2>
                                        Security
                                    </h2>

                                    <p>
                                        System security and access information
                                    </p>

                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Authentication
                                    </strong>

                                    <span>
                                        Role-based access control
                                    </span>

                                </div>

                                <div className="status-active">
                                    ● ENABLED
                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        Session Security
                                    </strong>

                                    <span>
                                        Protected authenticated session
                                    </span>

                                </div>

                                <div className="status-active">
                                    ● SECURE
                                </div>

                            </div>


                            <div className="setting-row">

                                <div>

                                    <strong>
                                        API Connection
                                    </strong>

                                    <span>
                                        Flask backend communication
                                    </span>

                                </div>

                                <div className="status-active">
                                    ● CONNECTED
                                </div>

                            </div>

                        </div>


                        {/* SYSTEM */}

                        <div className="settings-card system-card">

                            <div className="settings-title">

                                <div className="settings-icon">
                                    💻
                                </div>

                                <div>

                                    <h2>
                                        System Information
                                    </h2>

                                    <p>
                                        NetShield AI platform information
                                    </p>

                                </div>

                            </div>


                            <div className="system-info">

                                <div>
                                    <span>Application</span>
                                    <strong>NetShield AI</strong>
                                </div>

                                <div>
                                    <span>Version</span>
                                    <strong>1.0.0</strong>
                                </div>

                                <div>
                                    <span>Backend</span>
                                    <strong>Flask API</strong>
                                </div>

                                <div>
                                    <span>Frontend</span>
                                    <strong>React</strong>
                                </div>

                                <div>
                                    <span>AI Engine</span>
                                    <strong>Random Forest</strong>
                                </div>

                                <div>
                                    <span>Monitoring</span>
                                    <strong className="green-text">
                                        Active
                                    </strong>
                                </div>

                            </div>

                        </div>


                    </div>


                    <div className="settings-footer">

                        <span>
                            NetShield AI Security Platform
                        </span>

                        <button
                            onClick={saveSettings}
                        >
                            💾 Save Settings
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Settings;