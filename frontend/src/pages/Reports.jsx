import "../styles/Reports.css";
import { useEffect, useState } from "react";
import API from "../services/api";

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

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {

      const predictionResponse =
        await API.get("/traffic/predictions");

      const alertResponse =
        await API.get("/alerts/");

      const predictions = predictionResponse.data;

      const benign =
        predictions.filter(
          p => p.prediction === "BENIGN"
        ).length;

      const attacks =
        predictions.length - benign;

      const critical =
        predictions.filter(
          p => p.severity === "CRITICAL"
        ).length;

      const high =
        predictions.filter(
          p => p.severity === "HIGH"
        ).length;

      const medium =
        predictions.filter(
          p => p.severity === "MEDIUM"
        ).length;

      const low =
        predictions.filter(
          p => p.severity === "LOW"
        ).length;

      setSummary({
        totalPackets: predictions.length,
        benign,
        attacks,
        critical,
        high,
        medium,
        low
      });

      setAlerts(alertResponse.data);

    } catch (error) {
      console.log(error);
    }
  };

  const downloadTrafficCSV = () => {
    window.open(
      "http://127.0.0.1:8000/reports/traffic/csv",
      "_blank"
    );
  };

  const downloadAlertsCSV = () => {
    window.open(
      "http://127.0.0.1:8000/reports/alerts/csv",
      "_blank"
    );
  };

  return (

    <div className="reports-page">

      <h1>🛡 Threat Intelligence Report</h1>

      <div className="report-card">

        <h2>Network Summary</h2>

        <p><strong>Total Live Packets:</strong> {summary.totalPackets}</p>

        <p><strong>Benign Traffic:</strong> {summary.benign}</p>

        <p><strong>Detected Attacks:</strong> {summary.attacks}</p>

        <p><strong>Critical:</strong> {summary.critical}</p>

        <p><strong>High:</strong> {summary.high}</p>

        <p><strong>Medium:</strong> {summary.medium}</p>

        <p><strong>Low:</strong> {summary.low}</p>

        <p>

          <strong>Overall Health:</strong>{" "}

          {summary.attacks === 0
            ? "✅ Network Healthy"
            : "⚠ Threats Detected"}

        </p>

      </div>

      <div className="report-card">

        <h2>Recent Alerts</h2>

        {
          alerts.length === 0 ?

          <p>No Active Alerts</p>

          :

          alerts.map(alert => (

            <div
              key={alert.id}
              style={{ marginBottom: "15px" }}
            >

              <strong>{alert.attack_type}</strong>

              <br/>

              Severity: {alert.severity}

              <br/>

              Status: {alert.status}

              <hr/>

            </div>

          ))
        }

      </div>

      <div className="reports-grid">

        <div className="report-card">

          <h2>Network Traffic Report</h2>

          <button
            onClick={downloadTrafficCSV}
          >
            Download Traffic CSV
          </button>

        </div>

        <div className="report-card">

          <h2>Security Alerts Report</h2>

          <button
            onClick={downloadAlertsCSV}
          >
            Download Alerts CSV
          </button>

        </div>

      </div>

    </div>

  );
}

export default Reports;