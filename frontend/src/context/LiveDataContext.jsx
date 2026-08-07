/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const LiveDataContext = createContext(null);

export const useLiveData = () => {
  const context = useContext(LiveDataContext);
  if (!context) {
    throw new Error("useLiveData must be used within a LiveDataProvider");
  }
  return context;
};

export const LiveDataProvider = ({ children }) => {
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState(null);
  const [trafficHistory, setTrafficHistory] = useState([]);
  const [liveStats, setLiveStats] = useState({
    totalPackets: 0,
    activeFlows: 0,
    expiredFlows: 0,
    totalPredictions: 0,
    attackCount: 0,
    normalTraffic: 0,
    criticalThreats: 0,
    averageRiskScore: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only start polling if authenticated
    const isAuth = localStorage.getItem("netshield_auth") === "true";
    if (!isAuth) return;

    const fetchLive = async () => {
      try {
        const [statsRes, predsRes] = await Promise.all([
          api.get("/live/flow-statistics"),
          api.get("/live/predictions")
        ]);
        
        const rawStats = statsRes.data;
        const preds = predsRes.data.predictions || [];
        
        const attackCount = preds.filter(p => p.predicted_class !== "BENIGN").length;
        const normalTraffic = preds.filter(p => p.predicted_class === "BENIGN").length;
        const criticalThreats = preds.filter(p => p.severity === "Critical" || p.severity === "High").length;
        const avgRisk = preds.length > 0 
          ? Math.round(preds.reduce((acc, p) => acc + (p.risk_score || 0), 0) / preds.length) 
          : 0;

        setStats(rawStats);
        setPredictions(preds);
        setLiveStats({
          totalPackets: rawStats.total_processed_packets || 0,
          activeFlows: rawStats.active_flows_count || 0,
          expiredFlows: rawStats.total_expired_flows || 0,
          totalPredictions: preds.length,
          attackCount,
          normalTraffic,
          criticalThreats,
          averageRiskScore: avgRisk,
        });

        const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTrafficHistory(prev => {
          const next = [...prev, { time: now, packets: rawStats.total_processed_packets || 0, predictions: preds.length }];
          return next.slice(-30);
        });
        
        setError(null);
      } catch (err) {
        console.error("Live data fetch error:", err);
        setError(err.message);
      }
    };
    
    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LiveDataContext.Provider value={{ predictions, stats, trafficHistory, liveStats, error }}>
      {children}
    </LiveDataContext.Provider>
  );
};
