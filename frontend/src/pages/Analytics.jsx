import { useEffect, useState } from "react";
import API from "../services/api";
import AttackTypesChart from "../components/AttackTypesChart";
import ProtocolPieChart from "../components/ProtocolPieChart";
import TopPortsChart from "../components/TopPortsChart";
import TrafficTrendChart from "../components/TrafficTrendChart";
function Analytics() {
  const [attackTypes, setAttackTypes] = useState([]);
  const [protocolData, setProtocolData] = useState([]);
  const [topPorts, setTopPorts] = useState([]);
  const [trafficTrend, setTrafficTrend] = useState([]);
  const [summary,setSummary]=useState({
    total_traffic:0,
    benign_traffic:0,
    attack_traffic:0,
    top_attack:"",
    
  });
  useEffect(() => {
    fetchSummary();
    fetchAttackTypes();
    fetchProtocolDistribution();
    fetchTopPorts();
    fetchTrafficTrend();
  }, []);

  const fetchAttackTypes = async () => {
    try {
      const response = await API.get("/analytics/attack-types");
      setAttackTypes(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const fetchTopPorts = async () => {
  try {
    const response = await API.get("/analytics/top-ports");
    setTopPorts(response.data);
  } catch (error) {
    console.log(error);
  }
};
const fetchSummary = async () => {
  try {
    const response = await API.get("/analytics/summary");
    setSummary(response.data);
  } catch (error) {
    console.log(error);
  }
};
const fetchTrafficTrend = async () => {
  try {
    const response = await API.get("/analytics/traffic-trend");
    setTrafficTrend(response.data);
  } catch (error) {
    console.log(error);
  }
};

  const fetchProtocolDistribution = async () => {
    try {
      const response = await API.get("/analytics/protocol-distribution");
      setProtocolData(response.data);
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#1f2937",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: "30px" }}>
        📊 Network Traffic Analytics
      </h1>
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "30px",
  }}
>
  <div
    style={{
      background: "#263143",
      padding: "20px",
      borderRadius: "12px",
      textAlign: "center",
    }}
  >
    <h3>Total Traffic</h3>
    <h2>{summary.total_traffic.toLocaleString()}</h2>
  </div>

  <div
    style={{
      background: "#263143",
      padding: "20px",
      borderRadius: "12px",
      textAlign: "center",
    }}
  >
    <h3>Benign Traffic</h3>
    <h2>{summary.benign_traffic.toLocaleString()}</h2>
  </div>

  <div
    style={{
      background: "#263143",
      padding: "20px",
      borderRadius: "12px",
      textAlign: "center",
    }}
  >
    <h3>Attack Traffic</h3>
    <h2>{summary.attack_traffic.toLocaleString()}</h2>
  </div>

  <div
    style={{
      background: "#263143",
      padding: "20px",
      borderRadius: "12px",
      textAlign: "center",
    }}
  >
    <h3>Top Attack</h3>
    <h2>{summary.top_attack}</h2>
  </div>
</div>
      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Attack Types */}
        <div
          style={{
            backgroundColor: "#263143",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>
            Attack Type Distribution
          </h2>

          <AttackTypesChart data={attackTypes} />
        </div>

        {/* Protocol Distribution */}
        <div
          style={{
            backgroundColor: "#263143",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>
            Protocol Distribution
          </h2>

          <ProtocolPieChart data={protocolData} />
        </div>
        <div
            style={{
            backgroundColor: "#263143",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px",
      }}
>
    <h2 style={{ marginBottom: "20px" }}>
    Top 10 Destination Ports
    </h2>

    <TopPortsChart data={topPorts} />
    </div>
    <div
      style={{
      backgroundColor: "#263143",
      padding: "20px",
      borderRadius: "12px",
      marginTop: "20px",
      }}
    >
    <h2 style={{ marginBottom: "20px" }}>
    Traffic Trend
    </h2>

    <TrafficTrendChart data={trafficTrend} />
    </div>
      </div>

      {/* Statistics Table */}
      <div
        style={{
          backgroundColor: "#263143",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          Attack Statistics
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#374151",
              }}
            >
              <th style={{ padding: "12px" }}>Attack Type</th>
              <th style={{ padding: "12px" }}>Total Records</th>
            </tr>
          </thead>

          <tbody>
            {attackTypes.map((item, index) => (
              <tr key={index}>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #4b5563",
                  }}
                >
                  {item.label}
                </td>

                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #4b5563",
                  }}
                >
                  {item.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Analytics;