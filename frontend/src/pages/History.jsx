import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

export default function History() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/history")
      .then(({ data }) =>
        setRows(
          data.map((row) => ({
            id: row.id,
            dataset_name: row.dataset_name,
            purpose: row.purpose,
            upload_time: new Date(row.upload_time).toLocaleString(),
            records: row.record_count,
            accuracy: row.accuracy === null ? "—" : `${row.accuracy}%`,
            predictions: row.prediction_count,
          }))
        )
      )
      .catch((err) => setError(err.message));
  }, []);

  if (!rows && !error) return <Loading label="Loading dataset history..." />;

  return (
    <>
      <PageHeader
        title="Activity history"
        description="An audit-friendly record of uploaded datasets, training accuracy, and anomaly counts."
      />

      {error ? (
        <div className="panel p-6 text-red-300">{error}</div>
      ) : (
        <section className="panel p-6">
          <DataTable empty="Upload your first dataset to begin." rows={rows} />
        </section>
      )}
    </>
  );
}
