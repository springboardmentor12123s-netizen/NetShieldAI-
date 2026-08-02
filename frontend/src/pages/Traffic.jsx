import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/Traffic.css";

function Traffic() {

  const [traffic, setTraffic] = useState([]);

  useEffect(() => {

    fetchTraffic();

    const interval = setInterval(() => {
      fetchTraffic();
    }, 30000);

    return () => clearInterval(interval);

  }, []);

  const fetchTraffic = async () => {

    try {

      const response = await API.get("/traffic/predictions");

      setTraffic(response.data);

    } catch (error) {

      console.log(error);

    }

  };

  return (
    <div className="traffic-page">

      <h1>🌐 Live Network Traffic</h1>

      <table className="traffic-table">

        <thead>

          <tr>

            <th>#</th>
            <th>Source IP</th>
            <th>Destination IP</th>
            <th>Protocol</th>
            <th>Prediction</th>
            <th>Severity</th>
            <th>Status</th>

          </tr>

        </thead>

        <tbody>

          {traffic.length > 0 ? (

            traffic.map((packet, index) => (

              <tr key={index}>

                <td>{index + 1}</td>

                <td>{packet.source_ip}</td>

                <td>{packet.destination_ip}</td>

                <td>{packet.protocol}</td>

                <td>{packet.prediction}</td>

                <td>{packet.severity}</td>

                <td>{packet.status}</td>

              </tr>

            ))

          ) : (

            <tr>

              <td colSpan="7">
                No live traffic detected.
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}

export default Traffic;