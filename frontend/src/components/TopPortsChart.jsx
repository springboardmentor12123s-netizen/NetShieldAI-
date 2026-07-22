import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function TopPortsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="destination_port" />

        <YAxis />

        <Tooltip />

        <Bar
          dataKey="total"
          fill="#10b981"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default TopPortsChart;