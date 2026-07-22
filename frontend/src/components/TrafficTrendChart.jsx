import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function TrafficTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="name" />

        <YAxis />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="traffic"
          stroke="#3b82f6"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default TrafficTrendChart;