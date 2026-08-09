import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function TrafficChart() {

  const [graphData, setGraphData] = useState([]);

  useEffect(() => {

    const fetchData = () => {

      axios
        .get("http://127.0.0.1:5000/api/live")
        .then((res) => {

          setGraphData((oldData) => {

            const updated = [
              ...oldData,
              {
                time: new Date().toLocaleTimeString(),
                packets: res.data.packets
              }
            ];

            if (updated.length > 20)
              updated.shift();

            return updated;

          });

        })
        .catch((err) => console.log(err));

    };

    fetchData();

    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);

  }, []);

  const data = {

    labels: graphData.map((d) => d.time),

    datasets: [

      {

        label: "Packets/sec",

        data: graphData.map((d) => d.packets),

        borderColor: "#00d4ff",

        backgroundColor: "rgba(0,212,255,.25)",

        fill: true,

        tension: .35

      }

    ]

  };

  const options = {

    responsive: true,

    maintainAspectRatio: false,

    animation: false,

    plugins: {

      legend: {

        labels: {

          color: "white"

        }

      }

    },

    scales: {

      x: {

        ticks: {

          color: "white"

        },

        grid: {

          color: "#1f2937"

        }

      },

      y: {

        beginAtZero: true,

        ticks: {

          color: "white"

        },

        grid: {

          color: "#1f2937"

        }

      }

    }

  };

  return (

    <div style={{ height: "320px" }}>

      <Line
        data={data}
        options={options}
      />

    </div>

  );

}

export default TrafficChart;