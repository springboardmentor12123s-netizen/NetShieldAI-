import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import TrafficPieChart from "../components/TrafficPieChart";
import AttackChart from "../components/AttackChart";
import { toast } from "react-toastify";

function Dashboard() {
  const navigate = useNavigate();

  const lastAlertId = useRef(null);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const [livePredictions, setLivePredictions] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [modelPerformance, setModelPerformance] = useState(null);

  const [liveStats, setLiveStats] = useState({
    totalPackets: 0,
    benign: 0,
    attacks: 0,
    critical: 0,
  });

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [, alerts] = await Promise.all([
        fetchLivePredictions(),
        fetchLiveAlerts(),
        fetchModelPerformance(),
      ]);

      checkForNewAlert(alerts);

      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Dashboard refresh failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePredictions = async () => {
    try {
      const response = await API.get("/traffic/predictions");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      calculateLiveStats(data);

      setLivePredictions(data);
    } catch (error) {
      console.error("Failed to load live predictions:", error);
    }
  };

  // =========================================================
  // CALCULATE LIVE STATISTICS
  // =========================================================

  const calculateLiveStats = (data) => {
    const benign = data.filter(
      (packet) => packet.prediction === "BENIGN"
    ).length;

    const attacks = data.length - benign;

    const critical = data.filter(
      (packet) => packet.severity === "CRITICAL"
    ).length;

    setLiveStats({
      totalPackets: data.length,
      benign,
      attacks,
      critical,
    });
  };

  const fetchLiveAlerts = async () => {
    try {
      const response = await API.get("/alerts/");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setLiveAlerts(data);

      return data;
    } catch (error) {
      console.error("Failed to load alerts:", error);

      return [];
    }
  };

  const checkForNewAlert = (alerts) => {
    if (!alerts || alerts.length === 0) {
      return;
    }

    const latestAlert = alerts[0];

    if (lastAlertId.current !== latestAlert.id) {
      lastAlertId.current = latestAlert.id;

      toast.error(
        `🚨 ${latestAlert.attack_type}\nSeverity: ${latestAlert.severity}`,
        {
          autoClose: 6000,
        }
      );
    }
  };

  const fetchModelPerformance = async () => {
    try {
      const response = await API.get("/model/performance");

      setModelPerformance(response.data);
    } catch (error) {
      console.error(
        "Failed to load model performance:",
        error
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <div className="sidebar">

        <h2>🛡 NetShield AI</h2>

        <ul>

          <li>Dashboard</li>

          <li onClick={() => navigate("/traffic")}>
            Traffic
          </li>

          <li onClick={() => navigate("/analytics")}>
            Analytics
          </li>

          <li onClick={() => navigate("/alerts")}>
            Alerts
          </li>

          <li onClick={() => navigate("/reports")}>
            Reports
          </li>

          <li onClick={() => navigate("/settings")}>
            Settings
          </li>

        </ul>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="main-content">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="dashboard-header">

          <h1>🛡 NetShield AI Dashboard</h1>

          <div className="dashboard-info">

            <span>
              🟢 System Online
            </span>

            <span>
              Last Updated: {lastUpdated}
            </span>

          </div>

        </div>

        {/* ===================================================
            SUMMARY CARDS
        =================================================== */}

        <div className="cards">

          <div className="card">
            <h3>Live Packets</h3>
            <p>{liveStats.totalPackets}</p>
          </div>

          <div className="card">
            <h3>Benign</h3>
            <p>{liveStats.benign}</p>
          </div>

          <div className="card">
            <h3>Attacks</h3>
            <p>{liveStats.attacks}</p>
          </div>

          <div className="card">
            <h3>Critical</h3>
            <p>{liveStats.critical}</p>
          </div>

        </div>

        {/* ===================================================
            CHARTS
        =================================================== */}

        <div className="chart-section">

          <div className="chart-card">

            <h2>Traffic Distribution</h2>

            <TrafficPieChart
              benign={liveStats.benign}
              attack={liveStats.attacks}
            />

          </div>

          <AttackChart />

        </div>

        {/* ===================================================
            LIVE AI PREDICTIONS
        =================================================== */}

        <div
          className="alerts"
          style={{ marginTop: "30px" }}
        >

          <h2>🌐 Live AI Predictions</h2>

          <table>

            <thead>

              <tr>
                <th>#</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th>Prediction</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {livePredictions.length > 0 ? (

                livePredictions
                  .slice(0, 10)
                  .map((packet, index) => (

                    <tr
                      key={
                        packet.traffic_id ||
                        `${packet.source_ip}-${packet.destination_ip}-${index}`
                      }
                    >

                      <td>{index + 1}</td>

                      <td>
                        {packet.source_ip}
                      </td>

                      <td>
                        {packet.destination_ip}
                      </td>

                      <td>
                        {packet.protocol}
                      </td>

                      <td>
                        {packet.prediction}
                      </td>

                      <td>
                        {packet.severity}
                      </td>

                      <td>
                        {packet.status}
                      </td>

                    </tr>

                  ))

              ) : (

                <tr>

                  <td colSpan="7">
                    No live traffic detected.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            LIVE ALERTS
        =================================================== */}

        <div
          className="alerts"
          style={{ marginTop: "30px" }}
        >

          <h2>🚨 Live Alerts</h2>

          <table>

            <thead>

              <tr>
                <th>#</th>
                <th>Attack</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {liveAlerts.length > 0 ? (

                liveAlerts
                  .slice(0, 5)
                  .map((alert, index) => (

                    <tr
                      key={
                        alert.id ||
                        `${alert.attack_type}-${index}`
                      }
                    >

                      <td>{index + 1}</td>

                      <td>
                        {alert.attack_type}
                      </td>

                      <td>
                        {alert.severity}
                      </td>

                      <td>
                        {alert.status}
                      </td>

                    </tr>

                  ))

              ) : (

                <tr>

                  <td colSpan="4">
                    No Active Alerts
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            AI MODEL PERFORMANCE
        =================================================== */}

        <div className="ai-performance">

          <h2>🤖 AI Model Performance</h2>

          {modelPerformance && (

            <>

              {/* MODEL INFORMATION */}

              <div className="model-info">

                <p>

                  <strong>Model:</strong>{" "}

                  {modelPerformance.model.name}

                </p>

                <p>

                  <strong>
                    Validation Samples:
                  </strong>{" "}

                  {modelPerformance.model.validation_samples
                    .toLocaleString()}

                </p>

              </div>

              {/* OVERALL METRICS */}

              <div className="performance-grid">

                <div className="performance-card">

                  <h4>Accuracy</h4>

                  <p>
                    {
                      modelPerformance
                        .overall_metrics
                        .accuracy
                    }%
                  </p>

                </div>

                <div className="performance-card">

                  <h4>Precision</h4>

                  <p>
                    {
                      modelPerformance
                        .overall_metrics
                        .weighted_precision
                    }%
                  </p>

                </div>

                <div className="performance-card">

                  <h4>Recall</h4>

                  <p>
                    {
                      modelPerformance
                        .overall_metrics
                        .weighted_recall
                    }%
                  </p>

                </div>

                <div className="performance-card">

                  <h4>F1 Score</h4>

                  <p>
                    {
                      modelPerformance
                        .overall_metrics
                        .weighted_f1
                    }%
                  </p>

                </div>

              </div>

              {/* MACRO METRICS */}

              <div className="macro-metrics">

                <h3>Macro Performance</h3>

                <div className="performance-grid">

                  <div className="performance-card">

                    <h4>Macro Precision</h4>

                    <p>
                      {
                        modelPerformance
                          .macro_metrics
                          .macro_precision
                      }%
                    </p>

                  </div>

                  <div className="performance-card">

                    <h4>Macro Recall</h4>

                    <p>
                      {
                        modelPerformance
                          .macro_metrics
                          .macro_recall
                      }%
                    </p>

                  </div>

                  <div className="performance-card">

                    <h4>Macro F1</h4>

                    <p>
                      {
                        modelPerformance
                          .macro_metrics
                          .macro_f1
                      }%
                    </p>

                  </div>

                </div>

              </div>

              {/* RUNTIME PERFORMANCE */}

              <div className="runtime-performance">

                <h3>
                  ⚡ Runtime Performance
                </h3>

                <div className="performance-grid">

                  <div className="performance-card">

                    <h4>Confidence</h4>

                    <p>
                      {
                        modelPerformance
                          .performance
                          .average_confidence
                      }%
                    </p>

                  </div>

                  <div className="performance-card">

                    <h4>
                      Predictions / Second
                    </h4>

                    <p>

                      {Math.round(
                        modelPerformance
                          .performance
                          .predictions_per_second
                      ).toLocaleString()}

                    </p>

                  </div>

                  <div className="performance-card">

                    <h4>
                      Prediction Time
                    </h4>

                    <p>

                      {
                        modelPerformance
                          .performance
                          .average_prediction_time_ms
                      }{" "}
                      ms

                    </p>

                  </div>

                </div>

              </div>

              {/* ATTACK CLASS PERFORMANCE */}

              <div className="class-performance">

                <h3>
                  📊 Attack Class Performance
                </h3>

                <table>

                  <thead>

                    <tr>
                      <th>Attack Type</th>
                      <th>Precision</th>
                      <th>Recall</th>
                      <th>F1 Score</th>
                    </tr>

                  </thead>

                  <tbody>

                    {Array.isArray(
                      modelPerformance.class_performance
                    ) &&

                      modelPerformance.class_performance.map(
                        (item, index) => (

                          <tr key={index}>

                            <td>
                              {item.attack_type}
                            </td>

                            <td>
                              {(
                                item.precision * 100
                              ).toFixed(2)}
                              %
                            </td>

                            <td>
                              {(
                                item.recall * 100
                              ).toFixed(2)}
                              %
                            </td>

                            <td>
                              {(
                                item.f1_score * 100
                              ).toFixed(2)}
                              %
                            </td>

                          </tr>

                        )
                      )}

                  </tbody>

                </table>

              </div>

            </>

          )}

        </div>

        {/* ===================================================
            SYSTEM HEALTH
        =================================================== */}

        <div className="system-health">

          <h2>🖥 System Health</h2>

          <div className="health-grid">

            <div className="health-card">

              <span className="health-dot green"></span>

              <div>

                <h4>Backend API</h4>

                <p>Online</p>

              </div>

            </div>

            <div className="health-card">

              <span className="health-dot green"></span>

              <div>

                <h4>PostgreSQL</h4>

                <p>Connected</p>

              </div>

            </div>

            <div className="health-card">

              <span className="health-dot green"></span>

              <div>

                <h4>Packet Capture</h4>

                <p>Live Monitoring</p>

              </div>

            </div>

            <div className="health-card">

              <span className="health-dot green"></span>

              <div>

                <h4>AI Engine</h4>

                <p>Model Loaded</p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;