import { useEffect, useState } from "react";
import axios from "axios";

function ThreatTable() {

    const [summary, setSummary] = useState(null);

    useEffect(() => {
        axios
            .get("http://127.0.0.1:5000/api/dataset/summary")
            .then((res) => setSummary(res.data));
    }, []);

    if (!summary)
        return <p style={{ color: "white" }}>Loading Threat Intelligence...</p>;

    const attacks = Object.entries(summary.attackTypes)
        .filter(([k]) => k !== "BENIGN" && k !== "Normal")
        .sort((a, b) => b[1] - a[1]);

    return (
        <table className="threat-table">

            <thead>
                <tr>
                    <th>Attack Type</th>
                    <th>Detected</th>
                    <th>Risk</th>
                </tr>
            </thead>

            <tbody>

                {attacks.map(([attack, count], index) => {

                    let risk = "Low";
                    let className = "low";

                    if (count > 50000) {
                        risk = "Critical";
                        className = "critical";
                    } else if (count > 10000) {
                        risk = "High";
                        className = "high";
                    } else if (count > 1000) {
                        risk = "Medium";
                        className = "medium";
                    }

                    return (
                        <tr key={index}>

                            <td>{attack}</td>

                            <td>{count.toLocaleString()}</td>

                            <td>
                                <span className={className}>
                                    {risk}
                                </span>
                            </td>

                        </tr>
                    );

                })}

            </tbody>

        </table>
    );
}

export default ThreatTable;