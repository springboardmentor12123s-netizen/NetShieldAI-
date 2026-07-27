import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { UploadCloud, PlayCircle, CheckCircle2, History } from "lucide-react";
import api from "../api.js";
import Skeleton from "../components/Skeleton.jsx";
import usePolling from "../hooks/usePolling.js";

function MetricCard({ label, value }) {
  return (
    <div className="stat-mini">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function ConfusionMatrix({ matrix, labels }) {
  if (!matrix || !labels) return null;
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          {labels.map((l) => <th key={l}>Pred: {l}</th>)}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={labels[i]}>
            <th>Actual: {labels[i]}</th>
            {row.map((cell, j) => (
              <td key={j} style={{ fontWeight: i === j ? 700 : 400, color: i === j ? "var(--low)" : "var(--text)" }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ClassificationReport({ report }) {
  if (!report) return null;
  const rows = Object.entries(report).filter(([k]) => !["accuracy", "macro avg", "weighted avg"].includes(k));
  const summaryRows = Object.entries(report).filter(([k]) => ["macro avg", "weighted avg"].includes(k));
  return (
    <table>
      <thead>
        <tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1-Score</th><th>Support</th></tr>
      </thead>
      <tbody>
        {rows.map(([cls, m]) => (
          <tr key={cls}>
            <td>{cls}</td>
            <td>{(m.precision * 100).toFixed(1)}%</td>
            <td>{(m.recall * 100).toFixed(1)}%</td>
            <td>{(m["f1-score"] * 100).toFixed(1)}%</td>
            <td>{m.support}</td>
          </tr>
        ))}
        {summaryRows.map(([cls, m]) => (
          <tr key={cls} style={{ color: "var(--text-dim)" }}>
            <td>{cls}</td>
            <td>{(m.precision * 100).toFixed(1)}%</td>
            <td>{(m.recall * 100).toFixed(1)}%</td>
            <td>{(m["f1-score"] * 100).toFixed(1)}%</td>
            <td>{m.support}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Training() {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dataset, setDataset] = useState(null); // upload info from backend

  const [trainingId, setTrainingId] = useState(null);
  const [job, setJob] = useState(null); // { status, stage, progress, logs, metrics, error }
  const [activating, setActivating] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = async () => {
    const res = await api.get("/training/history", { params: { limit: 10 } });
    setHistory(res.data);
  };

  // Poll job status only while a training run is actually in flight.
  usePolling(
    async () => {
      if (!trainingId || job?.status === "completed" || job?.status === "failed") return;
      const res = await api.get(`/training/status/${trainingId}`);
      setJob(res.data);
      if (res.data.status === "completed") {
        toast.success("Training completed");
        loadHistory();
      } else if (res.data.status === "failed") {
        toast.error(res.data.error || "Training failed");
      }
    },
    1500,
    [trainingId, job?.status]
  );

  usePolling(loadHistory, 15000, []);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setUploading(true);
    setDataset(null);
    setJob(null);
    setTrainingId(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/training/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDataset(res.data);
      toast.success(`Dataset validated — ${res.data.rows} rows`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Dataset upload/validation failed");
    } finally {
      setUploading(false);
    }
  };

  const startTraining = async () => {
    if (!dataset) return;
    setJob({ status: "running", stage: "queued", progress: 0, logs: ["Starting training…"], metrics: null, error: null });
    try {
      const res = await api.post("/training/start", null, { params: { upload_id: dataset.upload_id } });
      setTrainingId(res.data.training_id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not start training");
      setJob(null);
    }
  };

  const activateModel = async () => {
    if (!trainingId) return;
    setActivating(true);
    try {
      await api.post(`/training/activate/${trainingId}`);
      toast.success("New model activated — now live for predictions");
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not activate model");
    } finally {
      setActivating(false);
    }
  };

  const metrics = job?.metrics;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Model Training</div>
        <button
          className="icon-btn"
          style={{ width: "auto", padding: "6px 12px", display: "flex", gap: 6 }}
          onClick={() => { setShowHistory((v) => !v); if (!showHistory) loadHistory(); }}
        >
          <History size={14} /> {showHistory ? "Hide" : "Show"} Training History
        </button>
      </div>

      {showHistory && (
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Past Training Runs</div>
          {history.length === 0 ? (
            <div className="empty-state">No training runs yet.</div>
          ) : (
            <table>
              <thead><tr><th>When</th><th>Accuracy</th><th>F1 Score</th><th>Samples</th><th>Status</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.created_at).toLocaleString()}</td>
                    <td>{(h.metrics.accuracy * 100).toFixed(2)}%</td>
                    <td>{(h.metrics.f1_score * 100).toFixed(2)}%</td>
                    <td>{h.metrics.training_samples + h.metrics.testing_samples}</td>
                    <td>{h.activated ? <span className="pill low">ACTIVE</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Step 1 — Upload */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>1. Upload Dataset</div>
        <div
          className={`dropzone${dragOver ? " drag-over" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <UploadCloud size={26} style={{ marginBottom: 8 }} />
          <div>{uploading ? "Uploading & validating…" : "Click to browse or drag a .csv dataset here"}</div>
          <div style={{ fontSize: "0.72rem", marginTop: 4 }}>
            Must include: duration, protocol_type, src_bytes, dst_bytes, packet_count, flow_rate,
            wrong_fragment, urgent, count, srv_count, label
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {dataset && (
          <div style={{ marginTop: 18 }}>
            <div className="grid grid-4" style={{ marginBottom: 14 }}>
              <MetricCard label="Rows" value={dataset.rows} />
              <MetricCard label="Columns" value={dataset.columns.length} />
              <MetricCard label="Missing Values" value={dataset.total_missing} />
              <MetricCard label="Classes" value={Object.keys(dataset.class_distribution).length} />
            </div>
            <div className="section-title" style={{ fontSize: "0.85rem" }}>Class Distribution</div>
            <table>
              <thead><tr><th>Class</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(dataset.class_distribution).map(([cls, count]) => (
                  <tr key={cls}><td>{cls}</td><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "10px 24px", marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}
              onClick={startTraining}
              disabled={job?.status === "running"}
            >
              <PlayCircle size={16} /> {job?.status === "running" ? "Training…" : "Start Training"}
            </button>
          </div>
        )}
      </div>

      {/* Step 2 — Progress + Logs */}
      {job && (
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>2. Training Progress</div>
          <div className="progress-track" style={{ marginBottom: 8 }}>
            <div className="progress-fill" style={{ width: `${job.progress || 0}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: 14 }}>
            <span>Stage: {job.stage}</span>
            <span>{job.progress || 0}%</span>
          </div>
          <div className="log-console">
            {(job.logs || []).map((line, i) => <div key={i}>› {line}</div>)}
          </div>
          {job.status === "failed" && <div className="error-text" style={{ marginTop: 10 }}>{job.error}</div>}
        </div>
      )}

      {/* Step 3 — Results */}
      {metrics && (
        <div className="glass-card">
          <div className="section-title" style={{ marginBottom: 10 }}>3. Training Results</div>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <MetricCard label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(2)}%`} />
            <MetricCard label="Precision" value={`${(metrics.precision * 100).toFixed(2)}%`} />
            <MetricCard label="Recall" value={`${(metrics.recall * 100).toFixed(2)}%`} />
            <MetricCard label="F1 Score" value={`${(metrics.f1_score * 100).toFixed(2)}%`} />
          </div>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <MetricCard label="Training Samples" value={metrics.training_samples} />
            <MetricCard label="Testing Samples" value={metrics.testing_samples} />
            <MetricCard label="Training Time" value={`${metrics.training_time_seconds}s`} />
            <MetricCard label="ROC-AUC" value={metrics.roc_auc != null ? metrics.roc_auc : "N/A"} />
          </div>

          <div className="section-title" style={{ fontSize: "0.85rem" }}>Confusion Matrix</div>
          <div style={{ marginBottom: 20, overflowX: "auto" }}>
            <ConfusionMatrix matrix={metrics.confusion_matrix} labels={metrics.confusion_matrix_labels} />
          </div>

          <div className="section-title" style={{ fontSize: "0.85rem" }}>Classification Report</div>
          <div style={{ marginBottom: 20, overflowX: "auto" }}>
            <ClassificationReport report={metrics.classification_report} />
          </div>

          <button
            className="btn-primary"
            style={{ width: "auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 8 }}
            onClick={activateModel}
            disabled={activating}
          >
            <CheckCircle2 size={16} /> {activating ? "Activating…" : "Save & Activate This Model"}
          </button>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 8 }}>
            This replaces the current live prediction model immediately — no server restart required.
          </div>
        </div>
      )}
    </div>
  );
}
