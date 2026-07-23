import React, { useState } from 'react';
import Login            from './components/Login';
import Dashboard        from './components/Dashboard';
import Alerts           from './components/Alerts';
import Pcap             from './components/Pcap';
import TrafficAnalytics from './components/TrafficAnalytics';
import AnomalyDetection from './components/AnomalyDetection';

export default function App() {
    const [token,     setToken]     = useState(localStorage.getItem('token')    || '');
    const [username,  setUsername]  = useState(localStorage.getItem('username') || '');
    const [role,      setRole]      = useState(localStorage.getItem('role')     || '');
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLoginSuccess = (userToken, name, userRole) => {
        localStorage.setItem('token',    userToken);
        localStorage.setItem('username', name);
        localStorage.setItem('role',     userRole);
        setToken(userToken);
        setUsername(name);
        setRole(userRole);
        setActiveTab('dashboard');
    };

    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.clear();
        setToken('');
        setUsername('');
        setRole('');
    };

    if (!token) {
        return (
            <div>
                <header>
                    <h1>NetShield AI System</h1>
                    <p>Security Operations Center &amp; Network Anomaly Monitoring</p>
                </header>
                <Login onLoginSuccess={handleLoginSuccess} />
            </div>
        );
    }

    const navLinks = [
        { id: 'dashboard',  label: 'SOC Dashboard' },
        { id: 'traffic',    label: 'Traffic Analytics' },
        { id: 'anomaly',    label: 'AI Detection' },
        { id: 'alerts',     label: 'Alerts Manager' },
        { id: 'pcap',       label: 'PCAP Analyzer' },
    ];

    return (
        <div>
            <header>
                <h1>NetShield AI - Security Operations Center</h1>
                <p>User Identity: {username} | Role: {role}</p>
            </header>

            <nav>
                <div className="nav-links">
                    {navLinks.map(link => (
                        <a
                            key={link.id}
                            onClick={() => setActiveTab(link.id)}
                            style={{
                                textDecoration: activeTab === link.id ? 'underline' : 'none',
                                cursor: 'pointer',
                                fontWeight: activeTab === link.id ? 'bold' : 'normal'
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <div className="nav-links">
                    <a onClick={handleLogout} style={{ color: '#ff8888', cursor: 'pointer' }}>Log Out</a>
                </div>
            </nav>

            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'traffic'   && <TrafficAnalytics />}
            {activeTab === 'anomaly'   && <AnomalyDetection />}
            {activeTab === 'alerts'    && <Alerts userRole={role} />}
            {activeTab === 'pcap'      && <Pcap   userRole={role} />}
        </div>
    );
}
