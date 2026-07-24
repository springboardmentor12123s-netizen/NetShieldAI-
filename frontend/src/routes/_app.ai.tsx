import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Brain, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { AnomaliesAPI, type Anomaly } from "@/lib/api";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_app/ai")({
  head: () => ({
    meta: [
      { title: "AI Detection — SentinelOps" },
      { name: "description", content: "ML-driven anomaly and threat detection." },
    ],
  }),
  component: AIPage,
});

function AIPage() {
  const [items, setItems] = useState<Anomaly[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await AnomaliesAPI.list();
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const avgConf =
      total > 0 ? items.reduce((s, a) => s + (Number(a.confidence) || 0), 0) / total : 0;
    const types = new Map<string, number>();
    for (const a of items) {
      const t = a.type ?? a.detection_type ?? "Unknown";
      types.set(t, (types.get(t) ?? 0) + 1);
    }
    const topType = Array.from(types.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const critical = items.filter((a) => (Number(a.confidence) || 0) >= 0.9).length;
    return { total, avgConf, topType, critical };
  }, [items]);

  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">AI Detection</h1>
          <div className="page__subtitle">
            Machine-learning classifiers monitoring inbound traffic
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert--high" style={{ marginBottom: 12 }}>
          <div className="alert__type">Request failed</div>
          <div className="muted" style={{ fontSize: 12 }}>{error}</div>
        </div>
      )}

      <div className="grid grid--analytics">
        <div className="stat">
          <div className="row-flex">
            <ShieldAlert size={14} color="#93c5fd" />
            <span className="stat__label">Detected Threats</span>
          </div>
          <div className="stat__value">{stats.total}</div>
          <div className="stat__delta">Across all sensors</div>
        </div>
        <div className="stat">
          <div className="row-flex">
            <Target size={14} color="#93c5fd" />
            <span className="stat__label">Avg. Confidence</span>
          </div>
          <div className="stat__value">
            {stats.total > 0 ? `${Math.round(stats.avgConf * 100)}%` : "—"}
          </div>
          <div className="progress" style={{ marginTop: 6 }}>
            <div
              className="progress__fill"
              style={{ width: `${Math.min(100, Math.round(stats.avgConf * 100))}%` }}
            />
          </div>
        </div>
        <div className="stat">
          <div className="row-flex">
            <Brain size={14} color="#93c5fd" />
            <span className="stat__label">Top Detection</span>
          </div>
          <div className="stat__value" style={{ fontSize: 15 }}>
            {stats.topType ?? "—"}
          </div>
          <div className="stat__delta">Most frequent classifier</div>
        </div>
        <div className="stat">
          <div className="row-flex">
            <TrendingUp size={14} color="#93c5fd" />
            <span className="stat__label">High-confidence</span>
          </div>
          <div className="stat__value">{stats.critical}</div>
          <div className="stat__delta">≥ 90% confidence</div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="grid grid--row">
        <Card title="Detection Confidence" icon={<Target size={14} />}>
          {items.length === 0 && (
            <div className="muted" style={{ padding: "12px 0" }}>No detections yet.</div>
          )}
          {items.slice(0, 8).map((a) => {
            const c = Math.max(0, Math.min(1, Number(a.confidence) || 0));
            const cls =
              c >= 0.9 ? "progress__fill--crit" : c >= 0.7 ? "progress__fill--warn" : "";
            return (
              <div key={String(a.id)} style={{ padding: "6px 0" }}>
                <div
                  className="row-flex"
                  style={{ justifyContent: "space-between", marginBottom: 4 }}
                >
                  <span style={{ fontSize: 12.5 }}>
                    {a.type ?? a.detection_type ?? "Anomaly"}
                    <span className="muted mono" style={{ marginLeft: 8 }}>
                      {a.source_ip ?? ""}
                    </span>
                  </span>
                  <span className="mono" style={{ fontSize: 12 }}>{Math.round(c * 100)}%</span>
                </div>
                <div className="progress">
                  <div className={`progress__fill ${cls}`} style={{ width: `${c * 100}%` }} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card title="Anomalies" icon={<ShieldAlert size={14} />} padded={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Detection</th>
                  <th>Source</th>
                  <th>Prediction</th>
                  <th style={{ textAlign: "right" }}>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table__empty">Nothing flagged.</td>
                  </tr>
                )}
                {items.map((a) => (
                  <tr key={String(a.id)}>
                    <td className="mono">#{a.id}</td>
                    <td>{a.type ?? a.detection_type ?? "Unknown"}</td>
                    <td className="mono">{a.source_ip ?? "—"}</td>
                    <td>{a.prediction ?? "—"}</td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {a.confidence != null
                        ? `${Math.round(Number(a.confidence) * 100)}%`
                        : "—"}
                    </td>
                    <td><StatusBadge status={a.status ?? "monitoring"} /></td>
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