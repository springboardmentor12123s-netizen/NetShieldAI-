import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/Alerts.css";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAlerts(search, severity, page);
  }, [page]);

  const fetchAlerts = async (
    searchValue = "",
    severityValue = "",
    pageNumber = 1
  ) => {
    try {
      const response = await API.get("/alerts", {
        params: {
          search: searchValue,
          severity: severityValue,
          page: pageNumber,
        },
      });

      setAlerts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Low":
        return "#10b981";
      case "Medium":
        return "#facc15";
      case "High":
        return "#f97316";
      case "Critical":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div className="alerts-page">
      <h1>🚨 Security Alerts</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by Port, Protocol or Attack..."
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            setPage(1);
            fetchAlerts(value, severity, 1);
          }}
        />

        <select
          value={severity}
          onChange={(e) => {
            const value = e.target.value;
            setSeverity(value);
            setPage(1);
            fetchAlerts(search, value, 1);
          }}
        >
          <option value="">All Severities</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      <table className="alerts-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Destination Port</th>
            <th>Protocol</th>
            <th>Attack Type</th>
            <th>Severity</th>
          </tr>
        </thead>

        <tbody>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.id}</td>
                <td>{alert.destination_port}</td>
                <td>{alert.protocol}</td>
                <td>{alert.label}</td>

                <td>
                  <div className="severity-container">
                    <span
                      className="severity-dot"
                      style={{
                        backgroundColor: getSeverityColor(alert.severity),
                      }}
                    ></span>

                    <span>{alert.severity}</span>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No Alerts Found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => {
            const newPage = page - 1;
            setPage(newPage);
            fetchAlerts(search, severity, newPage);
          }}
        >
          Previous
        </button>

        <span>Page {page}</span>

        <button
          onClick={() => {
            const newPage = page + 1;
            setPage(newPage);
            fetchAlerts(search, severity, newPage);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Alerts;