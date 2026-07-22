import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../services/api";
import TrafficPieChart from "../components/TrafficPieChart";
import AttackChart from "../components/AttackChart";

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
  total_traffic: 0,
  benign_traffic: 0,
  attack_traffic: 0,
  attack_percentage: 0,

  low: 0,
  medium: 0,
  high: 0,
  critical: 0,
  average_risk_score: 0
});

  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [prediction, setPrediction] = useState(null);
  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    await Promise.all([
      fetchSummary(),
      fetchTraffic(),
      fetchLatestPrediction(),
    ]);

    setLastUpdated(new Date().toLocaleString());

    setLoading(false);
  };

  const fetchSummary = async () => {
  try {

    const response = await API.get("/reports/summary");

    const data = response.data;

    setSummary({
      total_traffic: data.total_records,
      benign_traffic: data.benign,
      attack_traffic: data.attacks,
      attack_percentage: (
        (data.attacks / data.total_records) * 100
      ).toFixed(2),

      low: data.low,
      medium: data.medium,
      high: data.high,
      critical: data.critical,
      average_risk_score: data.average_risk_score
    });

  } catch (error) {
    console.log(error);
  }
};

  const fetchTraffic = async () => {
    try {
      const response = await API.get("/dashboard/traffic");
      setTraffic(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const fetchLatestPrediction = async () => {
  try {

    const trafficResponse = await API.get("/dashboard/traffic");

    if (trafficResponse.data.length === 0) return;

    const latestTraffic = trafficResponse.data[0];

    const predictionResponse = await API.get(
      `/predict/${latestTraffic.id}`
    );

    setPrediction(predictionResponse.data);

  } catch (error) {

    console.log(error);

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

      {/* Sidebar */}

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

      {/* Main Content */}

      <div className="main-content">

        <div className="dashboard-header">

          <h1>🛡 NetShield AI Dashboard</h1>

          <div className="dashboard-info">

            <span>🟢 System Online</span>

            <span>
              Last Updated: {lastUpdated}
            </span>

          </div>

        </div>

        {/* Summary Cards */}

        <div className="cards">

          <div className="card">
            <h3>Total Traffic</h3>
            <p>{summary.total_traffic.toLocaleString()}</p>
          </div>

          <div className="card">
            <h3>Attack Traffic</h3>
            <p>{summary.attack_traffic.toLocaleString()}</p>
          </div>

          <div className="card">
            <h3>Benign Traffic</h3>
            <p>{summary.benign_traffic.toLocaleString()}</p>
          </div>

          <div className="card">
            <h3>Attack %</h3>
            <p>{summary.attack_percentage}%</p>
          </div>
          <div className="card">
            <h3>Critical Threats</h3>
              <p>{summary.critical.toLocaleString()}</p>
          </div>

          <div className="card">
              <h3>High Threats</h3>
              <p>{summary.high.toLocaleString()}</p>
          </div>

          <div className="card">
              <h3>Medium Threats</h3>
              <p>{summary.medium.toLocaleString()}</p>
          </div>

          <div className="card">
              <h3>Low Threats</h3>
              <p>{summary.low.toLocaleString()}</p>
          </div>

          <div className="card">
              <h3>Average Risk</h3>
              <p>{summary.average_risk_score}</p>
          </div>

        </div>

        {/* Charts */}

        <div className="chart-section">

          <div className="chart-card">

            <h2>Traffic Distribution</h2>

            <TrafficPieChart
              benign={summary.benign_traffic}
              attack={summary.attack_traffic}
            />

          </div>

          <AttackChart />

        </div>
        {/* AI Prediction */}

        <div className="card" style={{ marginTop: "30px" }}>

          <h2>🤖 Latest AI Prediction</h2>

          {prediction ? (

          <div style={{ lineHeight: "2" }}>

             <p><strong>Traffic ID:</strong> {prediction.traffic_id}</p>

             <p><strong>Prediction:</strong> {prediction.predicted_label}</p>

             <p><strong>Status:</strong> {prediction.status}</p>

              <p><strong>Threat Level:</strong> {prediction.threat_level}</p>

              <p><strong>Risk Score:</strong> {prediction.risk_score}</p>

              <p><strong>Confidence:</strong> {prediction.confidence}%</p>

          </div>

         ) : (

            <p>No prediction available.</p>

           )}

        </div>
              {/* System Health */}

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
                <h4>Dataset</h4>
                <p>CICIDS2017 Loaded</p>
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

        {/* Recent Network Traffic */}

        <div className="alerts">

          <h2>Recent Network Traffic</h2>

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Destination Port</th>
                <th>Protocol</th>
                <th>Flow Duration</th>
                <th>Traffic Label</th>
              </tr>
            </thead>

            <tbody>

              {traffic.length > 0 ? (

                traffic.map((row, index) => (

                  <tr key={index}>

                    <td>{index + 1}</td>

                    <td>{row.destination_port}</td>

                    <td>{row.protocol}</td>

                    <td>{row.flow_duration}</td>

                    <td>

                      <div className="status-container">

                        <span
                          className={`status-dot ${
                            row.label === "BENIGN"
                              ? "green"
                              : row.label.includes("PortScan")
                              ? "yellow"
                              : row.label.includes("DoS")
                              ? "orange"
                              : row.label.includes("DDoS")
                              ? "red"
                              : row.label.includes("Bot")
                              ? "purple"
                              : row.label.includes("Web Attack")
                              ? "blue"
                              : row.label.includes("Heartbleed")
                              ? "pink"
                              : "red"
                          }`}
                        ></span>

                        <span className="status-text">
                          {row.label}
                        </span>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="5">
                    No traffic records found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;