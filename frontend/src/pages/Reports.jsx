import "../styles/Reports.css";

function Reports() {
  const downloadTrafficCSV = () => {
    window.open("http://127.0.0.1:8000/reports/traffic/csv", "_blank");
  };

  const downloadAlertsCSV = () => {
    window.open("http://127.0.0.1:8000/reports/alerts/csv", "_blank");
  };

  return (
    <div className="reports-page">
      <h1>📄 Reports</h1>

      <div className="reports-grid">
        <div className="report-card">
          <h2>Network Traffic Report</h2>

          <p>
            Download the complete network traffic dataset in CSV format.
          </p>

          <button onClick={downloadTrafficCSV}>
            Download CSV
          </button>
        </div>

        <div className="report-card">
          <h2>Security Alerts Report</h2>

          <p>
            Download all detected attacks and alerts in CSV format.
          </p>

          <button onClick={downloadAlertsCSV}>
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;