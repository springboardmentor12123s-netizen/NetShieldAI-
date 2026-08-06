import React, { useState, useEffect } from 'react';

const API_URL = "http://127.0.0.1:8000";

export default function Incidents() {
    const [incidents, setIncidents] = useState([]);
    const [users, setUsers] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [notification, setNotification] = useState('');

    const fetchIncidents = async () => {
        try {
            const res = await fetch(`${API_URL}/incidents`);
            if (res.ok) {
                setIncidents(await res.json());
            }
        } catch (err) {
            console.error("Error fetching incidents:", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users/list`);
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    useEffect(() => {
        fetchIncidents();
        fetchUsers();
        const interval = setInterval(fetchIncidents, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleAssignChange = async (incidentId, username) => {
        try {
            const res = await fetch(`${API_URL}/incidents/${incidentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: username })
            });
            if (res.ok) {
                setNotification(`Incident #${incidentId} reassigned successfully.`);
                fetchIncidents();
                setTimeout(() => setNotification(''), 4000);
            }
        } catch (err) {
            console.error("Reassign error:", err);
        }
    };

    const handleStatusToggle = async (incidentId, currentStatus) => {
        const nextStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
        try {
            const res = await fetch(`${API_URL}/incidents/${incidentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) {
                setNotification(`Incident #${incidentId} marked as ${nextStatus}.`);
                fetchIncidents();
                setTimeout(() => setNotification(''), 4000);
            }
        } catch (err) {
            console.error("Status toggle error:", err);
        }
    };

    const filteredIncidents = incidents.filter(inc => {
        if (statusFilter === 'All') return true;
        return inc.status === statusFilter;
    });

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Incident Management &amp; Response Queue</h2>
                <div>
                    <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Status Filter: </label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="All">All Incidents</option>
                        <option value="Open">Open Queue</option>
                        <option value="Closed">Closed Queue</option>
                    </select>
                </div>
            </div>

            {notification && (
                <div style={{ padding: '10px', background: '#e1f5fe', borderLeft: '4px solid #0288d1', color: '#0277bd', marginBottom: '16px', borderRadius: '4px' }}>
                    {notification}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredIncidents.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#fcfcfc', border: '1px dashed #ddd', color: '#888' }}>
                        No active security incidents found matching your query filter.
                    </div>
                ) : (
                    filteredIncidents.map(inc => (
                        <div 
                            key={inc.id} 
                            style={{ 
                                border: '1px solid #ddd', 
                                borderRadius: '6px', 
                                background: '#fff', 
                                padding: '16px',
                                borderLeft: inc.status === 'Closed' ? '6px solid #95a5a6' : (inc.severity === 'Critical' ? '6px solid #e74c3c' : '6px solid #e67e22'),
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <span style={{ 
                                    fontSize: '10px', 
                                    textTransform: 'uppercase', 
                                    fontWeight: 'bold',
                                    color: inc.severity === 'Critical' ? '#e74c3c' : '#e67e22'
                                }}>
                                    {inc.severity} Severity Alert
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    background: inc.status === 'Open' ? '#ffe0b2' : '#cfd8dc',
                                    color: inc.status === 'Open' ? '#f57c00' : '#37474f',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {inc.status}
                                </span>
                            </div>

                            <h3 style={{ fontSize: '15px', margin: '4px 0 8px 0', color: '#2c3e50' }}>{inc.title}</h3>
                            
                            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '12px' }}>
                                <div><strong>Source Host:</strong> {inc.source_ip}</div>
                                <div><strong>Triggered:</strong> {new Date(inc.timestamp).toLocaleString()}</div>
                                <div style={{ marginTop: '6px', fontStyle: 'italic' }}>"{inc.message}"</div>
                            </div>

                            <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '12px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <label style={{ fontSize: '11px', display: 'block', color: '#7f8c8d', marginBottom: '4px' }}>Assignee</label>
                                    {(localStorage.getItem('role') === 'Admin' || localStorage.getItem('role') === 'Analyst') ? (
                                        <select
                                            value={inc.assigned_to || ''}
                                            onChange={(e) => handleAssignChange(inc.id, e.target.value)}
                                            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                                        >
                                            <option value="">Unassigned</option>
                                            {users.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50' }}>
                                            {inc.assigned_to || 'Unassigned'}
                                        </span>
                                    )}
                                </div>

                                {(localStorage.getItem('role') === 'Admin' || localStorage.getItem('role') === 'Analyst') && (
                                    <button
                                        onClick={() => handleStatusToggle(inc.id, inc.status)}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            background: inc.status === 'Open' ? '#27ae60' : '#2980b9',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {inc.status === 'Open' ? 'Mark Resolved' : 'Re-open Ticket'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
