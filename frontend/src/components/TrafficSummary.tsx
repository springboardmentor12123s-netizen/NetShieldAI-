import { Card } from "./Card";
import { Gauge } from "lucide-react";
import type { Packet } from "@/lib/api";

export function TrafficSummary({
  packets,
}: {
  packets: Packet[];
}) {
  if (!packets.length) {
    return (
      <Card title="Traffic Summary" icon={<Gauge size={14} />}>
        <div style={{ padding: 20 }}>Waiting for packets...</div>
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

  const averageSize = Math.round(
    packets.reduce(
      (sum, p) => sum + (p.packet_size ?? 0),
      0
    ) / packets.length
  );

  return (
    <Card title="Traffic Summary" icon={<Gauge size={14} />}>
      <div className="kpi">
        <span className="kpi__label">
          Packets Captured
        </span>

        <span className="kpi__value">
          {packets.length}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          TCP Packets
        </span>

        <span className="kpi__value">
          {tcp}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          UDP Packets
        </span>

        <span className="kpi__value">
          {udp}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          Other Packets
        </span>

        <span className="kpi__value">
          {other}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          Average Packet Size
        </span>

        <span className="kpi__value">
          {averageSize} B
        </span>
      </div>
    </Card>
  );
}