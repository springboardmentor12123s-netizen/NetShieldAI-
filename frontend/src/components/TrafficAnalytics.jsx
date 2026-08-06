import React, { useState, useEffect } from 'react';

const API_URL = "http://127.0.0.1:8000";

// Simple bar using divs (no external chart lib needed)
function BarChart({ data, title, colorFn }) {
    const max = Math.max(...Object.values(data), 1);
    return (
        <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '10px', color: '#333' }}>{title}</h4>
            {Object.entries(data).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '10px' }}>
                    <span style={{ width: '80px', fontSize: '12px', color: '#555', textAlign: 'right', flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, background: '#eee', borderRadius: '3px', height: '20px', position: 'relative' }}>
                        <div style={{
                            width: `${Math.round((val / max) * 100)}%`,
                            height: '100%',
                            background: colorFn ? colorFn(label) : '#4a90e2',
                            borderRadius: '3px',
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                    <span style={{ width: '50px', fontSize: '12px', color: '#333', fontWeight: 'bold' }}>{val}</span>
                </div>
            ))}
        </div>
    );
}

function DoughnutChart({ data, title, colorsFn }) {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>{title}</h4>
                <p style={{ margin: 0, fontSize: '13px' }}>No records available.</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#333', alignSelf: 'flex-start' }}>{title}</h4>
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

function TrendChart({ data, title }) {
    const maxVal = Math.max(...data.map(d => d.normal + d.anomaly), 1);
    return (
        <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '10px', color: '#333' }}>{title}</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                {data.map((d, i) => (
                    <div key={i} title={`${d.hour}: Normal=${d.normal}, Anomaly=${d.anomaly}`}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '1px', height: '100%' }}>
                        <div style={{
                            width: '100%',
                            height: `${Math.round((d.anomaly / maxVal) * 90)}px`,
                            background: '#e74c3c',
                            borderRadius: '2px 2px 0 0',
                            minHeight: '2px'
                        }} />
                        <div style={{
                            width: '100%',
                            height: `${Math.round((d.normal / maxVal) * 90)}px`,
                            background: '#2ecc71',
                            borderRadius: '2px 2px 0 0'
                        }} />
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '6px', fontSize: '11px', color: '#666' }}>
                {data.map((d, i) => <span key={i}>{d.hour}</span>)}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px' }}>
                <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#2ecc71', marginRight: '4px', borderRadius: '2px' }} />Normal</span>
                <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e74c3c', marginRight: '4px', borderRadius: '2px' }} />Anomaly</span>
            </div>
        </div>
    );
}

const severityColor = (s) => ({ Critical: '#c0392b', High: '#e67e22', Medium: '#f1c40f', Low: '#27ae60' }[s] || '#888');
const protocolColor = (p) => ({ TCP: '#3498db', UDP: '#9b59b6', ICMP: '#e67e22', HTTP: '#2ecc71', DNS: '#1abc9c', HTTPS: '#2980b9' }[p] || '#999');
const normalAnomalyColor = (n) => ({ "Normal Traffic": '#2ecc71', "Anomalous Traffic": '#e74c3c' }[n] || '#999');
const directionColor = (d) => ({ "Inbound (External)": '#e74c3c', "Outbound (Internal)": '#3498db', "Local (Multicast)": '#2ecc71' }[d] || '#999');
const statusColor = (s) => ({ "Active Open": '#e67e22', "Resolved Closed": '#2ecc71' }[s] || '#999');

