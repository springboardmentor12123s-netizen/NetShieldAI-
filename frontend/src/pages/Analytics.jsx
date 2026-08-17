import { useEffect, useState, useCallback } from "react";
import API from "../services/api";

import AttackTypesChart from "../components/AttackTypesChart";
import ProtocolPieChart from "../components/ProtocolPieChart";
import TrafficTrendChart from "../components/TrafficTrendChart";

import "../styles/Analytics.css";

function Analytics() {
  const [attackTypes, setAttackTypes] = useState([]);
  const [protocolData, setProtocolData] = useState([]);
  const [trafficTrend, setTrafficTrend] = useState([]);
  const [topPorts, setTopPorts] = useState([]);

  const [summary, setSummary] = useState({
    total_traffic: 0,
    benign_traffic: 0,
    attack_traffic: 0,
    top_attack: "N/A",
  });

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [
        summaryResponse,
        attackResponse,
        protocolResponse,
        portsResponse,
        trendResponse,
      ] = await Promise.all([
        API.get("/analytics/summary"),
        API.get("/analytics/attack-types"),
        API.get("/analytics/protocol-distribution"),
        API.get("/analytics/top-ports"),
        API.get("/analytics/traffic-trend"),
      ]);

      // Summary
      if (summaryResponse.data) {
        setSummary({
          total_traffic: Number(
            summaryResponse.data.total_traffic || 0
          ),
          benign_traffic: Number(
            summaryResponse.data.benign_traffic || 0
          ),
          attack_traffic: Number(
            summaryResponse.data.attack_traffic || 0
          ),
          top_attack:
            summaryResponse.data.top_attack || "N/A",
        });
      }

      // Attack types
      setAttackTypes(
        Array.isArray(attackResponse.data)
          ? attackResponse.data
          : []
      );

      // Protocols
      setProtocolData(
        Array.isArray(protocolResponse.data)
          ? protocolResponse.data
          : []
      );

      // Top ports
      setTopPorts(
        Array.isArray(portsResponse.data)
          ? portsResponse.data
          : []
      );

      // Traffic trend
      setTrafficTrend(
        Array.isArray(trendResponse.data)
          ? trendResponse.data
          : []
      );
    } catch (error) {
      console.error("Analytics loading failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };

  const attackPercentage =
    summary.total_traffic > 0
      ? (
          (summary.attack_traffic / summary.total_traffic) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <div className="analytics-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="analytics-header">

        <div>
          <h1>📊 Network Traffic Analytics</h1>

          <p>
            Real-time network traffic analysis,
            threat distribution and security insights
          </p>
        </div>

        <div className="analytics-live">
          <span className="live-dot"></span>
          LIVE
        </div>

      </div>

      {/* =====================================
          SUMMARY CARDS
      ====================================== */}

      <div className="analytics-summary">

        {/* TOTAL TRAFFIC */}

        <div className="analytics-card total">

          <div className="analytics-card-icon">
            📡
          </div>

          <div>
            <h3>Total Traffic</h3>

            <strong>
              {loading
                ? "..."
                : formatNumber(summary.total_traffic)}
            </strong>

            <p>Network records monitored</p>
          </div>

        </div>

        {/* BENIGN */}

        <div className="analytics-card benign">

          <div className="analytics-card-icon">
            🟢
          </div>

          <div>
            <h3>Benign Traffic</h3>

            <strong>
              {loading
                ? "..."
                : formatNumber(summary.benign_traffic)}
            </strong>

            <p>Normal network activity</p>
          </div>

        </div>

        {/* ATTACK */}

        <div className="analytics-card attack">

          <div className="analytics-card-icon">
            🔴
          </div>

          <div>
            <h3>Attack Traffic</h3>

            <strong>
              {loading
                ? "..."
                : formatNumber(summary.attack_traffic)}
            </strong>

            <p>
              {attackPercentage}% of total traffic
            </p>
          </div>

        </div>

        {/* TOP ATTACK */}

        <div className="analytics-card top-attack">

          <div className="analytics-card-icon">
            ⚠️
          </div>

          <div>
            <h3>Top Attack</h3>

            <strong className="attack-value">
              {loading
                ? "..."
                : summary.top_attack}
            </strong>

            <p>Most frequently detected threat</p>
          </div>

        </div>

      </div>

      {/* =====================================
          CHARTS ROW
      ====================================== */}

      <div className="analytics-chart-grid">

        {/* ATTACK TYPES */}

        <div className="analytics-panel">

          <div className="panel-header">

            <div>
              <h2>Attack Type Distribution</h2>

              <p>
                Distribution of detected network threats
              </p>
            </div>

            <span className="panel-icon">
              🛡️
            </span>

          </div>

          <div className="chart-container">
            <AttackTypesChart data={attackTypes} />
          </div>

        </div>

        {/* PROTOCOL DISTRIBUTION */}

        <div className="analytics-panel">

          <div className="panel-header">

            <div>
              <h2>Protocol Distribution</h2>

              <p>
                Network traffic by communication protocol
              </p>
            </div>

            <span className="panel-icon">
              🌐
            </span>

          </div>

          <div className="chart-container">
            <ProtocolPieChart data={protocolData} />
          </div>

        </div>

      </div>

      {/* =====================================
          TRAFFIC TREND
      ====================================== */}

      <div className="analytics-panel traffic-trend-panel">

        <div className="panel-header">

          <div>
            <h2>Traffic Trend</h2>

            <p>
              Network activity over time
            </p>
          </div>

          <span className="panel-icon">
            📈
          </span>

        </div>

        <div className="trend-chart-container">
          <TrafficTrendChart data={trafficTrend} />
        </div>

      </div>

      {/* =====================================
          ATTACK STATISTICS + TOP PORTS
      ====================================== */}

      <div className="analytics-bottom-grid">

        {/* ATTACK STATISTICS */}

        <div className="analytics-panel">

          <div className="panel-header">

            <div>
              <h2>Attack Statistics</h2>

              <p>
                Detected attack types and record counts
              </p>
            </div>

            <span className="panel-icon">
              🚨
            </span>

          </div>

          <div className="analytics-table-wrapper">

            <table className="analytics-table">

              <thead>
                <tr>
                  <th>Attack Type</th>
                  <th>Total Records</th>
                </tr>
              </thead>

              <tbody>

                {attackTypes.length > 0 ? (

                  attackTypes.map((item, index) => (

                    <tr key={index}>

                      <td>
                        <span className="attack-type-name">
                          {item.label || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatNumber(item.total)}
                        </strong>
                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>
                    <td
                      colSpan="2"
                      className="empty-cell"
                    >
                      No attack statistics available
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* TOP PORTS */}

        <div className="analytics-panel">

          <div className="panel-header">

            <div>
              <h2>Top Network Ports</h2>

              <p>
                Most active destination ports
              </p>
            </div>

            <span className="panel-icon">
              🔌
            </span>

          </div>

          <div className="analytics-table-wrapper">

            <table className="analytics-table">

              <thead>
                <tr>
                  <th>Port</th>
                  <th>Traffic</th>
                </tr>
              </thead>

              <tbody>

                {topPorts.length > 0 ? (

                  topPorts.map((item, index) => (

                    <tr key={index}>

                      <td>
                        <span className="port-badge">
                          {item.port ??
                            item.destination_port ??
                            "-"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatNumber(
                            item.total ??
                            item.count ??
                            item.traffic
                          )}
                        </strong>
                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>
                    <td
                      colSpan="2"
                      className="empty-cell"
                    >
                      No port statistics available
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* =====================================
          FOOTER
      ====================================== */}

      <div className="analytics-footer">

        <span>
          🟢 Live analytics enabled
        </span>

        <span>
          Auto-refresh every 10 seconds
        </span>

      </div>

    </div>
  );
}

export default Analytics;