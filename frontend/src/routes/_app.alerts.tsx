import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AnomaliesAPI, type Anomaly, getTime } from "@/lib/api";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — SentinelOps" },
      { name: "description", content: "Security alerts and incident triage feed." },
    ],
  }),
  component: AlertsPage,
});

function severityOf(a: Anomaly): "critical" | "high" | "medium" | "low" {
  const s = (a.severity ?? "").toLowerCase();
  if (s === "critical" || s === "high" || s === "medium" || s === "low") return s;
  const c = a.confidence ?? 0;
  if (c >= 0.9) return "critical";
  if (c >= 0.75) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

function AlertsPage() {
  const [items, setItems] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AnomaliesAPI.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((a) => severityOf(a) === filter)),
    [items, filter],
  );

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of items) c[severityOf(a)]++;
    return c;
  }, [items]);

  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Alerts</h1>
          <div className="page__subtitle">
            {items.length} incident{items.length === 1 ? "" : "s"} in queue
          </div>
        </div>
        <button className="btn" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="filterbar">
        {(["all", "critical", "high", "medium", "low"] as const).map((k) => (
          <button
            key={k}
            className={`btn ${filter === k ? "btn--primary" : ""}`}
            onClick={() => setFilter(k)}
          >
            {k[0].toUpperCase() + k.slice(1)}
            {k !== "all" && (
              <span className="muted" style={{ marginLeft: 4 }}>{counts[k]}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert--high" style={{ marginBottom: 12 }}>
          <div className="alert__type">Request failed</div>
          <div className="muted" style={{ fontSize: 12 }}>{error}</div>
        </div>
      )}

      <div className="alert-grid">
        {filtered.length === 0 && (
          <div className="card">
            <div className="card__body" style={{ color: "var(--text-mute)", textAlign: "center" }}>
              <AlertTriangle size={18} style={{ marginBottom: 6 }} />
              <div>No alerts to display.</div>
            </div>
          </div>
        )}
        {filtered.map((a) => {
          const sev = severityOf(a);
          return (
            <article key={String(a.id)} className={`alert alert--${sev}`}>
              <div className="alert__head">
                <div className="alert__type">
                  {a.type ?? a.detection_type ?? "Anomaly Detected"}
                </div>
                <SeverityBadge severity={sev} />
              </div>
              <div className="alert__meta">
                <div>Source IP</div>
                <div>Destination IP</div>
                <span className="mono">{a.source_ip ?? "—"}</span>
                <span className="mono">{a.destination_ip ?? "—"}</span>
                <div>Protocol</div>
                <div>Confidence</div>
                <span>{(a.protocol ?? "—").toString().toUpperCase()}</span>
                <span>
                  {a.confidence != null
                    ? `${Math.round(Number(a.confidence) * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="alert__foot">
                <span>{getTime(a) ? new Date(getTime(a)).toLocaleString() : "just now"}</span>
                <StatusBadge status={a.status ?? "monitoring"} />
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}