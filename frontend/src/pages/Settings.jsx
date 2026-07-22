import { useState } from "react";
import "../styles/Settings.css";

function Settings() {
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [theme, setTheme] = useState("Dark");
  const [alertLevel, setAlertLevel] = useState("High");

  return (
    <div className="settings-page">

      <h1>⚙️ System Settings</h1>

      <div className="settings-card">

        <h2>Dashboard Settings</h2>

        <div className="setting-item">
          <label>Auto Refresh</label>

          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
          >
            <option value="10">10 Seconds</option>
            <option value="30">30 Seconds</option>
            <option value="60">60 Seconds</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Theme</label>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option>Dark</option>
            <option>Light</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Alert Severity</label>

          <select
            value={alertLevel}
            onChange={(e) => setAlertLevel(e.target.value)}
          >
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

      </div>

      <div className="settings-card">

        <h2>System Information</h2>

        <table className="system-table">

          <tbody>

            <tr>
              <td>Application</td>
              <td>NetShield AI</td>
            </tr>

            <tr>
              <td>Version</td>
              <td>1.0.0</td>
            </tr>

            <tr>
              <td>Backend</td>
              <td>FastAPI</td>
            </tr>

            <tr>
              <td>Database</td>
              <td>PostgreSQL</td>
            </tr>

            <tr>
              <td>Dataset</td>
              <td>CICIDS2017</td>
            </tr>

            <tr>
              <td>AI Model</td>
              <td>Pending (Milestone 3)</td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Settings;