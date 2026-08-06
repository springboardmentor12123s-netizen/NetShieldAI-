import React, { useState } from 'react';

const API_URL = "http://127.0.0.1:8000";

export default function AnomalyDetection() {
    const [features, setFeatures]   = useState('');
    const [result,   setResult]     = useState(null);
    const [classify, setClassify]   = useState(null);
    const [loading,  setLoading]    = useState(false);
    const [error,    setError]      = useState('');
    const [activeTab, setActiveTab] = useState('detect');

    const parsedFeatures = () => {
        try {
            return features.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        } catch {
            return [];
        }
    };

    const handleDetect = async () => {
        const feat = parsedFeatures();
        if (feat.length === 0) {
            setError('Please enter comma-separated numeric feature values.');
            return;
        }
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await fetch(`${API_URL}/ai/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: feat })
            });
            if (!res.ok) {
                const e = await res.json();
                setError(e.detail || 'Detection failed.');
            } else {
                setResult(await res.json());
            }
        } catch {
            setError('Cannot connect to backend. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleClassify = async () => {
        const feat = parsedFeatures();
        if (feat.length === 0) {
            setError('Please enter comma-separated numeric feature values.');
            return;
        }
        setLoading(true); setError(''); setClassify(null);
        try {
            const res = await fetch(`${API_URL}/ai/classify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: feat })
            });
            if (!res.ok) {
                const e = await res.json();
                setError(e.detail || 'Classification failed.');
            } else {
                setClassify(await res.json());
            }
        } catch {
            setError('Cannot connect to backend. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    const loadSampleFeatures = () => {
        // Sample realistic UNSW-NB15 style feature values
        const sample = Array.from({ length: 20 }, () => Math.round(Math.random() * 1000));
        setFeatures(sample.join(', '));
        setResult(null); setClassify(null); setError('');
    };

    return (
        <div className="container">
            <h2>AI Anomaly Detection &amp; Threat Classification</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Submit network traffic feature vectors to the trained Isolation Forest and Random Forest models.
                Models are trained on the <strong>UNSW-NB15</strong> cybersecurity dataset.
            </p>

            {/* Tab Selector */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
                {['detect', 'classify'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === tab ? '#fff' : '#f5f5f5',
                            border: '1px solid #ddd',
                            borderBottom: activeTab === tab ? '2px solid white' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            marginBottom: '-2px',
                            color: activeTab === tab ? '#333' : '#666'
                        }}
                    >
                        {tab === 'detect' ? '🔍 Anomaly Detection' : '⚡ Attack Classification'}
                    </button>
                ))}
            </div>

            {/* Feature Input */}
            <div style={{ border: '1px solid #ddd', padding: '20px', background: '#fafafa', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>Feature Vector (comma-separated numeric values):</label>
                    <button onClick={loadSampleFeatures} style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer', background: '#eee', border: '1px solid #ccc' }}>
                        Load Sample Features
                    </button>
                </div>
                <textarea
                    value={features}
                    onChange={e => setFeatures(e.target.value)}
                    placeholder="e.g., 6, 0, 10, 1500, 3, 64, 0, 0, 80, 0, ..."
                    rows={3}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '13px', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', resize: 'vertical' }}
                />
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {parsedFeatures().length} feature values entered
                </div>

                {error && (
                    <div style={{ background: '#fff5f5', border: '1px solid #ffaaaa', padding: '10px', marginTop: '10px', color: '#c0392b', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                    {activeTab === 'detect' ? (
                        <button
                            onClick={handleDetect}
                            disabled={loading}
                            style={{ padding: '10px 24px', background: loading ? '#ccc' : '#2980b9', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            {loading ? 'Analyzing...' : 'Run Anomaly Detection'}
                        </button>
                    ) : (
                        <button
                            onClick={handleClassify}
                            disabled={loading}
                            style={{ padding: '10px 24px', background: loading ? '#ccc' : '#8e44ad', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            {loading ? 'Classifying...' : 'Classify Attack Type'}
                        </button>
                    )}
                    <button
                        onClick={() => { setResult(null); setClassify(null); setError(''); setFeatures(''); }}
                        style={{ padding: '10px 16px', background: '#eee', border: '1px solid #ccc', cursor: 'pointer' }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Anomaly Detection Result */}
            {result && activeTab === 'detect' && (
                <div style={{
                    border: `2px solid ${result.is_anomaly ? '#e74c3c' : '#27ae60'}`,
                    padding: '20px',
                    background: result.is_anomaly ? '#fff5f5' : '#f0fff4',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: '0 0 16px', color: result.is_anomaly ? '#c0392b' : '#27ae60' }}>
                        {result.is_anomaly ? '⚠ ANOMALY DETECTED' : '✓ NORMAL TRAFFIC'}
                    </h3>
                    <table>
                        <tbody>
                            <tr><td><strong>Prediction</strong></td><td style={{ fontWeight: 'bold', color: result.is_anomaly ? '#c0392b' : '#27ae60' }}>{result.prediction}</td></tr>
                            <tr><td><strong>Anomaly Score</strong></td><td><code>{result.anomaly_score}</code></td></tr>
                            <tr><td><strong>Confidence</strong></td><td>{result.confidence}%</td></tr>
                            <tr><td><strong>Algorithm</strong></td><td>Isolation Forest (sklearn)</td></tr>
                        </tbody>
                    </table>
                    {/* Confidence bar */}
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Confidence Level</div>
                        <div style={{ background: '#eee', borderRadius: '4px', height: '14px' }}>
                            <div style={{
                                width: `${Math.min(result.confidence, 100)}%`,
                                height: '100%',
                                background: result.is_anomaly ? '#e74c3c' : '#27ae60',
                                borderRadius: '4px',
                                transition: 'width 0.4s'
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Classification Result */}
            {classify && activeTab === 'classify' && (
                <div style={{
                    border: `2px solid ${classify.is_attack ? '#e67e22' : '#27ae60'}`,
                    padding: '20px',
                    background: classify.is_attack ? '#fffaf5' : '#f0fff4',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: '0 0 16px', color: classify.is_attack ? '#d35400' : '#27ae60' }}>
                        {classify.is_attack ? `⚡ Attack: ${classify.predicted_attack_type}` : '✓ Normal Traffic'}
                    </h3>
                    <table>
                        <tbody>
                            <tr><td><strong>Attack Type</strong></td><td style={{ fontWeight: 'bold', color: classify.is_attack ? '#d35400' : '#27ae60' }}>{classify.predicted_attack_type}</td></tr>
                            <tr><td><strong>Confidence</strong></td><td>{classify.confidence_pct}%</td></tr>
                            <tr><td><strong>Algorithm</strong></td><td>Random Forest Classifier (sklearn)</td></tr>
                        </tbody>
                    </table>
                    {/* Top probabilities */}
                    {classify.all_probabilities && Object.keys(classify.all_probabilities).length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>Attack Type Probabilities</div>
                            {Object.entries(classify.all_probabilities)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 6)
                                .map(([label, pct]) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <span style={{ width: '100px', fontSize: '11px', color: '#555', textAlign: 'right' }}>{label}</span>
                                        <div style={{ flex: 1, background: '#eee', borderRadius: '3px', height: '16px' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: '#8e44ad', borderRadius: '3px', minWidth: pct > 0 ? '2px' : '0' }} />
                                        </div>
                                        <span style={{ width: '45px', fontSize: '11px', fontWeight: 'bold', color: '#333' }}>{pct}%</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* How-to */}
            <div style={{ border: '1px solid #e0e0e0', padding: '16px', background: '#f9f9f9', fontSize: '13px', color: '#555' }}>
                <strong>How to use:</strong>
                <ol style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
                    <li>Click <em>Load Sample Features</em> to auto-fill a test vector, or enter your own comma-separated values.</li>
                    <li>Use <em>Anomaly Detection</em> tab to check if traffic is normal or anomalous (Isolation Forest).</li>
                    <li>Use <em>Attack Classification</em> tab to identify the specific attack type (Random Forest).</li>
                    <li>If models are not trained, run: <code>python -m backend.train_model</code> from project root.</li>
                </ol>
            </div>
        </div>
    );
}
