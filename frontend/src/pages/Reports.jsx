import "../styles/Reports.css";
import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function Reports() {
  const [summary, setSummary] = useState({
    totalPackets: 0,
    benign: 0,
    attacks: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);

      const [predictionResponse, alertResponse] = await Promise.all([
        API.get("/traffic/predictions"),
        API.get("/alerts"),
      ]);

      const predictionData = predictionResponse.data;

      let predictions = [];

      if (Array.isArray(predictionData)) {
        predictions = predictionData;
      } else if (Array.isArray(predictionData?.predictions)) {
        predictions = predictionData.predictions;
      } else if (Array.isArray(predictionData?.items)) {
        predictions = predictionData.items;
      }

      const benign = predictions.filter(
        (p) =>
          String(
            p.prediction ??
              p.predicted_label ??
              p.actual_label ??
              ""
          ).toUpperCase() === "BENIGN"
      ).length;

      const attacks = predictions.length - benign;

      const critical = predictions.filter(
        (p) =>
          String(p.severity ?? p.threat_level ?? "").toUpperCase() ===
          "CRITICAL"
      ).length;

      const high = predictions.filter(
        (p) =>
          String(p.severity ?? p.threat_level ?? "").toUpperCase() === "HIGH"
      ).length;

      const medium = predictions.filter(
        (p) =>
          String(p.severity ?? p.threat_level ?? "").toUpperCase() ===
          "MEDIUM"
      ).length;

      const low = predictions.filter(
        (p) =>
          String(p.severity ?? p.threat_level ?? "").toUpperCase() === "LOW"
      ).length;

      setSummary({
        totalPackets: predictions.length,
        benign,
        attacks,
        critical,
        high,
        medium,
        low,
      });

      // -------------------------
      // HANDLE ALERT RESPONSE
      // -------------------------
      const alertData = alertResponse.data;

      if (Array.isArray(alertData)) {
        setAlerts(alertData);
      } else if (Array.isArray(alertData?.alerts)) {
        setAlerts(alertData.alerts);
      } else if (Array.isArray(alertData?.items)) {
        setAlerts(alertData.items);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Failed to load report:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const downloadTrafficCSV = () => {
    const baseURL = API.defaults.baseURL || "http://127.0.0.1:8000";

    window.open(
      `${baseURL}/reports/traffic/csv`,
      "_blank"
    );
  };

  const downloadAlertsCSV = () => {
    const baseURL = API.defaults.baseURL || "http://127.0.0.1:8000";

    window.open(
      `${baseURL}/reports/alerts/csv`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="loading-icon">📊</div>
          <h2>Generating Security Report...</h2>
          <p>
            Collecting network traffic and security information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">

      {/* =========================
          HEADER
      ========================= */}
      <div className="reports-header">

        <div>
          <h1>🛡️ Threat Intelligence Report</h1>

          <p>
            Network security overview, threat analysis and incident summary
          </p>
        </div>

        <button
          className="report-refresh-btn"
          onClick={fetchReport}
        >
          🔄 Refresh Report
        </button>

      </div>

      {/* =========================
          NETWORK SUMMARY
      ========================= */}
      <div className="report-stats">

        <div className="report-stat-card total">
          <div className="report-stat-icon">
            📡
          </div>

          <div>
            <span>Total Traffic</span>
            <strong>
              {summary.totalPackets.toLocaleString()}
            </strong>
          </div>
        </div>


        <div className="report-stat-card benign">
          <div className="report-stat-icon">
            🟢
          </div>

          <div>
            <span>Benign Traffic</span>
            <strong>
              {summary.benign.toLocaleString()}
            </strong>
          </div>
        </div>


        <div className="report-stat-card attacks">
          <div className="report-stat-icon">
            🔴
          </div>

          <div>
            <span>Detected Attacks</span>
            <strong>
              {summary.attacks.toLocaleString()}
            </strong>
          </div>
        </div>


        <div className="report-stat-card health">
          <div className="report-stat-icon">
            {summary.attacks === 0 ? "🟢" : "⚠️"}
          </div>

          <div>
            <span>Network Status</span>

            <strong>
              {summary.attacks === 0
                ? "Healthy"
                : "Threats Detected"}
            </strong>
          </div>
        </div>

      </div>


      {/* =========================
          SEVERITY BREAKDOWN
      ========================= */}
      <div className="report-card">

        <div className="section-title">
          <div>
            <h2>🚨 Threat Severity Breakdown</h2>
            <p>
              Distribution of detected network threats by severity
            </p>
          </div>
        </div>


        <div className="severity-grid">

          <div className="severity-item critical">
            <span>🔴</span>
            <div>
              <small>Critical</small>
              <strong>{summary.critical}</strong>
            </div>
          </div>


          <div className="severity-item high">
            <span>🟠</span>
            <div>
              <small>High</small>
              <strong>{summary.high}</strong>
            </div>
          </div>


          <div className="severity-item medium">
            <span>🟡</span>
            <div>
              <small>Medium</small>
              <strong>{summary.medium}</strong>
            </div>
          </div>


          <div className="severity-item low">
            <span>🟢</span>
            <div>
              <small>Low</small>
              <strong>{summary.low}</strong>
            </div>
          </div>

        </div>

      </div>


      {/* =========================
          SECURITY STATUS
      ========================= */}
      <div className="report-card security-status">

        <div className="security-status-icon">
          {summary.attacks === 0 ? "🛡️" : "⚠️"}
        </div>

        <div>

          <h2>
            {summary.attacks === 0
              ? "Network Security Status: Healthy"
              : "Network Security Status: Threats Detected"}
          </h2>

          <p>
            {summary.attacks === 0
              ? "No malicious network activity has been detected in the monitored traffic."
              : `${summary.attacks.toLocaleString()} potentially malicious traffic records were detected and require attention.`}
          </p>

        </div>

      </div>


      {/* =========================
          RECENT ALERTS
      ========================= */}
      <div className="report-card">

        <div className="section-title">

          <div>
            <h2>🚨 Recent Security Alerts</h2>

            <p>
              Latest detected security incidents
            </p>
          </div>

          <span className="alert-count">
            {alerts.length} Alerts
          </span>

        </div>


        {alerts.length === 0 ? (

          <div className="no-report-alerts">

            <div>🛡️</div>

            <h3>No Active Security Alerts</h3>

            <p>
              Your network is currently showing no detected security incidents.
            </p>

          </div>

        ) : (

          <div className="report-alert-list">

            {alerts.slice(0, 10).map((alert, index) => {

              const alertId =
                alert.id ??
                alert.alert_id ??
                alert.traffic_id ??
                index;

              const severity = String(
                alert.severity || "LOW"
              ).toUpperCase();

              return (
                <div
                  className="report-alert-row"
                  key={alertId}
                >

                  <div className="alert-main">

                    <strong>
                      {alert.attack_type || "Unknown Attack"}
                    </strong>

                    <span>
                      {alert.source_ip || "-"} →{" "}
                      {alert.destination_ip || "-"}
                    </span>

                  </div>


                  <span
                    className={`report-severity ${severity.toLowerCase()}`}
                  >
                    {severity}
                  </span>


                  <span className="report-status">
                    {alert.status || "OPEN"}
                  </span>

                </div>
              );
            })}

          </div>

        )}

      </div>


      {/* =========================
          DOWNLOAD REPORTS
      ========================= */}
      <div className="reports-grid">

        <div className="report-card download-card">

          <div className="download-icon">
            📊
          </div>

          <div>

            <h2>Network Traffic Report</h2>

            <p>
              Export monitored network traffic data as a CSV file.
            </p>

            <button
              className="download-btn"
              onClick={downloadTrafficCSV}
            >
              📥 Download Traffic CSV
            </button>

          </div>

        </div>


        <div className="report-card download-card">

          <div className="download-icon">
            🚨
          </div>

          <div>

            <h2>Security Alerts Report</h2>

            <p>
              Export detected security alerts and incidents as a CSV file.
            </p>

            <button
              className="download-btn alert-download"
              onClick={downloadAlertsCSV}
            >
              📥 Download Alerts CSV
            </button>

          </div>

        </div>

      </div>


      {/* =========================
          FOOTER
      ========================= */}
      <div className="reports-footer">

        <span>
          🕒 Report generated from current monitored traffic
        </span>

        <span>
          NetShield AI • Threat Intelligence & Security Monitoring
        </span>

      </div>

    </div>
  );
}

export default Reports;