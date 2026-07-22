"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You're not logged in. Please log in first.");
      return;
    }

    fetch("http://127.0.0.1:8000/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch stats (status " + res.status + ")");
        }
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900/70 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-red-400">{error}</p>
          <a
            href="/"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline"
          >
            Go to login
          </a>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-400">Loading dashboard...</p>
      </main>
    );
  }

  const labels = Object.keys(stats.breakdown);
  const values = Object.values(stats.breakdown);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Traffic by Type",
        data: values,
        backgroundColor: labels.map((l) =>
          l === "Normal Traffic" ? "#3fb950" : "#f85149"
        ),
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} flows`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
    },
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Traffic Analytics Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              Live breakdown from the CICIDS2017 dataset
            </p>
          </div>
          <a
            href="/"
            className="text-slate-400 hover:text-white text-sm underline"
          >
            Back to home
          </a>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Total Records</p>
            <p className="text-white text-xl font-bold">
              {stats.total_records.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Normal Traffic</p>
            <p className="text-green-400 text-xl font-bold">
              {(stats.breakdown["Normal Traffic"] || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Attack Flows</p>
            <p className="text-red-400 text-xl font-bold">
              {(
                stats.total_records - (stats.breakdown["Normal Traffic"] || 0)
              ).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Attack Types</p>
            <p className="text-white text-xl font-bold">
              {Object.keys(stats.breakdown).length - 1}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </main>
  );
}