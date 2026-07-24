import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";

import { Activity } from "lucide-react";
import { Card } from "./Card";

import type { Anomaly } from "@/lib/api";

function getColor(attack: string) {
  switch (attack.toUpperCase()) {
    case "BENIGN":
      return "#3b82f6";

    case "PORTSCAN":
      return "#facc15";

    case "DDOS":
    case "DOS HULK":
    case "DOS GOLDENEYE":
    case "DOS SLOWHTTPTEST":
    case "DOS SLOWLORIS":
      return "#ef4444";

    case "BOT":
      return "#8b5cf6";

    case "WEB ATTACK – BRUTE FORCE":
    case "WEB ATTACK - BRUTE FORCE":
    case "WEB ATTACK – XSS":
    case "WEB ATTACK - XSS":
    case "WEB ATTACK – SQL INJECTION":
    case "WEB ATTACK - SQL INJECTION":
      return "#f97316";

    case "FTP-PATATOR":
    case "SSH-PATATOR":
      return "#8b5a2b";

    default:
      return "#9ca3af";
  }
}

export function TrafficChart({
  anomalies,
}: {
  anomalies: Anomaly[];
}) {
  if (!anomalies.length) {
    return (
      <Card
        title="Attack Distribution"
        icon={<Activity size={14} />}
      >
        <div
          style={{
            height: 320,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Waiting for AI predictions...
        </div>
      </Card>
    );
  }

  const counts: Record<string, number> = {};

  anomalies.forEach((a) => {
    const attack = a.anomaly_type ?? "Unknown";
    counts[attack] = (counts[attack] || 0) + 1;
  });

  const data = Object.entries(counts).map(([attack, count]) => ({
    attack,
    count,
    color: getColor(attack),
  }));

  return (
    <Card
      title="Attack Distribution"
      icon={<Activity size={14} />}
      hint="Live AI Predictions"
    >
      <div
        style={{
          width: "100%",
          height: 330,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 20,
              left: 10,
              bottom: 60,
            }}
            barCategoryGap="60%"
            barGap={8}
          >
            <CartesianGrid
              stroke="#1f2b45"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="attack"
              angle={-20}
              textAnchor="end"
              interval={0}
              height={70}
              fontSize={11}
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            >
              <LabelList
                dataKey="count"
                position="top"
                fontSize={11}
              />

              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 16,
          fontSize: 12,
        }}
      >
        <span>🟦 BENIGN</span>
        <span>🟥 DoS / DDoS</span>
        <span>🟨 PortScan</span>
        <span>🟪 Bot</span>
        <span>🟧 Web Attack</span>
        <span>🟫 FTP / SSH</span>
        <span>⬜ Other</span>
      </div>
    </Card>
  );
}