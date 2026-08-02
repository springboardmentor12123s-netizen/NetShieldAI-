import { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await API.get("/alerts");
      setAlerts(response.data);
    } catch (error) {
      console.log(error);
    }
  };
const updateStatus = async (id, status) => {

  try {

    await API.put(`/alerts/${id}?status=${status}`);

    toast.success("Alert updated successfully");

    fetchAlerts();

  } catch (error) {

    console.log(error);

    toast.error("Failed to update alert");

  }

};
  return (
    <div style={{ padding: "30px" }}>
      <h1>🚨 Live Alerts</h1>

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
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
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.id}</td>
                <td>{alert.attack_type}</td>
                <td>{alert.severity}</td>
                <td>{alert.source_ip}</td>
                <td>{alert.destination_ip}</td>
                <td>{alert.protocol}</td>
                <td>

                    <select
                        value={alert.status}
                        onChange={(e) =>
                        updateStatus(alert.id, e.target.value)
                        }
                    >

                      <option value="OPEN">
                          OPEN
                      </option>

                      <option value="INVESTIGATING">
                          INVESTIGATING
                      </option>

                      <option value="RESOLVED">
                          RESOLVED
                      </option>

                    </select>

                </td>
                    <td>{alert.detected_at}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No alerts detected.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Alerts;