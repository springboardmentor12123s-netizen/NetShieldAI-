import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { PieChart as PieIcon } from "lucide-react";

import { Card } from "./Card";

import type { AnalyticsData } from "@/lib/api";

const COLORS = [
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#a855f7",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
];

export function AIOverview({
  analytics,
}: {
  analytics: AnalyticsData | null;
}) {
  if (!analytics) {
    return (
      <Card title="Threat Overview" icon={<PieIcon size={14} />}>
        <div
          style={{
            height: 320,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#94a3b8",
          }}
        >
          Loading...
        </div>
      </Card>
    );
  }

  const chart = analytics.attack_distribution.map((a, i) => ({
    name: a.attack,
    value: a.count,
    color: COLORS[i % COLORS.length],
  }));

  const total = analytics.total_predictions;

  return (
    <Card
      title="Threat Overview"
      icon={<PieIcon size={14} />}
      hint="AI Attack Distribution"
    >
      <div className="donut-wrap">
        <div className="donut-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #26334f",
                  borderRadius: 6,
                  color: "#fff",
                }}
              />

              <Pie
                data={chart}
                dataKey="value"
                innerRadius={60}
                outerRadius={92}
                paddingAngle={2}
                stroke="#0f172a"
                strokeWidth={2}
              >
                {chart.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="donut-center__text">
            <div>
              <div className="donut-center__value">
                {total}
              </div>

              <div className="donut-center__label">
                Predictions
              </div>
            </div>
          </div>
        </div>

        <div className="legend">
          {chart.map((a) => (
            <div
              key={a.name}
              className="legend__row"
            >
              <div className="legend__left">
                <span
                  className="legend__dot"
                  style={{
                    background: a.color,
                  }}
                />

                <span>{a.name}</span>
              </div>

              <span className="legend__value">
                {a.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}