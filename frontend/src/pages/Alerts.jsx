import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/alerts.css";
import jsPDF from "jspdf";
function Alerts() {

    const [collapsed, setCollapsed] = useState(false);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedAlert, setSelectedAlert] = useState(null);

    const [alerts, setAlerts] = useState([
        {
            id: 1,
            attack: "Port Scan",
            risk: "HIGH",
            confidence: "97.8%",
            source: "192.168.1.15",
            destination: "192.168.1.1",
            protocol: "TCP",
            time: "18:42:11",
            recommendation: "Block Source IP Immediately",
            category: "Reconnaissance",
            status: "ACTIVE"
        },
        {
            id: 2,
            attack: "DoS",
            risk: "CRITICAL",
            confidence: "99.1%",
            source: "10.0.0.52",
            destination: "192.168.1.1",
            protocol: "TCP",
            time: "18:45:20",
            recommendation: "Isolate Device",
            category: "Denial of Service",
            status: "ACTIVE"
        },
        {
            id: 3,
            attack: "BENIGN",
            risk: "LOW",
            confidence: "99.7%",
            source: "Local Network",
            destination: "Router",
            protocol: "TCP",
            time: "18:46:32",
            recommendation: "Continue Monitoring",
            category: "Normal Traffic",
            status: "ACTIVE"
        },
        {
            id: 4,
            attack: "Brute Force",
            risk: "HIGH",
            confidence: "96.4%",
            source: "192.168.1.25",
            destination: "192.168.1.10",
            protocol: "TCP",
            time: "18:48:03",
            recommendation: "Block Source and Reset Credentials",
            category: "Credential Access",
            status: "ACTIVE"
        },
        {
            id: 5,
            attack: "Web Attack",
            risk: "MEDIUM",
            confidence: "94.2%",
            source: "10.0.0.31",
            destination: "192.168.1.20",
            protocol: "HTTP",
            time: "18:50:17",
            recommendation: "Inspect Web Server Logs",
            category: "Initial Access",
            status: "ACTIVE"
        }
    ]);

    const filteredAlerts = alerts.filter((alert) => {

        const matchFilter =
            filter === "All"
                ? true
                : alert.risk === filter;

        const matchSearch =
            alert.attack
                .toLowerCase()
                .includes(search.toLowerCase());

        return matchFilter && matchSearch;
    });

    const resolveAlert = (id) => {

        setAlerts((previous) =>
            previous.map((alert) =>
                alert.id === id
                    ? { ...alert, status: "RESOLVED" }
                    : alert
            )
        );

        if (selectedAlert && selectedAlert.id === id) {
            setSelectedAlert({
                ...selectedAlert,
                status: "RESOLVED"
            });
        }
    };

    const criticalCount =
        alerts.filter((a) => a.risk === "CRITICAL").length;

    const highCount =
        alerts.filter((a) => a.risk === "HIGH").length;

    const mediumCount =
        alerts.filter((a) => a.risk === "MEDIUM").length;

    const lowCount =
        alerts.filter((a) => a.risk === "LOW").length;

    return (
        <div className="dashboard">

            <Sidebar
                collapsed={collapsed}
                toggleSidebar={() => setCollapsed(!collapsed)}
            />

            <div className="main">

                <Navbar />

                <div className="alerts-page">

                    <div className="alerts-header">

                        <div>
                            <h1>🚨 Alert Management Center</h1>
                            <p>
                                AI-powered security alerts and incident management
                            </p>
                        </div>

                        <div className="monitoring-badge">
                            🟢 System Monitoring
                        </div>

                    </div>

                    {/* SUMMARY CARDS */}

                    <div className="alert-summary">

                        <div className="alert-stat critical">
                            <strong>{criticalCount}</strong>
                            <span>Critical Alerts</span>
                        </div>

                        <div className="alert-stat high">
                            <strong>{highCount}</strong>
                            <span>High Risk</span>
                        </div>

                        <div className="alert-stat medium">
                            <strong>{mediumCount}</strong>
                            <span>Medium Risk</span>
                        </div>

                        <div className="alert-stat low">
                            <strong>{lowCount}</strong>
                            <span>Low Risk</span>
                        </div>

                    </div>

                    {/* SEARCH + FILTER */}

                    <div className="alert-controls">

                        <input
                            type="text"
                            placeholder="🔍 Search attack..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <div className="filter-buttons">

                            {["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(
                                (level) => (

                                    <button
                                        key={level}
                                        className={
                                            filter === level
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() => setFilter(level)}
                                    >
                                        {level}
                                    </button>

                                )
                            )}

                        </div>

                    </div>

                    <div className="alerts-content">

                        {/* ALERT LIST */}

                        <div className="alert-list">

                            {filteredAlerts.map((alert) => (

                                <div
                                    className={`alert-card ${alert.risk.toLowerCase()} ${alert.status.toLowerCase()}`}
                                    key={alert.id}
                                >

                                    <div className="alert-card-header">

                                        <h2>
                                            🚨 {alert.attack}
                                        </h2>

                                        <span className="risk-badge">
                                            {alert.risk}
                                        </span>

                                    </div>

                                    <div className="alert-grid">

                                        <div>
                                            <span>Confidence</span>
                                            <strong>
                                                {alert.confidence}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Protocol</span>
                                            <strong>
                                                {alert.protocol}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Source</span>
                                            <strong>
                                                {alert.source}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Destination</span>
                                            <strong>
                                                {alert.destination}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Category</span>
                                            <strong>
                                                {alert.category}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Status</span>
                                            <strong>
                                                {alert.status}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="recommendation">

                                        <span>🤖 AI Recommendation</span>

                                        <strong>
                                            {alert.recommendation}
                                        </strong>

                                    </div>

                                    <div className="alert-actions">

                                        <button
                                            className="investigate"
                                            onClick={() =>
                                                setSelectedAlert(alert)
                                            }
                                        >
                                            🔎 Investigate
                                        </button>

                                        <button
                                            className="resolve"
                                            disabled={
                                                alert.status === "RESOLVED"
                                            }
                                            onClick={() =>
                                                resolveAlert(alert.id)
                                            }
                                        >
                                            {alert.status === "RESOLVED"
                                                ? "✓ Resolved"
                                                : "✓ Resolve"}
                                        </button>

                                    </div>

                                </div>

                            ))}

                            {filteredAlerts.length === 0 && (

                                <div className="no-alerts">
                                    🔍 No alerts found
                                </div>

                            )}

                        </div>

                        {/* THREAT INTELLIGENCE */}

                        <div className="threat-intel">

                            <h2>🧠 Threat Intelligence</h2>

                            <div className="intel-item">
                                <span>AI Engine</span>
                                <strong>Random Forest</strong>
                            </div>

                            <div className="intel-item">
                                <span>Detection Mode</span>
                                <strong>Live Network</strong>
                            </div>

                            <div className="intel-item">
                                <span>Network Status</span>
                                <strong className="green">
                                    ● Monitoring
                                </strong>
                            </div>

                            <div className="intel-item">
                                <span>Threat Detection</span>
                                <strong className="green">
                                    Active
                                </strong>
                            </div>

                            <div className="intel-item">
                                <span>Security Score</span>
                                <strong>91%</strong>
                            </div>

                            <hr />

                            <h3>📊 Attack Distribution</h3>

                            <div className="attack-bar">
                                <span>Critical</span>
                                <div>
                                    <i style={{
                                        width: `${criticalCount * 25}%`
                                    }}></i>
                                </div>
                            </div>

                            <div className="attack-bar">
                                <span>High</span>
                                <div>
                                    <i style={{
                                        width: `${highCount * 25}%`
                                    }}></i>
                                </div>
                            </div>

                            <div className="attack-bar">
                                <span>Medium</span>
                                <div>
                                    <i style={{
                                        width: `${mediumCount * 25}%`
                                    }}></i>
                                </div>
                            </div>

                            <div className="attack-bar">
                                <span>Low</span>
                                <div>
                                    <i style={{
                                        width: `${lowCount * 25}%`
                                    }}></i>
                                </div>
                            </div>

                            <button
    className="report-button"
    onClick={() => {

        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.setTextColor(0, 180, 230);
        doc.text("NetShield AI", 20, 20);

        doc.setFontSize(16);
        doc.setTextColor(30, 30, 30);
        doc.text("Threat Intelligence Report", 20, 32);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);

        doc.text(
            `Generated: ${new Date().toLocaleString()}`,
            20,
            42
        );

        doc.line(20, 47, 190, 47);

        let y = 60;

        doc.setFontSize(13);
        doc.setTextColor(0, 150, 200);
        doc.text("SYSTEM STATUS", 20, y);

        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);

        doc.text("AI Engine: Random Forest", 20, y);
        y += 7;

        doc.text("Detection Mode: Live Network", 20, y);
        y += 7;

        doc.text("Network Status: Monitoring", 20, y);
        y += 7;

        doc.text("Threat Detection: Active", 20, y);
        y += 7;

        doc.text("Security Score: 91%", 20, y);

        y += 15;

        doc.setFontSize(13);
        doc.setTextColor(0, 150, 200);
        doc.text("ALERT SUMMARY", 20, y);

        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);

        doc.text(
            `Critical Alerts: ${criticalCount}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `High Risk Alerts: ${highCount}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Medium Risk Alerts: ${mediumCount}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Low Risk Alerts: ${lowCount}`,
            20,
            y
        );

        y += 15;

        doc.setFontSize(13);
        doc.setTextColor(0, 150, 200);
        doc.text("DETECTED THREATS", 20, y);

        y += 10;

        alerts.forEach((alert, index) => {

            if (y > 260) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(12);
            doc.setTextColor(30, 30, 30);

            doc.text(
                `Threat ${index + 1}: ${alert.attack}`,
                20,
                y
            );

            y += 7;

            doc.setFontSize(10);

            doc.text(
                `Risk: ${alert.risk}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Confidence: ${alert.confidence}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Source: ${alert.source}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Destination: ${alert.destination}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Protocol: ${alert.protocol}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Category: ${alert.category}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Status: ${alert.status}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Detection Time: ${alert.time}`,
                25,
                y
            );

            y += 6;

            doc.text(
                `Recommendation: ${alert.recommendation}`,
                25,
                y
            );

            y += 10;

            doc.line(20, y, 190, y);

            y += 10;
        });

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);

        doc.text(
            "Generated by NetShield AI Cyber Security Monitoring System",
            20,
            285
        );

        doc.save(
            `NetShield_Threat_Report_${Date.now()}.pdf`
        );

    }}
>
    📄 Generate Threat Report
</button>

                        </div>

                    </div>

                </div>

            </div>

            {/* INVESTIGATION MODAL */}

            {selectedAlert && (

                <div
                    className="modal-overlay"
                    onClick={() => setSelectedAlert(null)}
                >

                    <div
                        className="incident-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-header">

                            <div>
                                <span>🚨 SECURITY INCIDENT</span>
                                <h2>{selectedAlert.attack}</h2>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setSelectedAlert(null)}
                            >
                                ✕
                            </button>

                        </div>

                        <div className="incident-risk">
                            <span>Risk Level</span>
                            <strong>
                                {selectedAlert.risk}
                            </strong>
                        </div>

                        <div className="incident-grid">

                            <div>
                                <span>Confidence</span>
                                <strong>
                                    {selectedAlert.confidence}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>
                                    {selectedAlert.status}
                                </strong>
                            </div>

                            <div>
                                <span>Source IP</span>
                                <strong>
                                    {selectedAlert.source}
                                </strong>
                            </div>

                            <div>
                                <span>Destination</span>
                                <strong>
                                    {selectedAlert.destination}
                                </strong>
                            </div>

                            <div>
                                <span>Protocol</span>
                                <strong>
                                    {selectedAlert.protocol}
                                </strong>
                            </div>

                            <div>
                                <span>Detection Time</span>
                                <strong>
                                    {selectedAlert.time}
                                </strong>
                            </div>

                            <div>
                                <span>Attack Category</span>
                                <strong>
                                    {selectedAlert.category}
                                </strong>
                            </div>

                            <div>
                                <span>Detection Model</span>
                                <strong>
                                    Random Forest
                                </strong>
                            </div>

                        </div>

                        <div className="incident-analysis">

                            <h3>🤖 AI Assessment</h3>

                            <p>
                                Suspicious network activity was detected
                                and classified by the AI threat detection
                                engine.
                            </p>

                        </div>

                        <div className="incident-recommendation">

                            <h3>🛡 Recommended Action</h3>

                            <p>
                                {selectedAlert.recommendation}
                            </p>

                        </div>

                        <div className="modal-actions">

                            {selectedAlert.status !== "RESOLVED" && (

                                <button
                                    className="resolve"
                                    onClick={() =>
                                        resolveAlert(selectedAlert.id)
                                    }
                                >
                                    ✓ Resolve Incident
                                </button>

                            )}

                            <button
                                className="close-btn"
                                onClick={() => setSelectedAlert(null)}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Alerts;