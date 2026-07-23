import { UploadCloud } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import FileDrop from "../components/FileDrop";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return toast.error("Select a CSV file first.");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/upload", form);
      setResult(data);
      toast.success(`${data.row_count.toLocaleString()} rows uploaded.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload dataset"
        description="Add a CICIDS2017 or compatible CSV file for model training. Files are stored locally."
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
            onClick={upload}
          >
            <UploadCloud className="h-4 w-4" />
            {loading ? "Reading dataset..." : "Upload & preview"}
          </button>
        </div>
      </section>

      {result && (
        <section className="panel mt-6 p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Dataset preview</h2>
            <p className="mt-1 text-xs text-slate-500">
              {result.name} • {result.row_count.toLocaleString()} rows • {result.columns.length} columns
            </p>
          </div>
          <DataTable rows={result.preview} />
        </section>
      )}
    </>
  );
}
