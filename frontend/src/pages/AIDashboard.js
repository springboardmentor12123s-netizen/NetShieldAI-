import React, { useEffect, useState } from "react";
import { getIntrusionReport } from "../services/ai";
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

  const [report, setReport] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {

    const fetchReport = () => {
    getIntrusionReport()
        .then((res) => {
            setReport(res.data);
            setLastUpdated(new Date().toLocaleTimeString());
        })
        .catch((err) => console.log(err));
};

    // Load data immediately
    fetchReport();

    // Refresh every 5 seconds
    const interval = setInterval(fetchReport, 5000);

    // Cleanup
    return () => clearInterval(interval);

}, []);

  if (!report) return <h2>Loading...</h2>;

  const riskData = [
    { name: "Low", value: report.risk_summary.Low },
    { name: "Medium", value: report.risk_summary.Medium },
    { name: "High", value: report.risk_summary.High },
    { name: "Critical", value: report.risk_summary.Critical }
  ];

  const threatData = Object.entries(report.threat_summary).map(
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
          <h2>{report.records_analyzed}</h2>
        </div>

        <div className="card">
          <h3>Normal Traffic</h3>
          <h2>{report.normal_traffic}</h2>
        </div>

        <div className="card">
          <h3>Attacks Detected</h3>
          <h2>{report.attacks_detected}</h2>
        </div>

        <div className="card">
          <h3>Detection Rate</h3>
          <h2>{report.detection_rate}%</h2>
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

      <div className="table-card">

        <h2>Threat Details</h2>

        <table>

          <thead>

            <tr>
              <th>Threat Type</th>
              <th>Count</th>
            </tr>

          </thead>

          <tbody>

            {threatData.map((item, index) => (

              <tr key={index}>

                <td>{item.name}</td>

                <td>{item.value}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default AIDashboard;