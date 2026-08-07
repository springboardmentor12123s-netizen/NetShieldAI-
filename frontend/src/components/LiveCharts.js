import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function LiveCharts({ liveDashboard }) {
  if (!liveDashboard) return null;

  const protocolData = Object.entries(liveDashboard.protocols).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const predictionData = [
    {
      name: "Benign",
      value: liveDashboard.predictions.Benign || 0,
    },
    {
      name: "Attack",
      value:
        liveDashboard.total_packets -
        (liveDashboard.predictions.Benign || 0),
    },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div
  style={{
    display: "flex",
    gap: "30px",
    flexWrap: "wrap",
    marginTop: "30px",
    marginBottom: "50px",
  }}
>
      <div
        style={{
          flex: 1,
          minWidth: "450px",
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        }}
      >
        <h3>Protocol Distribution</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={protocolData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: "450px",
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        }}
      >
        <h3>Prediction Distribution</h3>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={predictionData}
              dataKey="value"
              outerRadius={100}
              label
            >
              {predictionData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LiveCharts;