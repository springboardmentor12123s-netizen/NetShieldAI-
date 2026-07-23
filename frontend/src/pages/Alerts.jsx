import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

export default function Alerts() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/alerts")
      .then(({ data }) =>
        setRows(
          data.map((row) => ({
            ...row,
            timestamp: new Date(row.timestamp).toLocaleString(),
          }))
        )
      )
      .catch((err) => setError(err.message));
  }, []);

  if (!rows && !error) return <Loading label="Loading alerts..." />;

  return (
    <>
      <PageHeader
        eyebrow="THREAT MONITOR"
        title="Anomaly alerts"
        description="Only anomalous prediction rows appear here. Severity is assigned per prediction run: 1 low, 2–5 medium, and more than 5 high."
      />

      {error ? (
        <div className="panel p-6 text-red-300">{error}</div>
      ) : (
        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Detected threats</h2>
              <p className="text-xs text-slate-500">{rows.length} anomaly records</p>
            </div>
          </div>
          <DataTable empty="No anomalies detected yet." rows={rows} />
        </section>
      )}
    </>
  );
}
