import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import AlertNotification from "../components/AlertNotification";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/Dashboard.css";

function Alerts() {

    const [alerts, setAlerts] = useState([]);
    const [latestAlert, setLatestAlert] = useState(null);
    const [historyFilter, setHistoryFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    // Prevent the same alert from popping repeatedly
    const lastNotifiedAlert = useRef(null);


    // ============================================================
    // FETCH ALERTS
    // ============================================================

    const fetchAlerts = async () => {

        try {

            let response;

            // ----------------------------------------------------
            // ALL ALERTS
            // ----------------------------------------------------

            if (historyFilter === "all") {

                response = await axios.get(
                    "http://127.0.0.1:8000/traffic/alerts"
                );

                const alertList =
                    Array.isArray(response.data)
                        ? response.data
                        : response.data?.value || [];

                setAlerts(alertList);

            }

            // ----------------------------------------------------
            // 15 / 30 DAY HISTORY
            // ----------------------------------------------------

            else {

                response = await axios.get(
                    `http://127.0.0.1:8000/traffic/alerts/history?days=${historyFilter}`
                );

                const alertList =
                    response.data?.alerts || [];

                setAlerts(alertList);
            }

            setLoading(false);

        } catch (error) {

            console.error(
                "Alert Fetch Error:",
                error
            );

            setAlerts([]);
            setLoading(false);
        }
    };


    // ============================================================
    // LATEST ALERT NOTIFICATION
    // ============================================================

    const checkLatestAlert = async () => {

        try {

            const response = await axios.get(
                "http://127.0.0.1:8000/traffic/alerts/latest"
            );

            const newest = response.data;

            if (
                newest &&
                (
                    newest.risk === "High" ||
                    newest.risk === "Critical"
                )
            ) {

                // Use database ID so the same alert is not
                // repeatedly shown as a new notification.

                const alertId =
                    newest.id ||
                    `${newest.timestamp}-${newest.prediction}-${newest.source}`;

                // Only show if it is genuinely new
                if (
                    lastNotifiedAlert.current !== alertId
                ) {

                    lastNotifiedAlert.current =
                        alertId;

                    setLatestAlert(newest);

                    // Notification disappears after 5 seconds
                    setTimeout(() => {
                        setLatestAlert(null);
                    }, 5000);
                }
            }

        } catch (error) {

            console.error(
                "Latest Alert Error:",
                error
            );
        }
    };


    // ============================================================
    // REFRESH ALERTS
    // ============================================================

    useEffect(() => {

        fetchAlerts();

        // Refresh every 5 seconds
        const interval = setInterval(() => {

            fetchAlerts();
            checkLatestAlert();

        }, 5000);

        return () => {
            clearInterval(interval);
        };

    }, [historyFilter]);


    // ============================================================
    // RESOLVE ALERT
    // ============================================================

    const resolveAlert = async (id) => {

        try {

            await axios.put(
                "http://127.0.0.1:8000/traffic/alerts/resolve",
                {
                    id: id
                }
            );

            // Refresh table after resolving
            await fetchAlerts();

        } catch (error) {

            console.error(
                "Resolve Alert Error:",
                error
            );

            window.alert(
                "Unable to resolve the alert."
            );
        }
    };


    // ============================================================
    // COUNTS
    // ============================================================

    const highCriticalCount =
        alerts.filter(
            alert =>
                alert.risk === "High" ||
                alert.risk === "Critical"
        ).length;

    const openCount =
        alerts.filter(
            alert =>
                alert.status === "Open"
        ).length;

    const resolvedCount =
        alerts.filter(
            alert =>
                alert.status === "Resolved"
        ).length;


    // ============================================================
    // RISK STYLE
    // ============================================================

    const getRiskStyle = (risk) => {

        if (risk === "Critical") {

            return {
                background: "#ffe4e6",
                color: "#be123c"
            };
        }

        if (risk === "High") {

            return {
                background: "#ffedd5",
                color: "#c2410c"
            };
        }

        if (risk === "Medium") {

            return {
                background: "#fef3c7",
                color: "#a16207"
            };
        }

        return {
            background: "#dcfce7",
            color: "#15803d"
        };
    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar />


                {/* =================================================
                    REAL-TIME NOTIFICATION
                ================================================= */}

                <AlertNotification
                    alert={latestAlert}
                    onClose={() => setLatestAlert(null)}
                />


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "28px",
                        flexWrap: "wrap",
                        gap: "15px"
                    }}
                >

                    <div>

                        <h2
                            style={{
                                marginBottom: "6px",
                                color: "#26324a"
                            }}
                        >
                            🚨 Alert Management
                        </h2>

                        <p
                            style={{
                                margin: 0,
                                color: "#7b879c"
                            }}
                        >
                            Monitor and review detected security threats
                        </p>

                    </div>


                    {/* =================================================
                        HISTORY FILTER
                    ================================================= */}

                    <div
                        style={{
                            background: "#ffffff",
                            padding: "10px 15px",
                            borderRadius: "14px",
                            boxShadow:
                                "0 4px 15px rgba(99,102,241,0.08)"
                        }}
                    >

                        <label
                            style={{
                                marginRight: "10px",
                                color: "#64748b",
                                fontWeight: "600"
                            }}
                        >
                            Alert History
                        </label>

                        <select
                            value={historyFilter}
                            onChange={(e) =>
                                setHistoryFilter(
                                    e.target.value
                                )
                            }
                            style={{
                                border: "none",
                                outline: "none",
                                background: "#eef2ff",
                                color: "#4f46e5",
                                padding: "9px 14px",
                                borderRadius: "10px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >

                            <option value="all">
                                All Alerts
                            </option>

                            <option value="15">
                                Last 15 Days
                            </option>

                            <option value="30">
                                Last 30 Days
                            </option>

                        </select>

                    </div>

                </div>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: "18px",
                        marginBottom: "30px"
                    }}
                >

                    {/* TOTAL */}

                    <div
                        style={{
                            background: "#eef2ff",
                            borderRadius: "18px",
                            padding: "20px",
                            border:
                                "1px solid #e0e7ff"
                        }}
                    >

                        <div
                            style={{
                                fontSize: "26px",
                                marginBottom: "8px"
                            }}
                        >
                            📊
                        </div>

                        <p
                            style={{
                                margin: 0,
                                color: "#6366f1",
                                fontWeight: "600"
                            }}
                        >
                            Total Alerts
                        </p>

                        <h2
                            style={{
                                margin: "5px 0 0",
                                color: "#4338ca",
                                fontSize: "34px"
                            }}
                        >
                            {alerts.length}
                        </h2>

                    </div>


                    {/* HIGH / CRITICAL */}

                    <div
                        style={{
                            background: "#fff1f2",
                            borderRadius: "18px",
                            padding: "20px",
                            border:
                                "1px solid #ffe4e6"
                        }}
                    >

                        <div
                            style={{
                                fontSize: "26px",
                                marginBottom: "8px"
                            }}
                        >
                            🚨
                        </div>

                        <p
                            style={{
                                margin: 0,
                                color: "#e11d48",
                                fontWeight: "600"
                            }}
                        >
                            High / Critical
                        </p>

                        <h2
                            style={{
                                margin: "5px 0 0",
                                color: "#be123c",
                                fontSize: "34px"
                            }}
                        >
                            {highCriticalCount}
                        </h2>

                    </div>


                    {/* OPEN */}

                    <div
                        style={{
                            background: "#fff7ed",
                            borderRadius: "18px",
                            padding: "20px",
                            border:
                                "1px solid #ffedd5"
                        }}
                    >

                        <div
                            style={{
                                fontSize: "26px",
                                marginBottom: "8px"
                            }}
                        >
                            🔓
                        </div>

                        <p
                            style={{
                                margin: 0,
                                color: "#ea580c",
                                fontWeight: "600"
                            }}
                        >
                            Open
                        </p>

                        <h2
                            style={{
                                margin: "5px 0 0",
                                color: "#c2410c",
                                fontSize: "34px"
                            }}
                        >
                            {openCount}
                        </h2>

                    </div>


                    {/* RESOLVED */}

                    <div
                        style={{
                            background: "#ecfdf5",
                            borderRadius: "18px",
                            padding: "20px",
                            border:
                                "1px solid #d1fae5"
                        }}
                    >

                        <div
                            style={{
                                fontSize: "26px",
                                marginBottom: "8px"
                            }}
                        >
                            ✅
                        </div>

                        <p
                            style={{
                                margin: 0,
                                color: "#059669",
                                fontWeight: "600"
                            }}
                        >
                            Resolved
                        </p>

                        <h2
                            style={{
                                margin: "5px 0 0",
                                color: "#047857",
                                fontSize: "34px"
                            }}
                        >
                            {resolvedCount}
                        </h2>

                    </div>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                    <div
                        style={{
                            background: "#ffffff",
                            padding: "45px",
                            textAlign: "center",
                            borderRadius: "18px",
                            color: "#64748b"
                        }}
                    >
                        Loading alerts...
                    </div>
                )}


                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loading &&
                    alerts.length === 0 && (

                    <div
                        style={{
                            background: "#ffffff",
                            padding: "55px",
                            textAlign: "center",
                            borderRadius: "18px",
                            boxShadow:
                                "0 4px 20px rgba(0,0,0,0.05)"
                        }}
                    >

                        <div
                            style={{
                                fontSize: "50px"
                            }}
                        >
                            🛡️
                        </div>

                        <h3
                            style={{
                                color: "#334155"
                            }}
                        >
                            No Alerts Found
                        </h3>

                        <p
                            style={{
                                color: "#94a3b8"
                            }}
                        >
                            No security alerts are available
                            for the selected period.
                        </p>

                    </div>
                )}


                {/* =================================================
                    ALERT TABLE
                ================================================= */}

                {!loading &&
                    alerts.length > 0 && (

                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "18px",
                            overflowX: "auto",
                            boxShadow:
                                "0 5px 20px rgba(99,102,241,0.07)"
                        }}
                    >

                        <div
                            style={{
                                padding: "20px 22px",
                                borderBottom:
                                    "1px solid #f1f5f9"
                            }}
                        >

                            <h3
                                style={{
                                    margin: 0,
                                    color: "#334155"
                                }}
                            >
                                Recent Security Events
                            </h3>

                            <p
                                style={{
                                    margin:
                                        "5px 0 0",
                                    color: "#94a3b8",
                                    fontSize: "14px"
                                }}
                            >
                                {historyFilter === "all"
                                    ? "All available alerts"
                                    : `Alerts from the last ${historyFilter} days`}
                            </p>

                        </div>


                        <table
                            style={{
                                width: "100%",
                                borderCollapse:
                                    "collapse",
                                minWidth: "1050px"
                            }}
                        >

                            <thead>

                                <tr
                                    style={{
                                        background:
                                            "#f8fafc",
                                        color:
                                            "#64748b"
                                    }}
                                >

                                    <th style={thStyle}>
                                        Time
                                    </th>

                                    <th style={thStyle}>
                                        Source
                                    </th>

                                    <th style={thStyle}>
                                        Destination
                                    </th>

                                    <th style={thStyle}>
                                        Protocol
                                    </th>

                                    <th style={thStyle}>
                                        Prediction
                                    </th>

                                    <th style={thStyle}>
                                        Threat
                                    </th>

                                    <th style={thStyle}>
                                        Risk
                                    </th>

                                    <th style={thStyle}>
                                        Status
                                    </th>

                                    <th style={thStyle}>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {alerts.map(
                                    (alert, index) => (

                                    <tr
                                        key={
                                            alert.id ||
                                            `${alert.timestamp}-${index}`
                                        }
                                        style={{
                                            borderBottom:
                                                "1px solid #f1f5f9"
                                        }}
                                    >

                                        <td style={tdStyle}>
                                            {alert.timestamp}
                                        </td>

                                        <td style={tdStyle}>
                                            {alert.source}
                                        </td>

                                        <td style={tdStyle}>
                                            {alert.destination}
                                        </td>

                                        <td style={tdStyle}>

                                            <span
                                                style={{
                                                    background:
                                                        "#e0f2fe",
                                                    color:
                                                        "#0369a1",
                                                    padding:
                                                        "5px 10px",
                                                    borderRadius:
                                                        "8px",
                                                    fontWeight:
                                                        "600"
                                                }}
                                            >
                                                🌐 {alert.protocol}
                                            </span>

                                        </td>

                                        <td
                                            style={{
                                                ...tdStyle,
                                                fontWeight:
                                                    "600",
                                                color:
                                                    "#475569"
                                            }}
                                        >
                                            {alert.prediction}
                                        </td>

                                        <td style={tdStyle}>
                                            {alert.threat}
                                        </td>


                                        {/* RISK */}

                                        <td style={tdStyle}>

                                            <span
                                                style={{
                                                    ...getRiskStyle(
                                                        alert.risk
                                                    ),
                                                    padding:
                                                        "6px 12px",
                                                    borderRadius:
                                                        "20px",
                                                    fontWeight:
                                                        "700",
                                                    fontSize:
                                                        "13px"
                                                }}
                                            >

                                                {alert.risk ===
                                                "Critical"
                                                    ? "🔴"
                                                    : alert.risk ===
                                                      "High"
                                                    ? "🟠"
                                                    : alert.risk ===
                                                      "Medium"
                                                    ? "🟡"
                                                    : "🟢"}{" "}
                                                {alert.risk}

                                            </span>

                                        </td>


                                        {/* STATUS */}

                                        <td style={tdStyle}>

                                            <span
                                                style={{
                                                    background:
                                                        alert.status ===
                                                        "Open"
                                                            ? "#fff1f2"
                                                            : "#ecfdf5",
                                                    color:
                                                        alert.status ===
                                                        "Open"
                                                            ? "#e11d48"
                                                            : "#059669",
                                                    padding:
                                                        "6px 12px",
                                                    borderRadius:
                                                        "20px",
                                                    fontWeight:
                                                        "700",
                                                    fontSize:
                                                        "13px"
                                                }}
                                            >
                                                {alert.status ===
                                                "Open"
                                                    ? "● Open"
                                                    : "✓ Resolved"}
                                            </span>

                                        </td>


                                        {/* RESOLVE */}

                                        <td
                                            style={{
                                                ...tdStyle,
                                                textAlign:
                                                    "center"
                                            }}
                                        >

                                            {alert.status ===
                                            "Resolved" ? (

                                                <button
                                                    disabled
                                                    style={{
                                                        background:
                                                            "#d1fae5",
                                                        color:
                                                            "#047857",
                                                        border:
                                                            "none",
                                                        padding:
                                                            "8px 14px",
                                                        borderRadius:
                                                            "10px",
                                                        fontWeight:
                                                            "600",
                                                        cursor:
                                                            "default"
                                                    }}
                                                >
                                                    ✓ Resolved
                                                </button>

                                            ) : (

                                                <button
                                                    onClick={() =>
                                                        resolveAlert(
                                                            alert.id
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            "#dcfce7",
                                                        color:
                                                            "#15803d",
                                                        border:
                                                            "1px solid #bbf7d0",
                                                        padding:
                                                            "8px 14px",
                                                        borderRadius:
                                                            "10px",
                                                        fontWeight:
                                                            "700",
                                                        cursor:
                                                            "pointer"
                                                    }}
                                                >
                                                    ✓ Resolve
                                                </button>

                                            )}

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}


// ================================================================
// TABLE STYLES
// ================================================================

const thStyle = {
    padding: "14px 12px",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap"
};


const tdStyle = {
    padding: "14px 12px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
    whiteSpace: "nowrap"
};


export default Alerts;