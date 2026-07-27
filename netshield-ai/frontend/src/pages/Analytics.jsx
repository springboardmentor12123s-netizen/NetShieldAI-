import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line,
} from "recharts";
import api from "../api.js";
import Skeleton from "../components/Skeleton.jsx";

const COLORS = ["#2dd4bf", "#ff5470", "#ff9f43", "#ffd23f", "#818cf8", "#38bdf8"];

export default function Analytics() {
  const [trend, setTrend] = useState([]);
  const [types, setTypes] = useState([]);
  const [protocolDist, setProtocolDist] = useState([]);
  const [riskTrend, setRiskTrend] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const [t, ty, pd, rt, st] = await Promise.all([
        api.get("/analytics/attack-trend"),
        api.get("/analytics/attack-types"),
        api.get("/analytics/protocol-distribution"),
        api.get("/analytics/risk-trend"),
        api.get("/analytics/detection-stats"),
      ]);
      setTrend(t.data);
      setTypes(ty.data);
      setProtocolDist(pd.data);
      setRiskTrend(rt.data);
      setStats(st.data);
    })();
  }, []);

  return (
    <div>
      <div className="section-title">Security Analytics</div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {stats ? (
          <>
            <div className="glass-card"><div className="stat-label">Detection Rate</div><div className="stat-value accent">{stats.detection_rate_percent}%</div></div>
            <div className="glass-card"><div className="stat-label">Alert Resolution Rate</div><div className="stat-value">{stats.alert_resolution_rate_percent}%</div></div>
            <div className="glass-card"><div className="stat-label">Total Predictions</div><div className="stat-value">{stats.total_predictions}</div></div>
            <div className="glass-card"><div className="stat-label">False Positives</div><div className="stat-value" style={{ color: "var(--medium)" }}>{stats.false_positives}</div></div>
          </>
        ) : [1, 2, 3, 4].map((i) => <div className="glass-card" key={i}><Skeleton height={50} /></div>)}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card">
          <div className="section-title">Attack Timeline (7 days)</div>
          {trend.length === 0 ? (
            <div className="empty-state">No attack data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
                <XAxis dataKey="date" stroke="#8b98a9" fontSize={11} />
                <YAxis stroke="#8b98a9" fontSize={11} />
                <Tooltip contentStyle={{ background: "#10151f", border: "1px solid #1e2733" }} />
                <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card">
          <div className="section-title">Attack Distribution</div>
          {types.length === 0 ? (
            <div className="empty-state">No attack data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={types} dataKey="count" nameKey="attack_type" outerRadius={85} label>
                  {types.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#10151f", border: "1px solid #1e2733" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="glass-card">
          <div className="section-title">Risk Trend (7 days)</div>
          {riskTrend.length === 0 ? (
            <div className="empty-state">No prediction data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
                <XAxis dataKey="date" stroke="#8b98a9" fontSize={11} />
                <YAxis stroke="#8b98a9" fontSize={11} />
                <Tooltip contentStyle={{ background: "#10151f", border: "1px solid #1e2733" }} />
                <Line type="monotone" dataKey="avg_risk" stroke="#ff9f43" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card">
          <div className="section-title">Protocol Distribution</div>
          {protocolDist.length === 0 ? (
            <div className="empty-state">No packet data yet — visit Packet Monitoring first.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={protocolDist} dataKey="count" nameKey="protocol" outerRadius={80} label>
                  {protocolDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#10151f", border: "1px solid #1e2733" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
