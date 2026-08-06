import React, { useState } from 'react';

export default function Pcap({ userRole }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    const API_URL = "http://127.0.0.1:8000";
    const isReadOnly = userRole === "Auditor";

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (isReadOnly) {
            setStatusMessage("Access Denied: Auditors cannot upload PCAP streams.");
            return;
        }
        if (!file) return;

        setLoading(true);
        setResult(null);
        setStatusMessage('');

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API_URL}/pcap/upload`, {
                method: 'POST',
                body: formData
            });

            // Simulate minor extraction latency for human appearance
            setTimeout(async () => {
                setLoading(false);
                if (response.ok) {
                    const data = await response.json();
                    setResult(data);
                } else {
                    setStatusMessage("Error uploading file.");
                }
            }, 1000);
        } catch (err) {
            setLoading(false);
            setStatusMessage("Could not communicate with backend server.");
        }
    };

    return (
        <div className="container">
            <h2>Upload Packet Capture (PCAP) File</h2>
            <p>Submit a recorded packet stream file for structural processing. The file metadata will be ingested into the NoSQL MongoDB database.</p>

            {isReadOnly ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>
                    Compliance Read-Only Mode (Auditor Role active. File upload disabled)
                </p>
            ) : (
                <form onSubmit={handleUpload}>
                    <div className="form-group">
                        <label>Choose PCAP File (or simple text file for testing)</label>
                        <input type="file" onChange={handleFileChange} required />
                    </div>
                    <button type="submit">Upload and Extract Flows</button>
                </form>
            )}

            {loading && (
                <div style={{ margin: '15px 0', fontWeight: 'bold', color: '#2b6cb0' }}>
                    Decompressing packet headers and evaluating streams...
                </div>
            )}

            {statusMessage && <p style={{ color: 'red' }}>{statusMessage}</p>}

            {result && (
                <div style={{ marginTop: '25px', border: '1px solid #cccccc', padding: '15px', background: '#fbfbfb' }}>
                    <h3 style={{ marginTop: 0, color: '#2b6cb0' }}>PCAP Processing Success</h3>
                    <p><strong>Filename:</strong> {result.filename}</p>
                    <p><strong>Inferred Packets Count:</strong> {result.metadata.inferred_packets_count}</p>
                    <p><strong>Upload Timestamp:</strong> {result.metadata.uploaded_at}</p>
                    <p><strong>Database Record Status:</strong> Saved to MongoDB</p>
                </div>
            )}
        </div>
    );
}
