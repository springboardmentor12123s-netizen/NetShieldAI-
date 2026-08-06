import React, { useState, useEffect } from 'react';

const API_URL = "http://127.0.0.1:8000";

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_packets_processed: 0,
        total_alerts_triggered:  0,
        active_incidents:        0,
        mongodb_packet_records:  0,
        system_status:           'Offline',
        cpu_usage_pct:           0,
        memory_usage_pct:        0,
        models_trained:          false,
        anomaly_rate_pct:        0,
        threats_blocked_today:   0,
    });
        const [datasetSamples,   setDatasetSamples]   = useState({ unsw_sample: [], cicids_sample: [] });
    const [datasetStats,     setDatasetStats]      = useState(null);
    const [myTasks,          setMyTasks]           = useState([]);
 
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard/stats`);
            if (res.ok) setStats(await res.json());
        } catch (err) { console.error("Stats error:", err); }
    };
 
    const fetchMyTasks = async () => {
        const currentUser = localStorage.getItem('username') || '';
        try {
            const res = await fetch(`${API_URL}/incidents`);
            if (res.ok) {
                const all = await res.json();
                const assigned = all.filter(inc => inc.assigned_to === currentUser && inc.status === 'Open');
                setMyTasks(assigned);
            }
        } catch (err) { console.error("Error fetching tasks:", err); }
    };

    const handleResolveTask = async (taskId) => {
        try {
            const res = await fetch(`${API_URL}/incidents/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Closed' })
            });
            if (res.ok) {
                fetchMyTasks();
                fetchStats();
            }
        } catch (err) { console.error("Resolve task error:", err); }
    };

    const handleReset = async () => {
        if (window.confirm("Are you sure you want to reset all live packet metrics, SQL alerts, and threats back to 0?")) {
            try {
                const res = await fetch(`${API_URL}/monitoring/reset`, { method: 'POST' });
                if (res.ok) {
                    alert("All databases cleared and live sniffer counters reset to 0!");
                    fetchStats();
                    fetchMyTasks();
                } else {
                    alert("Failed to clear data.");
                }
            } catch (err) {
                console.error("Reset error:", err);
            }
        }
    };
 
    const fetchDatasetSamples = async () => {
        try {
            const res = await fetch(`${API_URL}/dataset/sample`);
            if (res.ok) setDatasetSamples(await res.json());
        } catch (err) { console.error("Dataset sample error:", err); }
    };
 
    const fetchDatasetStats = async () => {
        try {
            const res = await fetch(`${API_URL}/dataset/stats`);
            if (res.ok) setDatasetStats(await res.json());
        } catch (err) { console.error("Dataset stats error:", err); }
    };
 
    useEffect(() => {
        fetchStats();
        fetchMyTasks();
        fetchDatasetSamples();
        fetchDatasetStats();
        const interval = setInterval(() => {
            fetchStats();
            fetchMyTasks();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container">
            {myTasks.length > 0 && (
                <div style={{
                    background: 'rgba(231, 76, 60, 0.08)',
                    border: '1px solid rgba(231, 76, 60, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#c0392b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                        🔔 Role Notification: You have {myTasks.length} active threat investigation task(s) assigned to you!
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {myTasks.map(task => (
                            <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: '4px', borderLeft: '4px solid #c0392b', fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Ticket #{task.id}: {task.title}</span>
                                    <span style={{ marginLeft: '10px', color: '#7f8c8d' }}>({task.severity} severity)</span>
                                </div>
                                <button
                                    onClick={() => handleResolveTask(task.id)}
                                    style={{
                                        padding: '4px 10px',
                                        background: '#27ae60',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✓ Complete Task
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>SOC System Overview &amp; Telemetry</h2>
                <button 
                    onClick={handleReset} 
                    style={{ 
                        padding: '8px 16px', 
                        background: '#c0392b', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#e74c3c'}
                    onMouseOut={(e) => e.target.style.background = '#c0392b'}
                >
                    🚨 Reset Telemetry (Zero Out)
                </button>
            </div>

            {/* Top KPI Cards */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                    { label: 'Packets Processed',    value: stats.total_packets_processed?.toLocaleString(), color: '#2980b9' },
                    { label: 'Total Alerts',         value: stats.total_alerts_triggered,  color: '#e74c3c' },
                    { label: 'Active Incidents',     value: stats.active_incidents,         color: '#e67e22' },
                    { label: 'Threats Blocked Today',value: stats.threats_blocked_today,    color: '#8e44ad' },
                    { label: 'Anomaly Rate',         value: `${stats.anomaly_rate_pct}%`,   color: '#c0392b' },
                    { label: 'System Status',        value: stats.system_status,            color: '#27ae60' },
                ].map(kpi => (
                    <div key={kpi.label} style={{ flex: '1 1 140px', border: '1px solid #ddd', padding: '14px', background: '#fafafa' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>{kpi.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Resources & AI Model Status */}
            <h2>System Resources &amp; AI Model Status</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Source</th>
                        <th>Value</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total Security Alerts</td>
                        <td>SQL Database (SQLite)</td>
                        <td>{stats.total_alerts_triggered}</td>
                        <td style={{ color: '#27ae60' }}>✓ Live</td>
                    </tr>
                    <tr>
                        <td>Active Incidents</td>
                        <td>SQL Database (SQLite)</td>
                        <td>{stats.active_incidents}</td>
                        <td style={{ color: '#27ae60' }}>✓ Live</td>
                    </tr>
                    <tr>
                        <td>Packet Records</td>
                        <td>MongoDB (NoSQL)</td>
                        <td>{stats.mongodb_packet_records}</td>
                        <td style={{ color: '#27ae60' }}>✓ Live</td>
                    </tr>
                    <tr>
                        <td>CPU Usage</td>
                        <td>Server Hardware</td>
                        <td>{stats.cpu_usage_pct}%</td>
                        <td style={{ color: stats.cpu_usage_pct > 80 ? '#e74c3c' : '#27ae60' }}>
                            {stats.cpu_usage_pct > 80 ? '⚠ High' : '✓ Normal'}
                        </td>
                    </tr>
                    <tr>
                        <td>Memory Usage</td>
                        <td>Server Hardware</td>
                        <td>{stats.memory_usage_pct}%</td>
                        <td style={{ color: stats.memory_usage_pct > 80 ? '#e74c3c' : '#27ae60' }}>
                            {stats.memory_usage_pct > 80 ? '⚠ High' : '✓ Normal'}
                        </td>
                    </tr>
                    <tr>
                        <td>AI Models</td>
                        <td>ML Engine (scikit-learn)</td>
                        <td>{stats.models_trained ? 'Isolation Forest + Random Forest' : 'Not Trained'}</td>
                        <td style={{ color: stats.models_trained ? '#27ae60' : '#e67e22', fontWeight: 'bold' }}>
                            {stats.models_trained ? '✓ Ready' : '⚠ Run train_model.py'}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Dataset Stats */}
            {datasetStats && (
                <>
                    <h2 style={{ marginTop: '28px' }}>Loaded Cybersecurity Datasets (Milestone 1)</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Dataset</th>
                                <th>File</th>
                                <th>Rows</th>
                                <th>Size</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'UNSW-NB15',  data: datasetStats.unsw_nb15 },
                                { name: 'CICIDS2017', data: datasetStats.cicids2017 }
                            ].map(ds => (
                                <tr key={ds.name}>
                                    <td><strong>{ds.name}</strong></td>
                                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{ds.data?.file}</td>
                                    <td>{ds.data?.rows?.toLocaleString() || 'N/A'}</td>
                                    <td>{ds.data?.size_mb} MB</td>
                                    <td style={{ color: ds.data?.status === 'loaded' ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                                        {ds.data?.status === 'loaded' ? '✓ Loaded' : '✗ Missing'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Dataset Sample Feeds */}
            <h2 style={{ marginTop: '28px' }}>Dataset Sample Feed Preview</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                    { title: 'UNSW-NB15 (First 5 Rows)', rows: datasetSamples.unsw_sample },
                    { title: 'CICIDS2017 (First 5 Rows)', rows: datasetSamples.cicids_sample }
                ].map(ds => (
                    <div key={ds.title} style={{ flex: '1 1 300px' }}>
                        <h3 style={{ fontSize: '14px' }}>{ds.title}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Protocol</th>
                                    <th>Total Length</th>
                                    <th>TTL</th>
                                    <th>Label</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(ds.rows || []).map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.protocol}</td>
                                        <td>{row.total_len}</td>
                                        <td>{row.ttl}</td>
                                        <td style={{ color: row.label === '1' ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
                                            {row.label === '1' ? 'Attack (1)' : 'Normal (0)'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}
