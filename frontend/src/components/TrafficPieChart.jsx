import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

function TrafficPieChart({ benign, attack }) {

    const data = {
        labels: [
            "Benign",
            "Attack"
        ],
        datasets: [
            {
                data: [benign, attack],
                backgroundColor: [
                    "#22c55e",
                    "#ef4444",
                ],
            },
        ],
    };

    return (
        <div
            style={{
                width: "400px",
                margin: "40px auto",
            }}
        >
            <Pie data={data} />
        </div>
    );
}

export default TrafficPieChart;