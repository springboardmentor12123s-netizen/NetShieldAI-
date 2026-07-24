import { Card } from "./Card";
import { List } from "lucide-react";

import type { Packet } from "@/lib/api";

export function RecentPacketsTable({
  packets,
  limit = 12,
}: {
  packets: Packet[];
  limit?: number;
}) {
  const rows = packets.slice(0, limit);

  return (
    <Card
      title="Recent Live Packets"
      icon={<List size={14} />}
      hint={`${packets.length.toLocaleString()} captured`}
      padded={false}
    >
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th style={{ textAlign: "right" }}>Size</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="table__empty" colSpan={5}>
                  No packets captured.
                </td>
              </tr>
            )}

            {rows.map((packet, index) => (
              <tr key={index}>
                <td className="mono">
                  {packet.timestamp ?? "-"}
                </td>

                <td className="mono">
                  {packet.source_ip ?? "-"}
                </td>

                <td className="mono">
                  {packet.destination_ip ?? "-"}
                </td>

                <td>
                  {packet.protocol ?? "-"}
                </td>

                <td
                  className="mono"
                  style={{ textAlign: "right" }}
                >
                  {packet.packet_size ?? 0} B
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}