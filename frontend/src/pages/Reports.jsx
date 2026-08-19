import React, { useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import api from "../api.js";

const REPORT_TYPES = [
  { key: "threat", label: "Threat Report", desc: "All generated alerts with severity and recommendations" },
  { key: "prediction", label: "Prediction Report", desc: "AI prediction history with confidence and risk scores" },
  { key: "traffic", label: "Traffic Report", desc: "Packet monitoring records" },
];

export default function Reports() {
  const [downloading, setDownloading] = useState("");

  const download = async (type, format) => {
    setDownloading(`${type}-${format}`);
    try {
      const res = await api.get(`/reports/${type}/${format}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const disposition = res.headers["content-disposition"] || "";
      const match = disposition.match(/filename=(.+)$/);
      link.download = match ? match[1] : `netshield_${type}_report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded`);
    } catch {
      toast.error("Could not generate report");
    } finally {
      setDownloading("");
    }
  };

  return (
    <div>
      <div className="section-title">Reports</div>
      <div className="grid grid-2">
        {REPORT_TYPES.map(({ key, label, desc }) => (
          <div className="glass-card" key={key}>
            <div className="section-title" style={{ fontSize: "1rem" }}>{label}</div>
            <p style={{ color: "var(--text-dim)", fontSize: "0.82rem", marginTop: -8, marginBottom: 16 }}>{desc}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => download(key, "csv")}
                disabled={downloading === `${key}-csv`}
              >
                <Download size={14} /> {downloading === `${key}-csv` ? "Preparing…" : "CSV"}
              </button>
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "8px 16px", background: "transparent", border: "1px solid var(--panel-border)", color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => download(key, "pdf")}
                disabled={downloading === `${key}-pdf`}
              >
                <Download size={14} /> {downloading === `${key}-pdf` ? "Preparing…" : "PDF"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
