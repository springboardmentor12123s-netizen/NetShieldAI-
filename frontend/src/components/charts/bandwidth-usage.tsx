"use client";

import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

interface BandwidthPoint {
    time: string;
    bytes: number;
}

export const BandwidthUsageChart = React.memo(function BandwidthUsageChart({ data }: { data: BandwidthPoint[] }) {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const chartData = React.useMemo(() => ({
        labels: data.map((d) => {
            const date = new Date(d.time);
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }),
        datasets: [
            {
                fill: true,
                label: "Ingestion Volume (Bytes)",
                data: data.map((d) => d.bytes),
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.35,
                borderWidth: 2,
                pointBackgroundColor: "rgb(99, 102, 241)",
                pointHoverRadius: 6,
            },
        ],
    }), [data]);

    const options = React.useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                titleColor: "#ffffff",
                bodyColor: "rgba(251, 251, 251, 0.8)",
                borderColor: "rgba(99, 102, 241, 0.3)",
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: (context: any) => `Volume: ${formatBytes(context.raw)}`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(255, 255, 255, 0.05)",
                },
                ticks: {
                    color: "rgba(255, 255, 255, 0.5)",
                    font: {
                        size: 10,
                    },
                },
            },
            y: {
                grid: {
                    color: "rgba(255, 255, 255, 0.05)",
                },
                ticks: {
                    color: "rgba(255, 255, 255, 0.5)",
                    font: {
                        size: 10,
                    },
                    callback: (value: any) => formatBytes(value),
                },
            },
        },
    }), []);

    return (
        <div className="relative h-64 w-full">
            {data.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    No bandwidth data recorded
                </div>
            ) : (
                <Line data={chartData} options={options} />
            )}
        </div>
    );
});
export default BandwidthUsageChart;
