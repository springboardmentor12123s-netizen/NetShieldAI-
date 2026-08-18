"use client";

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProtocolData {
    protocol: string;
    count: number;
}

export const ProtocolDistributionChart = React.memo(function ProtocolDistributionChart({ data }: { data: ProtocolData[] }) {
    const chartData = React.useMemo(() => ({
        labels: data.map((d) => d.protocol),
        datasets: [
            {
                data: data.map((d) => d.count),
                backgroundColor: [
                    "rgba(99, 102, 241, 0.77)", // Indigo
                    "rgba(6, 182, 212, 0.77)",  // Cyan
                    "rgba(16, 185, 129, 0.77)",  // Emerald
                    "rgba(245, 158, 11, 0.77)",  // Amber
                    "rgba(239, 68, 68, 0.77)",   // Red
                ],
                borderColor: [
                    "rgb(99, 102, 241)",
                    "rgb(6, 182, 212)",
                    "rgb(16, 185, 129)",
                    "rgb(245, 158, 11)",
                    "rgb(239, 68, 68)",
                ],
                borderWidth: 1.5,
            },
        ],
    }), [data]);

    const options = React.useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: {
                    color: "rgba(255, 255, 255, 0.7)",
                    font: {
                        size: 11,
                        family: "var(--font-sans)",
                    },
                    padding: 15,
                },
            },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                titleColor: "#ffffff",
                bodyColor: "rgba(251, 251, 251, 0.8)",
                borderColor: "rgba(99, 102, 241, 0.3)",
                borderWidth: 1,
                padding: 10,
            },
        },
        cutout: "70%",
    }), []);

    return (
        <div className="relative h-64 w-full">
            {data.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    No protocol logs recorded
                </div>
            ) : (
                <Doughnut data={chartData} options={options} />
            )}
        </div>
    );
});
export default ProtocolDistributionChart;
