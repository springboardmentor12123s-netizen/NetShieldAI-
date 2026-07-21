import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { BarRow, Badge, EmptyState } from "../components/UI";
import { Api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatTime } from "../lib/format";

const RISK_COLORS = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
};
const RISK_LEVELS = ["low", "medium", "high", "critical"];

function MetricTile({ label, value }) {
  return (
    <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)", padding: 14 }}>
      <div className="stat-value" style={{ fontSize: 20 }}>{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function AnomalyDetection() {
  const { showToast } = useToast();
  const [dataset, setDataset] = useState("synthetic");
  const [sampleSize, setSampleSize] = useState(4000);
  const [scoreLimit, setScoreLimit] = useState(500);
  const [training, setTraining] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [runs, setRuns] = useState([]);
  const [report, setReport] = useState(null);
  const [results, setResults] = useState([]);
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);

  const loadRuns = useCallback(async () => {
    setRuns(await Api.get("/anomaly/model-runs"));
  }, []);

  const loadReport = useCallback(async () => {
    setReport(await Api.get("/anomaly/report"));
  }, []);

  const loadResults = useCallback(async (anomaliesOnly) => {
    setResults(await Api.get(`/anomaly/results?limit=50&only_anomalies=${anomaliesOnly}`));
  }, []);

  useEffect(() => {
    Promise.all([loadRuns(), loadReport(), loadResults(onlyAnomalies)]).catch((err) => showToast(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadResults(onlyAnomalies).catch((err) => showToast(err.message, "error"));
  }, [onlyAnomalies, loadResults, showToast]);

  async function handleTrain() {
    setTraining(true);
    try {
      await Api.post("/anomaly/train", { dataset, sample_size: Number(sampleSize) });
      showToast("Training complete");
      await loadRuns();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTraining(false);
    }
  }

  async function handleScore() {
    setScoring(true);
    try {
      const scored = await Api.post("/anomaly/score", { limit: Number(scoreLimit) });
      showToast(`Scored ${scored.length} flows`);
      await Promise.all([loadReport(), loadResults(onlyAnomalies)]);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setScoring(false);
    }
  }

  const latest = runs[0];
  const riskMax = report ? Math.max(...RISK_LEVELS.map((l) => report.risk_level_breakdown?.[l] || 0), 1) : 1;
  const attackEntries = report ? Object.entries(report.attack_type_breakdown || {}) : [];
  const attackMax = attackEntries.length ? Math.max(...attackEntries.map(([, v]) => v), 1) : 1;

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>Anomaly Detection &amp; Intrusion Prediction</h1>
          <div className="topbar-sub">Isolation Forest + One-Class SVM ensemble, Random Forest attack classification, composite risk scoring</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-eyebrow">Step 1</div>
              <div className="panel-title">Train detection models</div>
            </div>
          </div>
          <div className="field">
            <label htmlFor="dataset">Training dataset</label>
            <select id="dataset" value={dataset} onChange={(e) => setDataset(e.target.value)}>
              <option value="synthetic">Synthetic traffic generator</option>
              <option value="cicids2017">CICIDS2017</option>
              <option value="unsw-nb15">UNSW-NB15</option>
            </select>
            <div className="field-hint">Falls back to synthetic data automatically if the benchmark CSV isn't present in <code>data/raw/</code>.</div>
          </div>
          <div className="field">
            <label htmlFor="sampleSize">Sample size</label>
            <input id="sampleSize" type="number" min={200} max={50000} value={sampleSize} onChange={(e) => setSampleSize(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleTrain} disabled={training}>
            {training ? "Training…" : "Train models"}
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-eyebrow">Step 2</div>
              <div className="panel-title">Score captured traffic</div>
            </div>
          </div>
          <p className="section-desc">Runs every not-yet-scored flow through the trained ensemble and classifier, writes risk scores, and opens alerts for high/critical results.</p>
          <div className="field">
            <label htmlFor="scoreLimit">Flows to score (max per run)</label>
            <input id="scoreLimit" type="number" min={10} max={5000} value={scoreLimit} onChange={(e) => setScoreLimit(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-block" onClick={handleScore} disabled={scoring}>
            {scoring ? "Scoring…" : "Run scoring"}
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-eyebrow">Model performance</div>
              <div className="panel-title">{latest ? `${latest.model_name.replace(/_/g, " ")} · ${latest.dataset_used}` : "No training run yet"}</div>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {latest ? (
              <>
                <MetricTile label="Accuracy" value={latest.accuracy} />
                <MetricTile label="Precision" value={latest.precision} />
                <MetricTile label="Recall" value={latest.recall} />
                <MetricTile label="F1-score" value={latest.f1_score} />
              </>
            ) : (
              <div style={{ gridColumn: "span 2" }}><EmptyState>Train a model to see metrics</EmptyState></div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Anomaly detection report</div></div>
          {report && (
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
              <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)" }}>
                <div className="stat-value">{report.total_scored.toLocaleString()}</div><div className="stat-label">Flows scored</div>
              </div>
              <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)" }}>
                <div className="stat-value">{report.anomalies_detected.toLocaleString()}</div><div className="stat-label">Anomalies</div>
              </div>
              <div className="panel stat-card" style={{ background: "var(--bg-panel-raised)" }}>
                <div className="stat-value">{report.avg_risk_score}</div><div className="stat-label">Avg. risk score</div>
              </div>
            </div>
          )}
          {report && RISK_LEVELS.map((level) => (
            <BarRow key={level} label={level} value={report.risk_level_breakdown?.[level] || 0} max={riskMax} color={RISK_COLORS[level]} />
          ))}
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">Predicted attack types</div></div>
          {attackEntries.length ? (
            attackEntries.map(([k, v]) => <BarRow key={k} label={k.replace(/_/g, " ")} value={v} max={attackMax} />)
          ) : <EmptyState>No results yet — run scoring first</EmptyState>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Recent scoring results</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={onlyAnomalies} onChange={(e) => setOnlyAnomalies(e.target.checked)} /> Anomalies only
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scored at</th><th>Attack type</th><th>Confidence</th>
                <th>Ensemble score</th><th>Risk score</th><th>Risk level</th>
              </tr>
            </thead>
            <tbody>
              {results.length ? results.map((r) => (
                <tr key={r.id}>
                  <td>{formatTime(r.created_at)}</td>
                  <td className="primary">{r.predicted_attack_type.replace(/_/g, " ")}</td>
                  <td>{(r.attack_confidence * 100).toFixed(1)}%</td>
                  <td>{r.ensemble_anomaly_score.toFixed(3)}</td>
                  <td>{r.risk_score}</td>
                  <td><Badge level={r.risk_level} /></td>
                </tr>
              )) : (
                <tr><td colSpan={6}><EmptyState>No scoring results yet.</EmptyState></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
