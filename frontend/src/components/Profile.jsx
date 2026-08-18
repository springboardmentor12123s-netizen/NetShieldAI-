import React, { useState, useEffect } from 'react';

const API_URL = "http://127.0.0.1:8000";

export default function Profile() {
    const [profile, setProfile] = useState({ username: '', email: '', role: '', is_smtp_set: false });
    const [email, setEmail] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [profileMsg, setProfileMsg] = useState('');
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('Analyst');
    const [adminMsg, setAdminMsg] = useState('');
    const [selectedTable, setSelectedTable] = useState('users');
    const [tableData, setTableData] = useState([]);
    const [dbMsg, setDbMsg] = useState('');
    const [testMsg, setTestMsg] = useState('');
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [dbStats, setDbStats] = useState({ users_count: 0, alerts_count: 0, incidents_count: 0 });

    const token = localStorage.getItem('token') || '';

    const handleTestSmtp = async () => {
        setTestMsg('');
        setTestingSmtp(true);
        try {
            const res = await fetch(`${API_URL}/users/profile/smtp/test`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (res.ok) {
                setTestMsg("Success: Test email sent to your registered Gmail address!");
            } else {
                setTestMsg("Error: " + (data.detail || "Connection check failed"));
            }
        } catch (err) { setTestMsg("Server error."); }
        finally { setTestingSmtp(false); }
    };

    const fetchDbStats = async () => {
        if (userRole !== 'Admin') return;
        try {
            const res = await fetch(`${API_URL}/users/admin/db/stats`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) setDbStats(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchTableData = async () => {
        setDbMsg('');
        try {
            const res = await fetch(`${API_URL}/users/admin/db/${selectedTable}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (res.ok) {
                setTableData(data);
            } else {
                setDbMsg("Error: " + (data.detail || "Failed to fetch table records"));
            }
        } catch (err) { setDbMsg("Server error."); }
    };
    const userRole = localStorage.getItem('role') || '';

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEmail(data.email);
            }
        } catch (err) { console.error(err); }
    };

    const fetchAllUsers = async () => {
        if (userRole !== 'Admin') return;
        try {
            const res = await fetch(`${API_URL}/users/admin/list`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchProfile();
        fetchAllUsers();
        fetchDbStats();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileMsg('');
        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ email, gmail_app_password: appPassword || undefined })
            });
            const data = await res.json();
            if (res.ok) {
                setProfileMsg("Profile updated successfully!");
                setAppPassword('');
                fetchProfile();
            } else {
                setProfileMsg("Error: " + (data.detail || "Update failed"));
            }
        } catch (err) { setProfileMsg("Server communication error."); }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditEmail(user.email);
        setEditRole(user.role);
    };

    const handleAdminUpdate = async (e) => {
        e.preventDefault();
        setAdminMsg('');
        try {
            const res = await fetch(`${API_URL}/users/admin/${editingUser.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ email: editEmail, role: editRole })
            });
            const data = await res.json();
            if (res.ok) {
                setAdminMsg("User account updated successfully!");
                setEditingUser(null);
                fetchAllUsers();
            } else {
                setAdminMsg("Error: " + (data.detail || "Update failed"));
            }
        } catch (err) { setAdminMsg("Server error."); }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
        setAdminMsg('');
        try {
            const res = await fetch(`${API_URL}/users/admin/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (res.ok) {
                setAdminMsg(`User ${username} deleted successfully.`);
                fetchAllUsers();
            } else {
                setAdminMsg("Error: " + (data.detail || "Deletion failed"));
            }
        } catch (err) { setAdminMsg("Server error."); }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2>👤 Profile &amp; Account Settings</h2>

            {/* Profile Overview Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', background: '#fff' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>User Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginTop: '10px' }}>
                        <div><strong>Username:</strong> {profile.username}</div>
                        <div><strong>Role:</strong> {profile.role}</div>
                        <div><strong>Email Address:</strong> {profile.email || 'None'}</div>
                        <div>
                            <strong>Gmail App Password Status:</strong>{' '}
                            <span style={{ color: profile.is_smtp_set ? '#27ae60' : '#e67e22', fontWeight: 'bold' }}>
                                {profile.is_smtp_set ? 'Active / Configured' : 'Not Set'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', background: '#fff' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Update Profile Settings</h3>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '12px' }}>Email Address</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '6px 10px', fontSize: '12px' }} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '12px' }}>Update Gmail App Password (Optional)</label>
                            <input type="password" placeholder="••••••••••••••••" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px' }} />
                        </div>
                        <button type="submit" style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '12px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Update Settings
                        </button>
                    </form>
                    {profileMsg && <p style={{ fontSize: '12px', color: profileMsg.startsWith('Error') ? 'red' : 'green', marginTop: '10px', marginBottom: 0 }}>{profileMsg}</p>}
                    
                    {profile.is_smtp_set && (
                        <div style={{ marginTop: '14px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                            <button 
                                type="button" 
                                onClick={handleTestSmtp} 
                                disabled={testingSmtp}
                                style={{ 
                                    padding: '5px 12px', 
                                    fontSize: '11px', 
                                    background: '#e67e22', 
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold' 
                                }}
                            >
                                {testingSmtp ? '⚡ Testing SMTP Connection...' : '⚡ Test SMTP Connection'}
                            </button>
                            {testMsg && <p style={{ fontSize: '11px', color: testMsg.startsWith('Error') ? 'red' : 'green', margin: '6px 0 0 0' }}>{testMsg}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Console Section */}
            {userRole === 'Admin' && (
                <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', background: '#fff' }}>
                    <h3 style={{ marginTop: 0, color: '#c0392b', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>💻 Administrative User Management Console</h3>
                    {adminMsg && <p style={{ color: adminMsg.startsWith('Error') ? 'red' : 'green', fontSize: '13px' }}>{adminMsg}</p>}
                    
                    {editingUser ? (
                        <form onSubmit={handleAdminUpdate} style={{ background: '#fafafa', padding: '16px', borderRadius: '4px', border: '1px solid #e0e0e0', margin: '14px 0', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, width: '100%' }}>Editing User: <em>{editingUser.username}</em></h4>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px' }}>Email</label>
                                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required style={{ padding: '4px 8px', fontSize: '12px' }} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px' }}>System Role</label>
                                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                                    <option value="Analyst">Analyst</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Auditor">Auditor</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                                <button type="submit" style={{ padding: '6px 12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Save Changes</button>
                                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '6px 12px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                            </div>
                        </form>
                    ) : null}

                    <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '8px' }}>Username</th>
                                    <th style={{ padding: '8px' }}>Email</th>
                                    <th style={{ padding: '8px' }}>Role</th>
                                    <th style={{ padding: '8px' }}>App Password</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{u.username}</td>
                                        <td style={{ padding: '8px' }}>{u.email}</td>
                                        <td style={{ padding: '8px' }}>
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '10px', 
                                                fontSize: '10px', 
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                background: u.role === 'Admin' ? '#e74c3c' : u.role === 'Analyst' ? '#3498db' : '#95a5a6'
                                            }}>{u.role}</span>
                                        </td>
                                        <td style={{ padding: '8px', color: u.is_smtp_set ? '#27ae60' : '#888' }}>
                                            {u.is_smtp_set ? '✔ Configured' : '✘ Not Configured'}
                                        </td>
                                        <td style={{ padding: '8px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button onClick={() => handleEditClick(u)} style={{ padding: '3px 8px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>Edit</button>
                                            <button onClick={() => handleDeleteUser(u.id, u.username)} style={{ padding: '3px 8px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Admin Database Console Section */}
            {userRole === 'Admin' && (
                <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', background: '#fff', marginTop: '12px' }}>
                    <h3 style={{ marginTop: 0, color: '#8e44ad', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>🗃️ Administrative Database Inspector Console</h3>
                    
                    {/* Database Statistics Summary Panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
                        <div style={{ background: '#f5f7fa', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold' }}>TOTAL ACCOUNTS (users)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748', marginTop: '4px' }}>{dbStats.users_count}</div>
                        </div>
                        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '4px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#e53e3e', fontWeight: 'bold' }}>THREAT LOGS (alerts)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#c53030', marginTop: '4px' }}>{dbStats.alerts_count}</div>
                        </div>
                        <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '4px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#3182ce', fontWeight: 'bold' }}>TASK TICKETS (incidents)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2b6cb0', marginTop: '4px' }}>{dbStats.incidents_count}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '14px', marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Inspect System Table:</label>
                        <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                            <option value="users">users (All Accounts)</option>
                            <option value="alerts">alerts (Threat Detections - Last 50)</option>
                            <option value="incidents">incidents (Task Tickets - Last 50)</option>
                        </select>
                        <button onClick={fetchTableData} style={{ padding: '6px 16px', background: '#8e44ad', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            🔍 Fetch Database Logs
                        </button>
                    </div>
                    
                    {dbMsg && <p style={{ color: 'red', fontSize: '12px' }}>{dbMsg}</p>}

                    {tableData.length > 0 ? (
                        <div style={{ overflowX: 'auto', maxHeight: '300px', border: '1px solid #eee', borderRadius: '4px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                                <thead style={{ background: '#f9f9f9', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                                        {Object.keys(tableData[0]).map(key => (
                                            <th key={key} style={{ padding: '8px', textTransform: 'capitalize' }}>{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            {Object.values(row).map((val, vIdx) => (
                                                <td key={vIdx} style={{ padding: '8px' }}>{String(val)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: '#888', fontSize: '12px', margin: '10px 0 0 0' }}>Select a table and click fetch to inspect live SQL database logs.</p>
                    )}
                </div>
            )}
        </div>
    );
}