export default function TrafficAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [traffic,   setTraffic]   = useState([]);
    const [modelInfo, setModelInfo] = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchAll = async () => {
        try {
            const [aRes, tRes, mRes] = await Promise.all([
                fetch(`${API_URL}/monitoring/analytics`),
                fetch(`${API_URL}/monitoring/traffic`),
                fetch(`${API_URL}/ai/model-info`)
            ]);
            if (aRes.ok) setAnalytics(await aRes.json());
            if (tRes.ok) setTraffic(await tRes.json());
            if (mRes.ok) setModelInfo(await mRes.json());
            setLastRefresh(new Date().toLocaleTimeString());
        } catch (err) {
            console.error("Analytics fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 8000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="container"><p>Loading analytics data...</p></div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Traffic Analytics &amp; Monitoring</h2>
                <div style={{ fontSize: '12px', color: '#666' }}>
                    Auto-refresh every 8s {lastRefresh && `| Last updated: ${lastRefresh}`}
                    <button onClick={fetchAll} style={{ marginLeft: '10px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary KPI row */}
            {analytics && (
                <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Packets (Last Hour)', value: analytics.total_packets_last_hour?.toLocaleString(), color: '#2980b9' },
                        { label: 'Anomaly Rate', value: `${analytics.anomaly_percentage}%`, color: '#e74c3c' },
                        { label: 'Protocols Detected', value: Object.keys(analytics.protocol_distribution || {}).length, color: '#8e44ad' },
                        { label: 'AI Models', value: modelInfo?.models_trained ? '✓ Active' : '⚠ Not Trained', color: modelInfo?.models_trained ? '#27ae60' : '#e67e22' }
                    ].map(kpi => (
                        <div key={kpi.label} style={{ flex: '1 1 150px', border: '1px solid #ddd', padding: '14px', background: '#fafafa', minWidth: '140px' }}>
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>{kpi.label}</div>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts row */}
            {analytics && (() => {
                const totalPackets = analytics.total_packets_last_hour || 0;
                const anomalyRate = analytics.anomaly_percentage || 0;
                const anomalousCount = Math.round(totalPackets * (anomalyRate / 100));
                const normalCount = Math.max(0, totalPackets - anomalousCount);
                
                const anomalyBreakdown = {
                    "Normal Traffic": normalCount,
                    "Anomalous Traffic": anomalousCount
                };

                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                        <div style={{ border: '1px solid #ddd', padding: '16px', background: '#fff', borderRadius: '6px' }}>
                            <DoughnutChart
                                title="Protocol Distribution"
                                data={analytics.protocol_distribution}
                                colorsFn={protocolColor}
                            />
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '16px', background: '#fff', borderRadius: '6px' }}>
                            <DoughnutChart
                                title="Normal vs Anomalous Traffic"
                                data={anomalyBreakdown}
                                colorsFn={normalAnomalyColor}
                            />
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '16px', background: '#fff', borderRadius: '6px' }}>
                            <DoughnutChart
                                title="Traffic Direction Breakdown"
                                data={analytics.direction_breakdown || {}}
                                colorsFn={directionColor}
                            />
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '16px', background: '#fff', borderRadius: '6px' }}>
                            <DoughnutChart
                                title="Incident Resolution Status"
                                data={analytics.incident_status_breakdown || {}}
                                colorsFn={statusColor}
                            />
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '16px', background: '#fff', borderRadius: '6px', gridColumn: '1 / -1' }}>
                            <BarChart
                                title="Alert Severity Breakdown"
                                data={analytics.severity_distribution}
                                colorFn={severityColor}
                            />
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '16px', background: '#fff', borderRadius: '6px', gridColumn: '1 / -1' }}>
                            <TrendChart title="Hourly Traffic Trend (Normal vs Anomaly)" data={analytics.hourly_trend} />
                        </div>
                    </div>
                );
            })()}

            {/* Top Attack Sources */}
            {analytics?.top_attack_sources && (
                <div style={{ marginBottom: '24px' }}>
                    <h3>Top Suspicious Source IPs</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Source IP</th>
                                <th>Alert Count</th>
                                <th>Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.top_attack_sources.map((s, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td><code>{s.ip}</code></td>
                                    <td>{s.count}</td>
                                    <td style={{ color: s.count > 60 ? '#c0392b' : s.count > 30 ? '#e67e22' : '#27ae60', fontWeight: 'bold' }}>
                                        {s.count > 60 ? 'Critical' : s.count > 30 ? 'High' : 'Low'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Live Packet Feed */}
            <div style={{ marginBottom: '24px' }}>
                <h3>Live Packet Monitor (Last 20 Packets)</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Source IP</th>
                                <th>Destination IP</th>
                                <th>Protocol</th>
                                <th>Length (bytes)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {traffic.map((pkt, i) => (
                                <tr key={i} style={{ background: pkt.anomaly ? '#fff5f5' : 'white' }}>
                                    <td style={{ fontSize: '11px' }}>{new Date(pkt.timestamp * 1000).toLocaleTimeString()}</td>
                                    <td><code style={{ fontSize: '11px' }}>{pkt.src_ip}</code></td>
                                    <td><code style={{ fontSize: '11px' }}>{pkt.dst_ip}</code></td>
                                    <td><span style={{ background: protocolColor(pkt.protocol), color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>{pkt.protocol}</span></td>
                                    <td>{pkt.length}</td>
                                    <td style={{ color: pkt.anomaly ? '#c0392b' : '#27ae60', fontWeight: 'bold', fontSize: '12px' }}>
                                        {pkt.anomaly ? '⚠ Anomaly' : '✓ Normal'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Model Info */}
            {modelInfo && (
                <div style={{ border: '1px solid #ddd', padding: '16px', background: '#f9f9f9' }}>
                    <h3 style={{ margin: '0 0 12px' }}>AI Model Status</h3>
                    <table>
                        <tbody>
                            <tr><td><strong>Status</strong></td><td style={{ color: modelInfo.models_trained ? '#27ae60' : '#e67e22' }}>{modelInfo.models_trained ? '✓ Trained & Ready' : '⚠ Not Trained Yet'}</td></tr>
                            <tr><td><strong>Dataset</strong></td><td>{modelInfo.dataset_used}</td></tr>
                            <tr><td><strong>Feature Count</strong></td><td>{modelInfo.feature_count}</td></tr>
                            <tr><td><strong>Anomaly Detection</strong></td><td>{modelInfo.algorithms?.anomaly_detection}</td></tr>
                            <tr><td><strong>Attack Classifier</strong></td><td>{modelInfo.algorithms?.attack_classification}</td></tr>
                            <tr><td><strong>Attack Categories</strong></td><td>{(modelInfo.attack_categories || []).join(', ') || 'N/A'}</td></tr>
                            <tr><td><strong>Note</strong></td><td style={{ fontSize: '12px', color: '#666' }}>{modelInfo.training_note}</td></tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
