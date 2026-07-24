import { Card } from "./Card";
import { Database } from "lucide-react";
import type { Packet } from "@/lib/api";

export function NetworkOverview({
  packets,
  lastUpdated,
}: {
  packets: Packet[];
  lastUpdated: Date | null;
}) {
  if (!packets.length) {
    return (
      <Card title="Live Monitoring" icon={<Database size={14} />}>
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

  return (
    <Card
      title="Live Monitoring"
      icon={<Database size={14} />}
      hint={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ""}
    >
      <div className="kpi">
        <span className="kpi__label">Capture Status</span>
        <span className="kpi__value kpi__value--ok">
          ● Running
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">Packets Captured</span>
        <span className="kpi__value">
          {packets.length}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">TCP Packets</span>
        <span className="kpi__value">
          {tcp}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">UDP Packets</span>
        <span className="kpi__value">
          {udp}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">Other Packets</span>
        <span className="kpi__value">
          {other}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">Capture Mode</span>
        <span className="kpi__value">
          Live
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">Monitoring</span>
        <span className="kpi__value kpi__value--ok">
          ● Active
        </span>
      </div>
    </Card>
  );
}