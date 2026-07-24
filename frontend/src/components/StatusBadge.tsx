type Kind = "ok" | "crit" | "info" | "warn" | "gray";

export function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "unknown").toString().toLowerCase();
  let kind: Kind = "gray";
  let label = s.charAt(0).toUpperCase() + s.slice(1);
  if (["normal", "safe", "ok", "clean"].includes(s)) {
    kind = "ok";
    label = "Normal";
  } else if (["suspicious", "malicious", "attack", "critical", "threat"].includes(s)) {
    kind = "crit";
    label = "Suspicious";
  } else if (["monitoring", "scanning", "info", "pending"].includes(s)) {
    kind = "info";
    label = "Monitoring";
  } else if (["warning", "medium", "warn", "high"].includes(s)) {
    kind = "warn";
  } else if (["unknown", "idle", ""].includes(s)) {
    kind = "gray";
    label = s === "idle" ? "Idle" : "Unknown";
  }
  return (
    <span className={`badge badge--${kind}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity?: string }) {
  const s = (severity ?? "low").toString().toLowerCase();
  let kind: Kind = "info";
  if (s === "critical") kind = "crit";
  else if (s === "high") kind = "warn";
  else if (s === "medium") kind = "warn";
  else if (s === "low") kind = "info";
  return (
    <span className={`badge badge--${kind}`}>
      <span className="dot" />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}