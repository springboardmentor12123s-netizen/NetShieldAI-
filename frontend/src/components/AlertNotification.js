import React from "react";

function AlertNotification({ alert, onClose }) {

    if (!alert) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: "85px",
                right: "25px",
                width: "350px",
                background: "#ffffff",
                borderRadius: "20px",
                padding: "20px",
                zIndex: 9999,

                boxShadow:
                    "0 12px 35px rgba(99,102,241,0.18)",

                border: "1px solid #fee2e2",
                borderLeft: "6px solid #fda4af"
            }}
        >

            {/* HEADER */}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "15px"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}
                >

                    <div
                        style={{
                            width: "45px",
                            height: "45px",
                            borderRadius: "50%",
                            background: "#fff1f2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "23px"
                        }}
                    >
                        🚨
                    </div>

                    <div>

                        <h3
                            style={{
                                margin: 0,
                                color: "#be123c",
                                fontSize: "19px"
                            }}
                        >
                            Security Alert
                        </h3>

                        <span
                            style={{
                                color: "#94a3b8",
                                fontSize: "13px"
                            }}
                        >
                            New threat detected
                        </span>

                    </div>

                </div>


                {/* CLOSE BUTTON */}

                <button
                    onClick={onClose}
                    style={{
                        border: "none",
                        background: "#f8fafc",
                        color: "#94a3b8",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontSize: "16px"
                    }}
                >
                    ×
                </button>

            </div>


            {/* THREAT */}

            <div
                style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "14px"
                }}
            >

                <span
                    style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px"
                    }}
                >
                    Threat
                </span>

                <strong
                    style={{
                        color: "#334155",
                        fontSize: "16px"
                    }}
                >
                    {alert.threat || "Security Threat"}
                </strong>

            </div>


            {/* DETAILS */}

            <div
                style={{
                    display: "grid",
                    gap: "9px"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between"
                    }}
                >

                    <strong
                        style={{
                            color: "#334155"
                        }}
                    >
                        Risk
                    </strong>

                    <span
                        style={{
                            background:
                                alert.risk === "Critical"
                                    ? "#ffe4e6"
                                    : "#ffedd5",

                            color:
                                alert.risk === "Critical"
                                    ? "#be123c"
                                    : "#c2410c",

                            padding: "4px 11px",
                            borderRadius: "20px",
                            fontWeight: "700",
                            fontSize: "13px"
                        }}
                    >
                        🔴 {alert.risk}
                    </span>

                </div>


                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "15px"
                    }}
                >

                    <strong
                        style={{
                            color: "#334155"
                        }}
                    >
                        Prediction
                    </strong>

                    <span
                        style={{
                            color: "#64748b",
                            textAlign: "right",
                            maxWidth: "210px"
                        }}
                    >
                        {alert.prediction}
                    </span>

                </div>


                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between"
                    }}
                >

                    <strong
                        style={{
                            color: "#334155"
                        }}
                    >
                        Source
                    </strong>

                    <span
                        style={{
                            color: "#64748b"
                        }}
                    >
                        {alert.source}
                    </span>

                </div>


                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between"
                    }}
                >

                    <strong
                        style={{
                            color: "#334155"
                        }}
                    >
                        Protocol
                    </strong>

                    <span
                        style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            padding: "4px 10px",
                            borderRadius: "10px",
                            fontWeight: "600"
                        }}
                    >
                        🌐 {alert.protocol}
                    </span>

                </div>

            </div>


            {/* FOOTER */}

            <div
                style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid #f1f5f9",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "12px"
                }}
            >
                NetShield AI • Real-time Threat Detection
            </div>

        </div>
    );
}

export default AlertNotification;