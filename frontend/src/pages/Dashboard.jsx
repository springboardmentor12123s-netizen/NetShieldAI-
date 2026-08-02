import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../services/api";
import TrafficPieChart from "../components/TrafficPieChart";
import AttackChart from "../components/AttackChart";
import { toast } from "react-toastify";
import { useRef } from "react";
function Dashboard() {
  const navigate = useNavigate();
  const lastAlertId = useRef(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [livePredictions, setLivePredictions] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveStats, setLiveStats] = useState({
  totalPackets: 0,
  benign: 0,
  attacks: 0,
  critical: 0
});
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
      fetchLivePredictions(),
      fetchLiveAlerts(),
    ]);
    await checkForNewAlerts();

    setLastUpdated(new Date().toLocaleString());

    setLoading(false);
  };


const fetchLivePredictions = async () => {

  try {

    const response = await API.get("/traffic/predictions");


    calculateLiveStats(response.data);

    setLivePredictions(response.data);

  } catch (error) {
    console.log(error);
  }

};
 const calculateLiveStats = (data) => {

  const benign = data.filter(
    p => p.prediction === "BENIGN"
  ).length;

  const attacks = data.length - benign;

  const critical = data.filter(
    p => p.severity === "CRITICAL"
  ).length;


  

  setLiveStats({
    totalPackets: data.length,
    benign,
    attacks,
    critical
  });

};

const fetchLiveAlerts = async () => {
  try {
    const response = await API.get("/alerts/");

    setLiveAlerts(response.data);

  } catch (error) {
    console.log(error);
  }
};
const checkForNewAlerts = async () => {
  try {
    const response = await API.get("/alerts/");

    if (response.data.length === 0) return;

    const latestAlert = response.data[0];

    if (lastAlertId.current !== latestAlert.id) {

      lastAlertId.current = latestAlert.id;

      toast.error(
        `🚨 ${latestAlert.attack_type}\nSeverity: ${latestAlert.severity}`,
        {
          autoClose: 6000,
        }
      );
    }

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

        {/* Charts */}

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
        <div className="alerts" style={{ marginTop: "30px" }}>

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

                livePredictions.map((packet, index) => (

                  <tr key={index}>

                    <td>{index + 1}</td>

                    <td>{packet.source_ip}</td>

                    <td>{packet.destination_ip}</td>

                    <td>{packet.protocol}</td>

                    <td>{packet.prediction}</td>

                    <td>{packet.severity}</td>

                    <td>{packet.status}</td>

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
        <div className="alerts" style={{ marginTop: "30px" }}>

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

        liveAlerts.map((alert, index) => (

          <tr key={alert.id}>

            <td>{index + 1}</td>

            <td>{alert.attack_type}</td>

            <td>{alert.severity}</td>

            <td>{alert.status}</td>

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
