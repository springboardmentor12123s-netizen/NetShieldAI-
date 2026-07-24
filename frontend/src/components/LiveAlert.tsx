import type { Anomaly } from "@/lib/api";

export function LiveAlert({
  anomalies,
}: {
  anomalies: Anomaly[];
}) {
  if (!anomalies.length) return null;

  const latest = anomalies[0];

  const attack = latest.anomaly_type ?? "Unknown";

  const confidence = latest.confidence_score ?? 0;

  const color =
    attack === "BENIGN"
      ? "#16a34a"
      : confidence > 0.9
      ? "#dc2626"
      : "#f59e0b";

  return (
    <div
      style={{
        background: color,
        color: "white",
        padding: "16px",
        borderRadius: "10px",
        marginBottom: "15px",
        fontWeight: 600,
        animation: "pulse 1.5s infinite",
      }}
    >
      🚨 Latest Detection

      <div style={{ marginTop: 8 }}>
        Attack : {attack}
      </div>

      <div>
        Confidence : {(confidence * 100).toFixed(1)}%
      </div>

      <div>
        Source : {latest.source_ip}
      </div>

      <div>
        Destination : {latest.destination_ip}
      </div>
    </div>
  );
}