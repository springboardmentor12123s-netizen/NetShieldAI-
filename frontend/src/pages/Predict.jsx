import { Download, ScanSearch } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import FileDrop from "../components/FileDrop";
import PageHeader from "../components/PageHeader";
import api, { API_URL } from "../services/api";

export default function Predict() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!file) return toast.error("Select a CSV file first.");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/predict", form);
      setResult(data);
      toast.success(`Analysis complete: ${data.anomaly_count} anomalies found.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Run prediction"
        description="Analyze a compatible CSV using the latest trained Isolation Forest model."
      />

      <section className="panel p-6">
        <FileDrop
          file={file}
          onChange={(value) => {
            setFile(value);
            setResult(null);
          }}
        />
        <div className="mt-5 flex justify-end">
          <button
            className="button-primary"
            disabled={loading || !file}
            onClick={run}
          >
            <ScanSearch className="h-4 w-4" />
            {loading ? "Analyzing traffic..." : "Detect anomalies"}
          </button>
        </div>
      </section>

      {result && (
        <section className="panel mt-6 p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-semibold text-white">Prediction results</h2>
              <p className="mt-1 text-xs text-slate-500">
                {result.total_rows} records • {result.normal_count} normal •{" "}
                {result.anomaly_count} anomalies • {result.severity} severity
              </p>
            </div>
            <a
              className="button-secondary"
              href={`${API_URL}${result.download_url.replace("/api", "")}`}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </a>
          </div>
          <DataTable rows={result.preview} />
        </section>
      )}
    </>
  );
}
