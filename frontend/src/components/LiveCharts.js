import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

function LiveCharts({ liveDashboard }) {

    if (!liveDashboard) {
        return null;
    }

    const predictions = liveDashboard.predictions || {};
    const protocols = liveDashboard.protocols || {};

    const getPrediction = (names) => {
        for (const name of names) {
            if (
                predictions[name] !== undefined &&
                predictions[name] !== null
            ) {
                return predictions[name];
            }
        }

        return 0;
    };

    const benign = getPrediction([
        "Benign"
    ]);

    const xss = getPrediction([
        "Web Attack – XSS",
        "Web Attack - XSS",
        "Web Attack � XSS",
        "Web Attack ï¿½ XSS",
        "XSS"
    ]);

    const sql = getPrediction([
        "Web Attack – Sql Injection",
        "Web Attack - Sql Injection",
        "Web Attack � Sql Injection",
        "Web Attack ï¿½ Sql Injection",
        "SQL Injection"
    ]);

    const brute = getPrediction([
        "Web Attack – Brute Force",
        "Web Attack - Brute Force",
        "Web Attack � Brute Force",
        "Web Attack ï¿½ Brute Force",
        "Brute Force"
    ]);

    const classificationData = [
        {
            name: "Benign",
            value: benign
        },
        {
            name: "XSS",
            value: xss
        },
        {
            name: "SQL Injection",
            value: sql
        },
        {
            name: "Brute Force",
            value: brute
        }
    ];

    const protocolData = [
        {
            name: "TCP",
            value: protocols.TCP || 0
        },
        {
            name: "TLS",
            value: protocols.TLS || 0
        },
        {
            name: "DNS",
            value: protocols.DNS || 0
        },
        {
            name: "UDP",
            value: protocols.UDP || 0
        }
    ];

    const pieData = classificationData.filter(
        item => item.value > 0
    );

    const PIE_COLORS = [
        "#10B981",
        "#8B5CF6",
        "#F59E0B",
        "#EC4899"
    ];

    return (
        <div className="charts-grid-new">

            {/* ================================
                PROTOCOL DISTRIBUTION
            ================================= */}

            <div className="chart-card-new">

                <h3>
                    📊 Protocol Distribution
                </h3>

                <ResponsiveContainer
                    width="100%"
                    height={300}
                >

                    <BarChart data={protocolData}>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                        />

                        <XAxis
                            dataKey="name"
                        />

                        <YAxis />

                        <Tooltip />

                        <Bar
                            dataKey="value"
                            fill="#3B82F6"
                            radius={[8, 8, 0, 0]}
                        />

                    </BarChart>

                </ResponsiveContainer>

            </div>


            {/* ================================
                PREDICTION DISTRIBUTION
            ================================= */}

            <div className="chart-card-new">

                <h3>
                    📈 Prediction Distribution
                </h3>

                {pieData.length > 0 ? (

                    <ResponsiveContainer
                        width="100%"
                        height={300}
                    >

                        <PieChart>

                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >

                                {pieData.map(
                                    (entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                PIE_COLORS[
                                                    index %
                                                    PIE_COLORS.length
                                                ]
                                            }
                                        />
                                    )
                                )}

                            </Pie>

                            <Tooltip />

                            <Legend />

                        </PieChart>

                    </ResponsiveContainer>

                ) : (

                    <div className="no-chart-data">
                        No attack data yet
                    </div>

                )}

            </div>

        </div>
    );
}

export default LiveCharts;