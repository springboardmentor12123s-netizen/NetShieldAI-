import React, { useState, useEffect } from 'react';

const API_URL = "http://127.0.0.1:8000";

export default function Tracker() {
    const [gmailAppPassword, setGmailAppPassword] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    const handleSaveSmtp = async (e) => {
        e.preventDefault();
        setSaveMessage('');
        try {
            const res = await fetch(`${API_URL}/auth/profile/smtp`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ gmail_app_password: gmailAppPassword })
            });
            if (res.ok) {
                setSaveMessage('Gmail App Password saved successfully!');
                setGmailAppPassword('');
            } else {
                const errResult = await res.json();
                setSaveMessage('Error: ' + (errResult.detail || 'Failed to save settings.'));
            }
        } catch (err) {
            setSaveMessage('Server communication error.');
        }
    };
    const [incidents, setIncidents] = useState([]);
    const [users,      setUsers]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const userRole = localStorage.getItem('role') || '';
    const username = localStorage.getItem('username') || '';

    const fetchTrackerData = async () => {
        try {
            const [iRes, uRes] = await Promise.all([
                fetch(`${API_URL}/incidents`),
                fetch(`${API_URL}/incidents/users`)
            ]);
            if (iRes.ok) setIncidents(await iRes.json());
            if (uRes.ok) setUsers(await uRes.json());
        } catch (err) {
            console.error("Tracker fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrackerData();
        const interval = setInterval(fetchTrackerData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="container"><p>Loading tracking data...</p></div>;
    }

    // Build metrics for each employee
    const employeeMetrics = users.map(user => {
        const userTasks = incidents.filter(i => i.assigned_to === user);
        const open = userTasks.filter(i => i.status === 'Open').length;
        const closed = userTasks.filter(i => i.status === 'Closed').length;
        const total = userTasks.length;
        const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
        return { user, open, closed, total, completionRate };
    });

    const myTasks = incidents.filter(i => i.assigned_to === username);
    const myOpen = myTasks.filter(i => i.status === 'Open');
    const myClosed = myTasks.filter(i => i.status === 'Closed');

    // Notification Log generator: treat any incident with an assignee as a notification event
    const notificationLogs = incidents
        .filter(i => i.assigned_to)
        .map(i => ({
            id: i.id,
            timestamp: i.created_at || 'Just Now',
            msg: `🔔 Ticket #${i.id} (${i.severity} severity) assigned to "${i.assigned_to}".`,
            status: i.status,
            assignee: i.assigned_to
        }));

    return (
        <div className="container">
            <h2 style={{ marginBottom: '24px' }}>🛡️ Task Tracker &amp; Notification History</h2>

            {/* Gmail Notification Settings Panel */}
            <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff', marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#2c3e50', fontSize: '15px' }}>
                    ✉️ Real-Time Gmail Alert Settings
                </h3>
                <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
                    Configure your Google Account <strong>App Password</strong> to send notifications directly from your registered email account to the assignee's email address in real-time.
                </p>
                <form onSubmit={handleSaveSmtp} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px' }}>
                    <input 
                        type="password" 
                        placeholder="Google App Password" 
                        value={gmailAppPassword} 
                        onChange={(e) => setGmailAppPassword(e.target.value)}
                        style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', flex: '1', maxWidth: '300px' }}
                        required
                    />
                    <button type="submit" style={{ padding: '6px 16px', fontSize: '12px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save App Password
                    </button>
                </form>
                {saveMessage && <p style={{ fontSize: '12px', color: saveMessage.startsWith('Error') ? 'red' : 'green', margin: '8px 0 0 0' }}>{saveMessage}</p>}
            </div>

            {/* Notification History panel */}
            <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff', marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#2c3e50', fontSize: '15px' }}>
                    📬 Notification Inbox History
                </h3>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                    {notificationLogs.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>No notifications generated yet.</p>
                    ) : (
                        notificationLogs.map((log, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                background: log.status === 'Open' ? 'rgba(230, 126, 34, 0.05)' : 'rgba(39, 174, 96, 0.05)', 
                                padding: '8px 12px', 
                                borderRadius: '4px',
                                borderLeft: `4px solid ${log.status === 'Open' ? '#e67e22' : '#27ae60'}`,
                                fontSize: '12px'
                            }}>
                                <span>{log.msg}</span>
                                <span style={{ 
                                    padding: '2px 6px', 
                                    borderRadius: '10px', 
                                    background: log.status === 'Open' ? '#e67e22' : '#27ae60', 
                                    color: '#fff', 
                                    fontSize: '10px', 
                                    fontWeight: 'bold' 
                                }}>
                                    {log.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Employee work tracker (Admin View vs Analyst View) */}
            {userRole === 'Admin' ? (
                <div>
                    <h3 style={{ color: '#2c3e50', marginBottom: '14px' }}>👤 Administrator Employee Work Tracker</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {employeeMetrics.map(emp => (
                            <div key={emp.user} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, color: '#34495e' }}>User: {emp.user}</h4>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: emp.open > 0 ? '#e74c3c' : '#27ae60' }}>
                                        {emp.open} Pending Tasks
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#7f8c8d', marginBottom: '12px' }}>
                                    <span>Total: <strong>{emp.total}</strong></span>
                                    <span>Completed: <strong>{emp.closed}</strong></span>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', marginBottom: '4px' }}>
                                        <span>Resolution Progress</span>
                                        <strong>{emp.completionRate}%</strong>
                                    </div>
                                    <div style={{ background: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{ width: `${emp.completionRate}%`, background: '#27ae60', height: '100%', transition: 'width 0.4s' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <h3 style={{ color: '#2c3e50', marginBottom: '14px' }}>📋 My Assigned Task Dashboard ({username})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff' }}>
                            <h4 style={{ marginTop: 0, color: '#e67e22', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>
                                Active Tasks ({myOpen.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                {myOpen.length === 0 ? (
                                    <p style={{ color: '#888', fontSize: '13px' }}>No active tasks assigned.</p>
                                ) : (
                                    myOpen.map(task => (
                                        <div key={task.id} style={{ background: '#fafafa', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #e67e22', fontSize: '12px' }}>
                                            <strong>Ticket #{task.id}: {task.title}</strong>
                                            <div style={{ color: '#7f8c8d', fontSize: '11px', marginTop: '4px' }}>Severity: {task.severity}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff' }}>
                            <h4 style={{ marginTop: 0, color: '#27ae60', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>
                                Completed Tasks ({myClosed.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                {myClosed.length === 0 ? (
                                    <p style={{ color: '#888', fontSize: '13px' }}>No completed tasks yet.</p>
                                ) : (
                                    myClosed.map(task => (
                                        <div key={task.id} style={{ background: '#fafafa', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #27ae60', fontSize: '12px' }}>
                                            <strong>Ticket #{task.id}: {task.title}</strong>
                                            <div style={{ color: '#7f8c8d', fontSize: '11px', marginTop: '4px' }}>Severity: {task.severity}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System-Wide Assigned Tasks Board (Visible to Admins and Analysts) */}
            {(userRole === 'Admin' || userRole === 'Analyst') && (
                <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff', marginTop: '24px' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '15px' }}>
                        🌐 Global System-Wide Task Assignments
                    </h3>
                    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', color: '#7f8c8d' }}>
                                    <th style={{ padding: '8px' }}>Task Ticket</th>
                                    <th style={{ padding: '8px' }}>Severity</th>
                                    <th style={{ padding: '8px' }}>Status</th>
                                    <th style={{ padding: '8px' }}>Who ➔ Whom</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.filter(i => i.assigned_to).map(i => (
                                    <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>#{i.id}: {i.title}</td>
                                        <td style={{ padding: '8px' }}>
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '10px', 
                                                fontSize: '10px', 
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                background: i.severity === 'Critical' ? '#c0392b' : i.severity === 'High' ? '#e67e22' : i.severity === 'Medium' ? '#2980b9' : '#95a5a6'
                                            }}>{i.severity}</span>
                                        </td>
                                        <td style={{ padding: '8px', color: i.status === 'Open' ? '#e67e22' : '#27ae60', fontWeight: 'bold' }}>
                                            {i.status}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <span style={{ color: '#2980b9', fontWeight: 'bold' }}>{i.assigned_by || 'System'}</span>
                                            {' ➔ '}
                                            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{i.assigned_to}</span>
                                        </td>
                                    </tr>
                                ))}
                                {incidents.filter(i => i.assigned_to).length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#888' }}>
                                            No tasks currently assigned in the system.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
