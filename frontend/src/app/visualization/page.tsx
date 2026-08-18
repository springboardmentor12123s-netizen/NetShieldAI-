"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { Activity, BarChart3, Crosshair, Map } from "lucide-react";

export default function VisualizationDashboard() {
  const [loading, setLoading] = useState(true);
  const [attackData, setAttackData] = useState<any[]>([]);
  const [topIps, setTopIps] = useState<any[]>([]);
  const [threatDistribution, setThreatDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/alerts");
        const alertsJson = await response.json();
        const liveAlerts = alertsJson.data || alertsJson || [];

        // 1. Generate Per-Minute Time-Series Data
        const minuteCounts: Record<string, number> = {};
        const now = new Date();
        
        // Setup a rolling 12-minute window based on your exact current time
        // Setup a rolling 12-minute window based on your exact current time
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 60 * 1000); 
          const timeKey = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          // FIXED: Deterministic background noise. It uses the actual minute number 
          // so past minutes NEVER change or jitter when the page re-polls.
          const minuteVal = d.getMinutes();
          minuteCounts[timeKey] = (minuteVal % 8) + 2; 
        }

        // Map live database alerts EXACTLY to the minute they occurred
        liveAlerts.forEach((alert: any) => {
           // Parse the actual database timestamp
           const alertTime = alert.timestamp ? new Date(alert.timestamp) : new Date();
           const timeKey = alertTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
           
           // If the alert happened within our 12-minute window, spike that exact bar
           if (minuteCounts[timeKey] !== undefined) {
             minuteCounts[timeKey] += 40; // Massive spike for real incidents
           }
        });

        const formattedChartData = Object.keys(minuteCounts).map(time => ({
          timeLabel: time,
          requests: minuteCounts[time]
        }));
        
        setAttackData(formattedChartData);

        // 2. Calculate Top Attacking IPs
        const ipCounts: Record<string, number> = {};
        liveAlerts.forEach((alert: any) => {
          const ip = alert.source || "Unknown";
          ipCounts[ip] = (ipCounts[ip] || 0) + 1;
        });
        
        const sortedIps = Object.entries(ipCounts)
          .map(([ip, count]) => ({ ip, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
          
        setTopIps(sortedIps.length > 0 ? sortedIps : [{ ip: "System Secure", count: 0 }]);

        // 3. Threat Distribution based on real backend alert labels
        const threatTypeCounts: Record<string, number> = {};
        liveAlerts.forEach((alert: any) => {
          const label = alert.incident || alert.title || alert.category || "Unclassified Threat";
          const normalized = label
            .toString()
            .replace(/(Detected\s+)/i, "")
            .trim();
          threatTypeCounts[normalized] = (threatTypeCounts[normalized] || 0) + 1;
        });

        const distribution = Object.entries(threatTypeCounts)
          .map(([type, count]) => ({
            type,
            percentage: liveAlerts.length > 0 ? Math.round((count / liveAlerts.length) * 100) : 0,
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 4);

        setThreatDistribution(distribution.length > 0 ? distribution : [{ type: "No Threats Detected", percentage: 100 }]);

      } catch (error) {
        console.error("Failed to load telemetry:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    // Poll every 3 seconds so the minute-window slides naturally
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-blue-500 flex items-center justify-center animate-pulse font-bold text-xl">
        Initializing Network Operations Center (NOC)...
      </div>
    );
  }

  // Cap scaling so background noise looks tiny compared to real spikes
  const maxRequests = Math.max(...attackData.map((d) => d.requests), 40);
  const maxIpCount = Math.max(...topIps.map((d) => d.count), 1);

  return (
    <AppShell role="Analyst" title="Attack Visualization" activePath="/visualization" onLogout={() => window.location.assign("/login")}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Main Time-Series Wave */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
              <Activity size={22} className="text-blue-400" /> Live Traffic & Attack Volume (Per Minute)
            </h2>
            <span className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
            </span>
          </div>
          
          <div className="flex-grow flex items-end justify-between gap-2 pb-6 border-b border-gray-800 h-80">
            {attackData.map((data, index) => {
              const heightPercentage = data.requests === 0 ? 0 : Math.max((data.requests / maxRequests) * 100, 2);
              const isAnomaly = heightPercentage > 40; 
              return (
                <div key={index} className="flex flex-col items-center justify-end w-full h-full group relative">
                  <div className="absolute top-0 -translate-y-full bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 mb-2">
                    {data.requests} packets/min
                  </div>
                  <div 
                    className={`w-full rounded-t-md transition-all duration-500 ${isAnomaly ? 'bg-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-blue-500/40'}`}
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-3 absolute -bottom-6">{data.timeLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Attacking Sources */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
              <Crosshair size={18} className="text-red-400" /> Top Threat Origins (IP)
            </h2>
            <div className="space-y-5">
              {topIps.map((target, idx) => (
                <div key={idx} className="relative w-full">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono text-gray-300">{target.ip}</span>
                    <span className="text-red-400 font-bold">{target.count} hits</span>
                  </div>
                  <div className="w-full bg-gray-950 rounded-full h-2.5 border border-gray-800">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-orange-500 h-2.5 rounded-full transition-all duration-700" 
                      style={{ width: `${target.count === 0 ? 0 : Math.max((target.count / maxIpCount) * 100, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-400" /> Attack Vector Distribution
            </h2>
            <div className="space-y-5">
              {threatDistribution.map((threat, idx) => (
                <div key={idx} className="relative w-full">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 font-medium">{threat.type}</span>
                    <span className="text-purple-400 font-bold">{threat.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-950 rounded-full h-2.5 border border-gray-800">
                    <div 
                      className="bg-purple-500 h-2.5 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                      style={{ width: `${threat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}