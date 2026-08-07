import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

import "./AIDashboard.css";

function AIDashboard() {

  const [liveDashboard, setLiveDashboard] = useState(null);
  const [liveHistory, setLiveHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {

    const fetchReport = async () => {
  try {
    const dashboard = await axios.get(
      "http://127.0.0.1:8000/traffic/live/dashboard"
    );

    const history = await axios.get(
      "http://127.0.0.1:8000/traffic/live/history"
    );

    setLiveDashboard(dashboard.data);
    setLiveHistory(history.data);

    setLastUpdated(new Date().toLocaleTimeString());
  } catch (err) {
    console.log(err);
  }
};
    // Load data immediately
    fetchReport();

    // Refresh every 5 seconds
    const interval = setInterval(fetchReport, 5000);

    // Cleanup
    return () => clearInterval(interval);

}, []);

  if (!liveDashboard) return <h2>Loading...</h2>;

  const riskData = Object.entries(liveDashboard.risks).map(
  ([name, value]) => ({
    name,
    value,
  })
);

  const threatData = Object.entries(liveDashboard.predictions).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  const COLORS = [
    "#28a745",
    "#ffc107",
    "#fd7e14",
    "#dc3545"
  ];

  return (

    <div className="ai-container">

      <h1>AI Intrusion Dashboard</h1>
      <p className="update-time">
    Last Updated: {lastUpdated}
      </p>

      <div className="card-container">

        <div className="card">
          <h3>Records Analyzed</h3>
          <h2>{liveDashboard.total_packets}</h2>
        </div>

        <div className="card">
          <h3>Normal Traffic</h3>
          <h2>{liveDashboard.predictions.Benign || 0}</h2>
        </div>

        <div className="card">
          <h3>Attacks Detected</h3>
          <h2>
  {liveDashboard.total_packets -
    (liveDashboard.predictions.Benign || 0)}
</h2>
        </div>

        <div className="card">
          <h3>Detection Rate</h3>
          <h2>
  {liveDashboard.total_packets > 0
    ? (
        ((liveDashboard.total_packets -
          (liveDashboard.predictions.Benign || 0)) /
          liveDashboard.total_packets) *
        100
      ).toFixed(1)
    : 0}
  %
</h2>
        </div>

      </div>

      <div className="charts">

        <div className="chart-card">

          <h2>Risk Summary</h2>

          <ResponsiveContainer width="100%" height={350}>

            <PieChart>

              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label
              >

                {riskData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}

              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

        <div className="chart-card">

          <h2>Threat Summary</h2>

          <ResponsiveContainer width="100%" height={350}>

            <BarChart data={threatData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="value"
                fill="#007bff"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

      <div
  style={{
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    overflowX: "auto",
    marginTop: "30px"
  }}
>

  <h2>Threat Details</h2>

  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "center"
    }}
  >

    <thead>
      <tr
        style={{
          background: "#2962FF",
          color: "white"
        }}
      >
        <th style={{ padding: "12px" }}>Time</th>
        <th style={{ padding: "12px" }}>Source IP</th>
        <th style={{ padding: "12px" }}>Destination IP</th>
        <th style={{ padding: "12px" }}>Protocol</th>
        <th style={{ padding: "12px" }}>Prediction</th>
        <th style={{ padding: "12px" }}>Confidence</th>
        <th style={{ padding: "12px" }}>Risk</th>
      </tr>
    </thead>

    <tbody>

      {liveHistory.slice(0, 10).map((packet, index) => (

        <tr key={index}>

          <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
            {packet.timestamp}
          </td>

          <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
            {packet.source}
          </td>

          <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
            {packet.destination}
          </td>

          <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
            {packet.protocol}
          </td>

          <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
            {packet.prediction}
          </td>

          <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
            {packet.confidence}%
          </td>

          <td
            style={{
              padding: "10px",
              borderBottom: "1px solid #eee",
              fontWeight: "bold",
              color:
                packet.risk === "Critical"
                  ? "#dc3545"
                  : packet.risk === "High"
                  ? "#fd7e14"
                  : "#28a745"
            }}
          >
            {packet.risk}
          </td>

        </tr>

      ))}

    </tbody>

  </table>

</div>
    </div>

  );

}

export default AIDashboard;