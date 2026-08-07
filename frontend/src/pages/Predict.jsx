import { Activity, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, AlertCircle, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { exportCSV, exportPDF } from "../utils/exportReport";
import toast from "react-hot-toast";
import { useLiveData } from "../context/LiveDataContext";

export default function Predict() {
  const { predictions } = useLiveData();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === "ascending" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const filtered = predictions.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const destPort = p.features && p.features["Destination Port"] ? p.features["Destination Port"].toString() : "";
    return (
      (p.flow_id && p.flow_id.toLowerCase().includes(s)) ||
      (p.predicted_class && p.predicted_class.toLowerCase().includes(s)) ||
      (p.severity && p.severity.toLowerCase().includes(s)) ||
      (p.prediction_label && p.prediction_label.toLowerCase().includes(s)) ||
      destPort.includes(s)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig) {
      return new Date(b.prediction_timestamp) - new Date(a.prediction_timestamp);
    }
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === "destination_port") {
      aVal = a.features && a.features["Destination Port"] ? Number(a.features["Destination Port"]) : 0;
      bVal = b.features && b.features["Destination Port"] ? Number(b.features["Destination Port"]) : 0;
    } else if (sortConfig.key === "prediction_timestamp") {
      aVal = new Date(a.prediction_timestamp).getTime();
      bVal = new Date(b.prediction_timestamp).getTime();
    }
    
    if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const currentRows = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleExportCSV = () => {
    if (exportCSV(predictions)) {
      toast.success("CSV exported successfully");
    } else {
      toast.error("No data to export");
    }
  };

  const handleExportPDF = async () => {
    const success = await exportPDF(predictions);
    if (success) {
      toast.success("PDF exported successfully");
    } else {
      toast.error("No data to export");
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-6 overflow-hidden">
      <PageHeader
        title="Live Predictions"
        description="Real-time SOC monitoring for anomalous network flows."
      />

      <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-800 bg-[#0b1525]">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/10 text-cyan">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Live Feed</h2>
              <p className="text-xs text-slate-400">Monitoring {predictions.length} recent flows</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search flows, threats, ports..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan focus:ring-1 focus:ring-cyan"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleExportCSV}
              disabled={predictions.length === 0}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={predictions.length === 0}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-ink transition hover:bg-cyan/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-950/90 shadow-sm backdrop-blur-md">
              <tr className="text-xs uppercase tracking-wider text-slate-400">
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("prediction_timestamp")}>
                  <div className="flex items-center gap-1">Timestamp {getSortIcon("prediction_timestamp")}</div>
                </th>
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("flow_id")}>
                  <div className="flex items-center gap-1">Flow ID {getSortIcon("flow_id")}</div>
                </th>
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("destination_port")}>
                  <div className="flex items-center gap-1">Dest Port {getSortIcon("destination_port")}</div>
                </th>
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("prediction_label")}>
                  <div className="flex items-center gap-1">Prediction {getSortIcon("prediction_label")}</div>
                </th>
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("predicted_class")}>
                  <div className="flex items-center gap-1">Threat Category {getSortIcon("predicted_class")}</div>
                </th>
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("severity")}>
                  <div className="flex items-center gap-1">Severity {getSortIcon("severity")}</div>
                </th>
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("risk_score")}>
                  <div className="flex items-center gap-1">Risk Score {getSortIcon("risk_score")}</div>
                </th>
                <th className="group cursor-pointer px-5 py-4 font-semibold hover:text-white" onClick={() => handleSort("confidence")}>
                  <div className="flex items-center gap-1">Confidence {getSortIcon("confidence")}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {currentRows.length > 0 ? (
                currentRows.map((row, i) => {
                  const isAttack = row.prediction_label !== "Normal";
                  
                  let sevColor = "bg-slate-500/10 text-slate-400 border border-slate-500/20";
                  if (row.severity === "Critical") sevColor = "bg-red-500/10 text-red-400 border border-red-500/30 font-semibold";
                  else if (row.severity === "High") sevColor = "bg-orange-500/10 text-orange-400 border border-orange-500/30 font-semibold";
                  else if (row.severity === "Medium") sevColor = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-medium";
                  else if (row.severity === "Low") sevColor = "bg-green-500/10 text-green-400 border border-green-500/30 font-medium";

                  return (
                    <tr key={`${row.flow_id}-${i}`} className="bg-transparent transition-colors hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-300">
                        {new Date(row.prediction_timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="max-w-[150px] truncate whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-400" title={row.flow_id}>
                        {row.flow_id}
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {row.features && row.features["Destination Port"] ? row.features["Destination Port"] : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isAttack ? "bg-red-400/10 text-red-400 ring-red-400/20" : "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20"}`}>
                          {isAttack ? "Attack" : "Normal"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-sm ${row.predicted_class !== "BENIGN" ? "font-semibold text-rose-300" : "text-slate-400"}`}>
                          {row.predicted_class || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs ${sevColor}`}>
                          {row.severity || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${row.risk_score > 75 ? 'text-red-400' : row.risk_score > 50 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {row.risk_score}
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                            <div 
                              className={`h-full rounded-full ${row.risk_score > 75 ? 'bg-red-500' : row.risk_score > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(100, Math.max(0, row.risk_score))}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {(row.confidence * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-slate-700" />
                      <p>No predictions matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing {Math.min(sorted.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(sorted.length, currentPage * rowsPerPage)} of {sorted.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-400">Page {currentPage} of {Math.max(1, totalPages)}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
