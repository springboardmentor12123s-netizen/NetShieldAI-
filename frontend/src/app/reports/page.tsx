"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/reports")
      .then((res) => res.json())
      .then((data) => setReport(data.data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
        <h1 className="text-3xl font-semibold">Threat intelligence report</h1>
        <p className="mt-3 text-slate-400">Operational summary generated from live SOC telemetry.</p>

        {report && (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="text-lg font-semibold">Executive summary</h2>
              <p className="mt-2 text-slate-300">
                {report.summary?.critical_alerts ?? 0} critical alerts were identified, with an average risk score of {report.summary?.risk_score_avg ?? 0} across {report.summary?.total_packets ?? 0} monitored packets.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="text-lg font-semibold">Recommendations</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                {report.recommendations?.map((item: string, index: number) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
