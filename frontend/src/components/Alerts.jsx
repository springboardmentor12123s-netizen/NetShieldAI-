import React, { useState, useEffect } from 'react';

export default function Alerts({ userRole }) {
    const [alerts, setAlerts] = useState([]);
    const [severity, setSeverity] = useState('Low');
    const [message, setMessage] = useState('');
    const [sourceIp, setSourceIp] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const API_URL = "http://127.0.0.1:8000";
    const isReadOnly = userRole === "Auditor";

    const fetchAlerts = async () => {
        try {
            const response = await fetch(`${API_URL}/alerts`);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data);
            }
        } catch (err) {
            console.error("Error fetching alerts:", err);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) {
            setStatusMessage("Access Denied: Auditors cannot create alerts.");
            return;
        }
        setStatusMessage('');
        try {
            const response = await fetch(`${API_URL}/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ severity, message, source_ip: sourceIp })
            });
            if (response.ok) {
                setStatusMessage("Alert successfully added to backend database.");
                setMessage('');
                setSourceIp('');
                fetchAlerts();
            } else {
                setStatusMessage("Failed to submit alert.");
            }
        } catch (err) {
            setStatusMessage("Error contacting backend.");
        }
    };

    return (
        <div className="container">
            <h2>Report / Trigger New Custom Alert</h2>
            {isReadOnly ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>
                    Compliance Read-Only Mode (Auditor Role active. Forms disabled)
                </p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Severity Level</label>
                        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Alert Message / Detection Notes</label>
                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. DDOS anomaly detected" required />
                    </div>
                    <div className="form-group">
                        <label>Source IP Address</label>
                        <input type="text" value={sourceIp} onChange={(e) => setSourceIp(e.target.value)} placeholder="192.168.10.45" required />
                    </div>
                    <button type="submit">Submit Alert Log</button>
                </form>
            )}
            {statusMessage && <p style={{ color: 'blue' }}>{statusMessage}</p>}

            <h2>Logged Alerts</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Severity</th>
                        <th>Message</th>
                        <th>Source IP</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center' }}>No alerts logged yet.</td>
                        </tr>
                    ) : (
                        alerts.map((alert) => (
                            <tr key={alert.id} className={`alert-${alert.severity}`}>
                                <td>{alert.id}</td>
                                <td>{alert.severity}</td>
                                <td>{alert.message}</td>
                                <td>{alert.source_ip} {alert.source_ip_geo ? `(${alert.source_ip_geo})` : ''}</td>
                                <td>{new Date(alert.timestamp).toLocaleString()}</td>
                                <td>{alert.status}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
