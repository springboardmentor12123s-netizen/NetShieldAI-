import { useEffect, useState } from "react";
import axios from "axios";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
);

function AttackChart() {

    const [summary, setSummary] = useState(null);

    useEffect(() => {

        axios.get("http://127.0.0.1:5000/api/dataset/summary")
            .then(res => setSummary(res.data));

    }, []);

    if (!summary) return <p style={{color:"white"}}>Loading...</p>;

    const attacks = Object.entries(summary.attackTypes)
        .filter(([name]) => name !== "BENIGN" && name !== "Normal")
        .sort((a,b)=>b[1]-a[1])
        .slice(0,5);

    const data = {

        labels: attacks.map(a=>a[0]),

        datasets:[
            {
                label:"Records",
                data: attacks.map(a=>a[1]),
                backgroundColor:"#00d4ff"
            }
        ]
    };

    const options={

        plugins:{
            legend:{
                labels:{
                    color:"white"
                }
            }
        },

        scales:{

            x:{
                ticks:{
                    color:"white"
                }
            },

            y:{
                ticks:{
                    color:"white"
                }
            }

        }

    };

    return <Bar data={data} options={options}/>;

}

export default AttackChart;