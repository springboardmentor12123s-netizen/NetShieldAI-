import React, { useEffect, useState } from "react";
import axios from "axios";
import AlertNotification from "../components/AlertNotification";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

function Alerts() {

    const [alerts, setAlerts] = useState([]);
    const [latestAlert, setLatestAlert] = useState(null);

    useEffect(() => {

        const fetchAlerts = () => {

            axios.get("http://127.0.0.1:8000/traffic/alerts")
            
                .then((res) => {

    setAlerts(res.data);

    if (res.data.length > 0) {

        const newest = res.data[0];

        if (
    newest.risk === "High" ||
    newest.risk === "Critical"
) {
    setLatestAlert(newest);

    setTimeout(() => {
        setLatestAlert(null);
    }, 5000);
}
            
        
    }

});
            

        };

        fetchAlerts();

        const interval = setInterval(fetchAlerts, 2000);

        return () => clearInterval(interval);

    }, []);

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar />
                <AlertNotification alert={latestAlert} />

                <h2>Alert Management</h2>

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        background: "#fff",
                        boxShadow: "0 2px 10px rgba(0,0,0,.1)"
                    }}
                >

                    <thead>

                        <tr style={{
                            background: "#dc3545",
                            color: "white"
                        }}>

                            <th style={{padding:"12px"}}>Time</th>
                            <th style={{padding:"12px"}}>Source</th>
                            <th style={{padding:"12px"}}>Destination</th>
                            <th style={{padding:"12px"}}>Protocol</th>
                            <th style={{padding:"12px"}}>Risk</th>
                            <th style={{padding:"12px"}}>Status</th>
                            <th style={{ padding: "12px" }}>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {alerts.map((alert,index)=>(

                            <tr key={index} style={{textAlign:"center"}}>

                                <td>{alert.timestamp}</td>
                                <td>{alert.source}</td>
                                <td>{alert.destination}</td>
                                <td>{alert.protocol}</td>
                                <td
    style={{
        color:
            alert.risk === "Critical"
                ? "#dc3545"
                : alert.risk === "High"
                ? "#fd7e14"
                : alert.risk === "Medium"
                ? "#ffc107"
                : "#28a745",
        fontWeight: "bold"
    }}
>
    {alert.risk}
</td>
                                <td
    style={{
        color:
            alert.status === "Open"
                ? "#dc3545"
                : "#28a745",
        fontWeight: "bold"
    }}
>
    {alert.status}
</td>
<td>
    <button
        style={{
            background: "#28a745",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer"
        }}
        onClick={() => window.alert("Incident Resolved")}
    >
        Resolve
    </button>
</td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default Alerts;