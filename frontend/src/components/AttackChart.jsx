import { useEffect, useState } from "react";
import API from "../services/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function AttackChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchChart();
  }, []);

  const fetchChart = async () => {
    try {
      const response = await API.get("/dataset/attack-distribution");
      setData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="chart-card">
      <h2>Attack Distribution</h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="label"
            angle={-25}
            textAnchor="end"
            interval={0}
            height={100}
          />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="count"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AttackChart;