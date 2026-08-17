import { useState, useEffect, useMemo, useCallback } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import "../styles/Alerts.css";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async (showToast = false) => {
    try {
      setLoading(true);

      const response = await API.get("/alerts");

      const data = response.data;

      if (Array.isArray(data)) {
        setAlerts(data);
      } else if (Array.isArray(data?.alerts)) {
        setAlerts(data.alerts);
      } else if (Array.isArray(data?.items)) {
        setAlerts(data.items);
      } else {
        setAlerts([]);
      }

      if (showToast) {
        toast.success("Alerts refreshed successfully");
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/alerts/${id}?status=${status}`);

      toast.success("Alert status updated");

      fetchAlerts();
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update alert");
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !search ||
        String(alert.attack_type || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.source_ip || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.destination_ip || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.protocol || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.status || "")
          .toLowerCase()
          .includes(search);

      const matchesSeverity =
        severityFilter === "ALL" ||
        String(alert.severity || "").toUpperCase() === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [alerts, searchTerm, severityFilter]);

  const totalAlerts = alerts.length;

  const criticalAlerts = alerts.filter(
    (alert) =>
      String(alert.severity || "").toUpperCase() === "CRITICAL"
  ).length;

  const highAlerts = alerts.filter(
    (alert) => String(alert.severity || "").toUpperCase() === "HIGH"
  ).length;

  const openAlerts = alerts.filter(
    (alert) => String(alert.status || "").toUpperCase() === "OPEN"
  ).length;

  return (
    <div className="alerts-page">

      {/* HEADER */}
      <div className="alerts-header">
        <div>
          <h1>🚨 Security Alerts</h1>
          <p>
            Real-time network threat detection and incident monitoring
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={() => fetchAlerts(true)}
          disabled={loading}
        >
          🔄 {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* STATISTICS */}
      <div className="alert-stats">

        <div className="stat-card total-card">
          <div className="stat-icon">🚨</div>
          <div>
            <h3>Total Alerts</h3>
            <strong>{totalAlerts}</strong>
          </div>
        </div>

        <div className="stat-card critical-card">
          <div className="stat-icon">🔴</div>
          <div>
            <h3>Critical</h3>
            <strong>{criticalAlerts}</strong>
          </div>
        </div>

        <div className="stat-card high-card">
          <div className="stat-icon">🟠</div>
          <div>
            <h3>High Severity</h3>
            <strong>{highAlerts}</strong>
          </div>
        </div>

        <div className="stat-card open-card">
          <div className="stat-icon">⚠️</div>
          <div>
            <h3>Open Alerts</h3>
            <strong>{openAlerts}</strong>
          </div>
        </div>

      </div>

      {/* SEARCH / FILTER */}
      <div className="alert-controls">

        <div className="search-container">
          <span>🔎</span>

          <input
            type="text"
            placeholder="Search attack type, IP, protocol, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="severity-select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="ALL">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {(searchTerm || severityFilter !== "ALL") && (
          <button
            className="clear-btn"
            onClick={() => {
              setSearchTerm("");
              setSeverityFilter("ALL");
            }}
          >
            Clear
          </button>
        )}

      </div>

      {/* ALERT TABLE */}
      <div className="alerts-table-container">

        <table className="alerts-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Attack Type</th>
              <th>Severity</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Status</th>
              <th>Detected At</th>
            </tr>
          </thead>

          <tbody>

            {filteredAlerts.length > 0 ? (

              filteredAlerts.map((alert) => {

                const alertId =
                  alert.id ??
                  alert.alert_id ??
                  alert.traffic_id;

                const severity = String(
                  alert.severity || "LOW"
                ).toUpperCase();

                return (
                  <tr key={alertId}>

                    <td>{alertId}</td>

                    <td className="attack-name">
                      {alert.attack_type || "Unknown"}
                    </td>

                    <td>
                      <span
                        className={`severity-badge ${severity.toLowerCase()}`}
                      >
                        {severity}
                      </span>
                    </td>

                    <td>{alert.source_ip || "-"}</td>

                    <td>{alert.destination_ip || "-"}</td>

                    <td>{alert.protocol || "-"}</td>

                    <td>
                      <select
                        className={`status-select ${String(
                          alert.status || "OPEN"
                        ).toLowerCase()}`}
                        value={alert.status || "OPEN"}
                        onChange={(e) =>
                          updateStatus(alertId, e.target.value)
                        }
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="INVESTIGATING">
                          INVESTIGATING
                        </option>
                        <option value="RESOLVED">
                          RESOLVED
                        </option>
                      </select>
                    </td>

                    <td>
                      {alert.detected_at
                        ? new Date(
                            alert.detected_at
                          ).toLocaleString()
                        : "-"}
                    </td>

                  </tr>
                );
              })

            ) : (

              <tr>
                <td colSpan="8">

                  <div className="no-alerts">

                    <div className="no-alert-icon">
                      🛡️
                    </div>

                    <h2>
                      {alerts.length === 0
                        ? "No Security Alerts"
                        : "No Matching Alerts"}
                    </h2>

                    <p>
                      {alerts.length === 0
                        ? "Your network is currently showing no detected threats."
                        : "Try changing your search or severity filter."}
                    </p>

                  </div>

                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* FOOTER */}
      <div className="alerts-footer">
        Showing {filteredAlerts.length} of {totalAlerts} alerts
        <span> • Auto-refresh every 5 seconds</span>
      </div>

    </div>
  );
}

export default Alerts;