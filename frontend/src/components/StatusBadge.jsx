import React from "react";

const NORMALIZE = {
  healthy: "healthy", active: "healthy", low: "healthy", normal: "normal",
  warning: "warning", medium: "warning", suspicious: "suspicious",
  critical: "critical", high: "critical", blocked: "blocked",
  waiting_for_dataset: "waiting", not_trained: "not_trained",
  ready_for_training: "warning", training_completed: "healthy",
  dataset_not_found: "critical",
};

export default function StatusBadge({ status, label }) {
  const key = NORMALIZE[status] || "waiting";
  return <span className={`badge badge-${key}`}>{label || status}</span>;
}
