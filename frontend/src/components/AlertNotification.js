import React from "react";

function AlertNotification({ alert }) {

    if (!alert) return null;

    return (

        <div
            style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                width: "320px",
                background: "#dc3545",
                color: "white",
                padding: "15px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                zIndex: 9999
            }}
        >

            <h3>🚨 Security Alert</h3>

            <p><b>Threat:</b> {alert.threat}</p>

            <p><b>Risk:</b> {alert.risk}</p>

            <p><b>Source:</b> {alert.source}</p>

            <p><b>Protocol:</b> {alert.protocol}</p>

        </div>

    );

}

export default AlertNotification;