import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4"
];

function Charts({ dashboardData }) {

  const protocolData = Object.entries(dashboardData.protocols).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  const attackData = Object.entries(dashboardData.attacks).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  return (

    <div
      style={{
        display: "flex",
        gap: "30px",
        marginTop: "40px",
        flexWrap: "wrap"
      }}
    >

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "15px",
          flex: 1,
          minWidth: "450px",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)"
        }}
      >

        <h3>Protocol Distribution</h3>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={protocolData}>

            <XAxis dataKey="name"/>

            <YAxis/>

            <Tooltip/>

            <Bar dataKey="value" fill="#4F46E5"/>

          </BarChart>

        </ResponsiveContainer>

      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "15px",
          flex: 1,
          minWidth: "450px",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)"
        }}
      >

        <h3>Attack Distribution</h3>

        <ResponsiveContainer width="100%" height={300}>

          <PieChart>

            <Pie
              data={attackData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >

              {
                attackData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))
              }

            </Pie>

            <Tooltip/>

            <Legend/>

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

export default Charts;