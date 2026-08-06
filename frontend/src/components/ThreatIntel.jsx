import React, { useState, useEffect } from 'react';

const API_URL = "http://127.0.0.1:8000";

const severityColor = (s) => ({
    Critical: '#e74c3c',
    High:     '#e67e22',
    Medium:   '#f1c40f',
    Low:      '#3498db'
}[s] || '#95a5a6');

const categoryColors = (c) => ({
    "DDoS / DoS":   '#e74c3c',
    "PortScan":     '#9b59b6',
    "Infiltration": '#e67e22',
    "Botnet":       '#d35400',
    "Web Attack":   '#f1c40f',
    "Attack":       '#c0392b',
    "Other Anomaly":'#34495e'
}[c] || '#7f8c8d');

function DoughnutChart({ data, title, colorsFn }) {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#34495e' }}>{title}</h4>
                <p style={{ margin: 0, fontSize: '13px' }}>No active threat records found to display.</p>
            </div>
        );
    }

    let accumulatedPercent = 0;
    const slices = Object.entries(data).map(([label, val]) => {
        const percent = (val / total) * 100;
        const offset = 100 - accumulatedPercent + 25;
        accumulatedPercent += percent;
        return { label, val, percent, offset };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#34495e', alignSelf: 'flex-start', borderBottom: '1px solid #eee', width: '100%', paddingBottom: '8px' }}>{title}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                <svg width="100" height="100" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', flexShrink: 0 }}>
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f5f5f5" strokeWidth="4.2" />
                    {slices.map((slice, i) => (
                        <circle
                            key={slice.label}
                            cx="18"
                            cy="18"
                            r="15.91549430918954"
                            fill="transparent"
                            stroke={colorsFn(slice.label)}
                            strokeWidth="4"
                            strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
                            strokeDashoffset={slice.offset}
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                    ))}
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '120px' }}>
                    {slices.map(slice => (
                        <div key={slice.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: colorsFn(slice.label), flexShrink: 0 }} />
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100px' }}>{slice.label}</span>
                            </span>
                            <span style={{ fontWeight: 'bold', color: '#555', flexShrink: 0 }}>
                                {slice.val} ({Math.round(slice.percent)}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ThreatIntel() {
    const [intel, setIntel] = useState(null);

    const fetchIntel = async () => {
        try {
            const res = await fetch(`${API_URL}/reports/threat-intel`);
            if (res.ok) {
                setIntel(await res.json());
            }
        } catch (err) {
            console.error("Threat intel fetch error:", err);
        }
    };

    useEffect(() => {
        fetchIntel();
        const interval = setInterval(fetchIntel, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCsvExport = () => {
        window.open(`${API_URL}/reports/export`, '_blank');
    };

    if (!intel) {
        return <div className="container">Loading threat intelligence reports...</div>;
    }

    const threatRatio = intel.total_threats > 0 ? (intel.severity_distribution.Critical + intel.severity_distribution.High) / intel.total_threats : 0;
    const sysRisk = intel.total_threats === 0 ? "Minimal" : (threatRatio > 0.6 ? "Critical" : "High");

    return (
        <div className="container">
            <h2>Security Threat Intelligence &amp; Analytics</h2>

            {/* Assessment Panel */}
            <div style={{
                padding: '20px',
                borderRadius: '6px',
                background: sysRisk === 'Critical' ? '#ffebee' : (sysRisk === 'High' ? '#fff3e0' : '#e8f5e9'),
                borderLeft: sysRisk === 'Critical' ? '8px solid #c62828' : (sysRisk === 'High' ? '8px solid #ef6c00' : '8px solid #2e7d32'),
                marginBottom: '24px'
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🛡️ Automated Threat Assessment: 
                    <span style={{ 
                        color: sysRisk === 'Critical' ? '#c62828' : (sysRisk === 'High' ? '#ef6c00' : '#2e7d32'),
                        fontWeight: 'bold' 
                    }}>
                        {sysRisk} Risk Level
                    </span>
                </h3>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#34495e' }}>
                    {intel.threat_assessment}
                </p>
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '12px' }}>
                    Report generated at: <strong>{intel.generated_at}</strong> relative to your local SOC timezone.
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {/* Severity distribution card */}
                <div style={{ flex: '1 1 300px', border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff' }}>
                    <DoughnutChart 
                        title="Threat Severity Distribution" 
                        data={intel.severity_distribution} 
                        colorsFn={severityColor} 
                    />
                </div>

                {/* Category distribution card */}
                <div style={{ flex: '1 1 300px', border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff' }}>
                    <DoughnutChart 
                        title="Attack Category Classification" 
                        data={intel.attack_category_distribution || {}} 
                        colorsFn={categoryColors} 
                    />
                </div>

                {/* Top threats sources IPs */}
                <div style={{ flex: '1 1 300px', border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#fff' }}>
                    <h3 style={{ fontSize: '14px', marginTop: 0, color: '#34495e', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                        Primary Malicious Attack Sources
                    </h3>
                    {intel.top_threat_sources.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontSize: '13px' }}>
                            No malicious hosts identified in telemetry logs yet.
                        </div>
                    ) : (
                        <table style={{ width: '100%', marginTop: '8px' }}>
                            <thead>
                                <tr>
                                    <th>Source IP</th>
                                    <th style={{ textAlign: 'right' }}>Anomalous Payload Detections</th>
                                </tr>
                            </thead>
                            <tbody>
                                {intel.top_threat_sources.map(src => (
                                    <tr key={src.ip}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{src.ip}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#c0392b' }}>{src.count} times</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Export and Reporting Panel */}
            <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', background: '#fafafa', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Incident Reporting &amp; Compliance Export</h3>
                <p style={{ color: '#7f8c8d', fontSize: '13px', margin: '0 0 16px 0' }}>
                    Generate compliance reports containing all threat logs, classification outputs, and sniffer alert parameters in CSV format.
                </p>
                <button
                    onClick={handleCsvExport}
                    style={{
                        padding: '10px 24px',
                        background: '#2c3e50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#34495e'}
                    onMouseOut={(e) => e.target.style.background = '#2c3e50'}
                >
                    📥 Export Alerts Logs (.CSV)
                </button>
            </div>
        </div>
    );
}
