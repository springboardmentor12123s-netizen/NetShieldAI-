import React, { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/Dashboard.css";

function Monitoring() {

    const [packets, setPackets] = useState([]);

    useEffect(() => {

    const fetchPackets = async () => {

        try {

            const response = await axios.get(
                "http://127.0.0.1:8000/traffic/live/history"
            );

            setPackets(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    fetchPackets();

    const interval = setInterval(fetchPackets, 2000);

    return () => clearInterval(interval);

}, []);

    const getProtocol = (protocol) => {

        switch (protocol) {

            case 6:
                return "TCP";

            case 17:
                return "UDP";

            case 1:
                return "ICMP";

            default:
                return "Other";

        }

    };
    console.log(packets);

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar />

                <h2>Network Packet Monitoring</h2>

                <div
                    style={{
                        background: "#fff",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 10px rgba(0,0,0,.1)"
                    }}
                >

                    <h3>Packet Collection Summary</h3>

                    <p>
                        <strong>Source:</strong> Live Network Traffic
                    </p>

                    <p>
                        <strong>Packets Displayed:</strong> {packets.length}
                    </p>

                    <p>
                        The following table displays packets captured and
analyzed in real time.
                    </p>

                </div>

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        background: "#fff",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 2px 10px rgba(0,0,0,.1)"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background: "#4F46E5",
                                color: "white"
                            }}
                        >

                            <th style={{ padding: "12px" }}>Time</th>
<th style={{ padding: "12px" }}>Source IP</th>
<th style={{ padding: "12px" }}>Destination IP</th>
<th style={{ padding: "12px" }}>Protocol</th>
<th style={{ padding: "12px" }}>Prediction</th>
<th style={{ padding: "12px" }}>Risk</th>
<th style={{ padding: "12px" }}>Confidence</th>
                        </tr>

                    </thead>

                    <tbody>

{packets
    .slice()
    .reverse()
    .map((packet, index) => (

<tr
    key={index}
    style={{
        borderBottom: "1px solid #ddd",
        textAlign: "center"
    }}
>

    <td style={{ padding: "12px" }}>
        {packet.timestamp}
    </td>

    <td style={{ padding: "12px" }}>
        {packet.source}
    </td>

    <td style={{ padding: "12px" }}>
        {packet.destination}
    </td>

    <td style={{ padding: "12px" }}>
        {packet.protocol}
    </td>

    <td style={{ padding: "12px" }}>
        {packet.prediction}
    </td>

    <td style={{ padding: "12px" }}>
        {packet.risk}
    </td>

    <td style={{ padding: "12px" }}>
        {packet.confidence}%
    </td>

</tr>

))}

</tbody>

                </table>

            </div>

        </div>

    );

}

export default Monitoring;