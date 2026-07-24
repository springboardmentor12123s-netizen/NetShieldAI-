import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "./Card";
import { PieChart as PieIcon } from "lucide-react";

import type { Packet } from "@/lib/api";

const COLORS = [
  "#3b82f6", // TCP
  "#22c55e", // UDP
  "#f59e0b", // OTHER
];

export function TrafficOverview({
  packets,
}: {
  packets: Packet[];
}) {
  if (!packets.length) {
    return (
      <Card
        title="Traffic Overview"
        icon={<PieIcon size={14} />}
      >
        <div
          style={{
            height: 330,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Waiting for packets...
        </div>
      </Card>
    );
  }

  const tcp = packets.filter(
    (p) => p.protocol?.toUpperCase() === "TCP"
  ).length;

  const udp = packets.filter(
    (p) => p.protocol?.toUpperCase() === "UDP"
  ).length;

  const other = packets.length - tcp - udp;

  const data = [
    {
      name: "TCP",
      value: tcp,
      color: COLORS[0],
    },
    {
      name: "UDP",
      value: udp,
      color: COLORS[1],
    },
    {
      name: "OTHER",
      value: other,
      color: COLORS[2],
    },
  ].filter((d) => d.value > 0);

  const total = packets.length;

  return (
    <Card
      title="Traffic Overview"
      icon={<PieIcon size={14} />}
      hint="Live Protocol Distribution"
    >
      <div className="donut-wrap">
        <div className="donut-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />

              <Pie
                data={data}
                dataKey="value"
                innerRadius={60}
                outerRadius={92}
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color}
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
                Packets
              </div>
            </div>
          </div>
        </div>

        <div className="legend">
          {data.map((d) => (
            <div
              key={d.name}
              className="legend__row"
            >
              <div className="legend__left">
                <span
                  className="legend__dot"
                  style={{
                    background: d.color,
                  }}
                />

                <span>{d.name}</span>
              </div>

              <span className="legend__value">
                {d.value}

                <span className="muted">
                  {" "}
                  ({Math.round((d.value / total) * 100)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}