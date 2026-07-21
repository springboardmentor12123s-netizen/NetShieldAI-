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
                    "http://127.0.0.1:8000/traffic/packets"
                );

                setPackets(response.data);

            } catch (error) {

                console.error(error);

            }

        };

        fetchPackets();

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
                        <strong>Dataset:</strong> CICIDS2017
                    </p>

                    <p>
                        <strong>Packets Displayed:</strong> {packets.length}
                    </p>

                    <p>
                        The following table displays network traffic records
                        collected from the CICIDS2017 dataset.
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

                            <th style={{ padding: "12px" }}>Protocol</th>
                            <th style={{ padding: "12px" }}>Flow Duration</th>
                            <th style={{ padding: "12px" }}>Packet Length</th>
                            <th style={{ padding: "12px" }}>Flow Bytes/s</th>
                            <th style={{ padding: "12px" }}>Flow Packets/s</th>
                            <th style={{ padding: "12px" }}>Attack Label</th>

                        </tr>

                    </thead>

                    <tbody>

                        {packets.slice(0, 20).map((packet, index) => (

                            <tr
                                key={index}
                                style={{
                                    borderBottom: "1px solid #ddd",
                                    textAlign: "center"
                                }}
                            >

                                <td style={{ padding: "12px" }}>
                                    {getProtocol(packet.protocol)}
                                </td>

                                <td style={{ padding: "12px" }}>
                                    {packet.flow_duration}
                                </td>

                                <td style={{ padding: "12px" }}>
                                    {packet.packet_length.toFixed(2)}
                                </td>

                                <td style={{ padding: "12px" }}>
                                    {packet.flow_bytes_per_sec.toFixed(2)}
                                </td>

                                <td style={{ padding: "12px" }}>
                                    {packet.flow_packets_per_sec.toFixed(2)}
                                </td>

                                <td style={{ padding: "12px" }}>
                                    {packet.label}
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