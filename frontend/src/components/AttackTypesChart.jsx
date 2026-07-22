import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AttackTypesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={450}>
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
          dataKey="total"
          fill="#3b82f6"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default AttackTypesChart;