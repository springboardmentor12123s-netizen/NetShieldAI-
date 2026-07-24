import { Card } from "./Card";
import { Gauge } from "lucide-react";
import type { AnalyticsData } from "@/lib/api";

export function AISummary({
  analytics,
}: {
  analytics: AnalyticsData | null;
}) {
  if (!analytics) {
    return (
      <Card title="Threat Summary" icon={<Gauge size={14} />}>
        <div style={{ padding: 20 }}>Loading...</div>
      </Card>
    );
  }

  const attacks = analytics.attack_distribution;

  const top =
    attacks.length > 0
      ? [...attacks].sort((a, b) => b.count - a.count)[0]
      : null;

  return (
    <Card title="Threat Summary" icon={<Gauge size={14} />}>
      <div className="kpi">
        <span className="kpi__label">
          Total Predictions
        </span>

        <span className="kpi__value">
          {analytics.total_predictions}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          High Confidence
        </span>

        <span className="kpi__value kpi__value--crit">
          {analytics.high_confidence}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          Average Confidence
        </span>

        <span className="kpi__value kpi__value--ok">
          {(analytics.average_confidence * 100).toFixed(2)}%
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          Attack Categories
        </span>

        <span className="kpi__value">
          {attacks.length}
        </span>
      </div>

      <div className="kpi">
        <span className="kpi__label">
          Top Attack
        </span>

        <span className="kpi__value">
          {top?.attack ?? "-"}
        </span>
      </div>
    </Card>
  );
}