import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  HeartPulse,
  PieChart as PieIcon,
  Radar,
  Download,
} from "lucide-react";
import { AnalyticsAPI, type AnalyticsData } from "@/lib/api";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics-AI — SentinelOps" },
      {
        name: "description",
        content: "Historical trends and Attack Categories analytics.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#a855f7",
  "#38bdf8",
];

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await AnalyticsAPI.get();
        setAnalytics(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
  }, []);

  const attackData = analytics?.attack_distribution ?? [];

  const total = analytics?.total_predictions ?? 0;

  const highConfidence = analytics?.high_confidence ?? 0;

  const averageConfidence = analytics
    ? (analytics.average_confidence * 100).toFixed(2)
    : "0.00";

  const attackCategories = attackData.length;

  const health =
    total > 0
      ? Math.round((highConfidence / total) * 100)
      : 0;

  const topAttack =
    attackData.length > 0
      ? attackData.reduce((a, b) =>
          a.count > b.count ? a : b
        )
      : null;

  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">
            Analytics
          </h1>

          <div className="page__subtitle">
            AI-powered network threat analytics
          </div>
        </div>

        <button
          className="btn"
          onClick={() => AnalyticsAPI.downloadReport()}
        >
          <Download size={15} />
          {" "}
          Download Report
        </button>
      </div>

      {error && (
        <div
          className="alert alert--high"
          style={{ marginBottom: 12 }}
        >
          <div className="alert__type">
            Request failed
          </div>

          <div
            className="muted"
            style={{ fontSize: 12 }}
          >
            {error}
          </div>
        </div>
      )}

      <div className="grid grid--analytics">
        <div className="stat">
          <span className="stat__label">
            Total Predictions
          </span>

          <div className="stat__value">
            {total}
          </div>

          <div className="stat__delta">
            Records Analyzed
          </div>
        </div>

        <div className="stat">
          <span className="stat__label">
            High Confidence
          </span>

          <div className="stat__value">
            {highConfidence.toLocaleString()}
          </div>

          <div className="stat__delta">
            Predictions
          </div>
        </div>

        <div className="stat">
          <span className="stat__label">
            Average Confidence
          </span>

          <div className="stat__value">
            {averageConfidence}%
          </div>
        </div>

        <div className="stat">
          <span className="stat__label">
            Model Summary
          </span>

          <div className="stat__value">
            {attackCategories}
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="grid">
        <Card
          title="Attack Distribution"
          icon={<PieIcon size={14} />}
        >
          <div
            style={{
              width: "100%",
              height: 360,
            }}
          >
            <ResponsiveContainer>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #26334f",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#e6edf7",
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  height={30}
                  wrapperStyle={{
                    fontSize: 12,
                    color: "#8a97b1",
                  }}
                />

                <Pie
                  data={
                    attackData.length
                      ? attackData
                      : [
                          {
                            attack: "No data",
                            count: 1,
                          },
                        ]
                  }
                  dataKey="count"
                  nameKey="attack"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                >
                  {(
                    attackData.length
                      ? attackData
                      : [
                          {
                            attack: "No data",
                            count: 1,
                          },
                        ]
                  ).map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        attackData.length
                          ? PIE_COLORS[
                              i % PIE_COLORS.length
                            ]
                          : "#1f2b45"
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ height: 12 }} />

      <div className="grid grid--row">
        <Card
          title="Attack Categories"
          icon={<HeartPulse size={14} />}
        >
          <div className="kpi">
            <span className="kpi__label">
              High Confidence Rate
            </span>

            <span className="kpi__value">
              {health}%
            </span>
          </div>

          <div
            className="progress"
            style={{ marginTop: 4 }}
          >
            <div
              className="progress__fill"
              style={{
                width: `${health}%`,
              }}
            />
          </div>

          <div
            className="kpi"
            style={{ marginTop: 8 }}
          >
            <span className="kpi__label">
              Average Confidence
            </span>

            <span className="kpi__value kpi__value--crit">
              {averageConfidence}%
            </span>
          </div>

          <div className="kpi">
            <span className="kpi__label">
              Attack Categories
            </span>

            <span className="kpi__value">
              {attackData.length}
            </span>
          </div>

          <div className="kpi">
            <span className="kpi__label">
              Top Attack
            </span>

            <span className="kpi__value">
              {topAttack?.attack ?? "-"}
            </span>
          </div>
        </Card>

        <Card
          title="Top Attack Types"
          icon={<Radar size={14} />}
          padded={false}
        >
          <div
            className="table-wrap"
            style={{ maxHeight: 260 }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Attack Type</th>
                  <th style={{ textAlign: "right" }}>
                    Count
                  </th>
                  <th style={{ textAlign: "right" }}>
                    Share
                  </th>
                </tr>
              </thead>

              <tbody>
                {attackData.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="table__empty"
                    >
                      No data.
                    </td>
                  </tr>
                )}

                {attackData.map((p, i) => (
                  <tr key={p.attack}>
                    <td>
                      <span
                        className="legend__dot"
                        style={{
                          background:
                            PIE_COLORS[
                              i % PIE_COLORS.length
                            ],
                          display: "inline-block",
                          marginRight: 8,
                        }}
                      />

                      {p.attack}
                    </td>

                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      {p.count.toLocaleString()}
                    </td>

                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      {total > 0
                        ? (
                            (p.count / total) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}